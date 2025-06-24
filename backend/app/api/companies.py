from typing import Union, Optional
from fastapi import APIRouter, HTTPException, Depends, Header, Query
from sqlalchemy.orm import Session
from app.schemas.company import CompanySearchRequest, CompanySearchResponse, CompanyNotFoundResponse, CompanyListResponse
from app.schemas.async_job import AsyncJobCreate, AsyncJobResponse, AsyncJobStatus
from app.database.connection import get_db
from app.database.models import CompanyAnalysis
from app.core.auth import validate_token
from app.core.search_engine import search_company, save_company_analysis
from app.core.gemini_client import generate_company_analysis
from app.core.async_processor import create_async_job, get_job_status
from app.utils.logger import logger
from app.utils.exceptions import GeminiAPIError, CompanyNotFoundError
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/companies", tags=["companies"])

def get_current_token(authorization: str = Header(...)) -> str:
    """Extract and validate bearer token"""
    logger.info(f"🔐 AUTH HEADER RECEIVED: '{authorization}' (length: {len(authorization) if authorization else 0})")
    
    if not authorization or not authorization.startswith("Bearer "):
        logger.error(f"❌ INVALID AUTH HEADER: missing or doesn't start with 'Bearer '")
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    logger.info(f"🎫 EXTRACTED TOKEN: '{token}' (length: {len(token)})")
    
    # Check for whitespace or hidden characters
    if token != token.strip():
        logger.warning(f"⚠️  TOKEN HAS WHITESPACE: before='{token}', after='{token.strip()}'")
        token = token.strip()
    
    if not validate_token(token):
        logger.error(f"❌ TOKEN VALIDATION FAILED for: '{token}'")
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    logger.info(f"✅ TOKEN AUTHENTICATION SUCCESSFUL: '{token[:10]}...'")
    return token

@router.get("", response_model=CompanyListResponse)
async def list_companies(
    search: Optional[str] = Query(None, description="Search term for company name"),
    limit: int = Query(50, ge=1, le=100, description="Number of companies to return"),
    offset: int = Query(0, ge=0, description="Number of companies to skip"),
    cursor: Optional[str] = Query(None, description="Cursor for pagination"),
    token: str = Depends(get_current_token),
    db: Session = Depends(get_db)
) -> CompanyListResponse:
    """List all companies with optimized search and pagination"""
    
    try:
        logger.info(f"Listing companies: search='{search}', limit={limit}, offset={offset}, cursor={cursor}")
        
        # Use cursor-based pagination for better performance
        query = db.query(CompanyAnalysis)
        
        # Apply cursor filter for pagination (more efficient than offset)
        if cursor:
            try:
                cursor_id = int(cursor)
                query = query.filter(CompanyAnalysis.id < cursor_id)
            except ValueError:
                logger.warning(f"Invalid cursor format: {cursor}")
        
        # Apply search filter with optimized query
        if search:
            search_term = search.strip().lower()
            
            # Use trigram similarity for fuzzy search (requires pg_trgm extension)
            from sqlalchemy import func, or_, and_
            
            # Combine exact matches (high priority) with fuzzy matches
            exact_condition = or_(
                func.lower(CompanyAnalysis.company_name).like(f"%{search_term}%"),
                func.lower(CompanyAnalysis.canonical_name).like(f"%{search_term}%")
            )
            
            # Fuzzy search using trigram similarity
            fuzzy_condition = or_(
                func.similarity(func.lower(CompanyAnalysis.company_name), search_term) > 0.3,
                func.similarity(func.lower(CompanyAnalysis.canonical_name), search_term) > 0.3
            )
            
            query = query.filter(or_(exact_condition, fuzzy_condition))
            
            # Order by relevance (exact matches first, then by similarity)
            query = query.order_by(
                func.similarity(func.lower(CompanyAnalysis.company_name), search_term).desc(),
                CompanyAnalysis.created_at.desc()
            )
        else:
            # Default ordering for non-search queries
            query = query.order_by(CompanyAnalysis.created_at.desc())
        
        # Optimize total count query - only run when needed (first page)
        total = None
        if offset == 0 and not cursor:
            # Only count on first page request for performance
            count_query = db.query(CompanyAnalysis)
            if search:
                search_term = search.strip().lower()
                from sqlalchemy import func, or_
                exact_condition = or_(
                    func.lower(CompanyAnalysis.company_name).like(f"%{search_term}%"),
                    func.lower(CompanyAnalysis.canonical_name).like(f"%{search_term}%")
                )
                fuzzy_condition = or_(
                    func.similarity(func.lower(CompanyAnalysis.company_name), search_term) > 0.3,
                    func.similarity(func.lower(CompanyAnalysis.canonical_name), search_term) > 0.3
                )
                count_query = count_query.filter(or_(exact_condition, fuzzy_condition))
            total = count_query.count()
        
        # Apply pagination - use limit + 1 to check if there are more results
        companies = query.offset(offset).limit(limit + 1).all()
        
        # Check if there are more results
        has_more = len(companies) > limit
        if has_more:
            companies = companies[:limit]  # Remove the extra record
        
        # Convert to response format with optimized list comprehension
        company_responses = [
            CompanySearchResponse(
                id=company.id,
                company_name=company.company_name,
                canonical_name=company.canonical_name,
                analysis_result=company.analysis_result,
                status=company.status,
                created_at=company.created_at
            )
            for company in companies
        ]
        
        # Generate next cursor for pagination
        next_cursor = None
        if has_more and companies:
            next_cursor = str(companies[-1].id)
        
        logger.info(f"Found {len(company_responses)} companies (has_more: {has_more})")
        
        response_data = {
            "companies": company_responses,
            "limit": limit,
            "offset": offset,
            "has_more": has_more,
            "next_cursor": next_cursor
        }
        
        # Include total only when available
        if total is not None:
            response_data["total"] = total
        
        return CompanyListResponse(**response_data)
        
    except Exception as e:
        logger.error(f"Error listing companies: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/search", response_model=Union[CompanySearchResponse, CompanyNotFoundResponse])
async def search_company_endpoint(
    request: CompanySearchRequest,
    token: str = Depends(get_current_token),
    db: Session = Depends(get_db)
) -> Union[CompanySearchResponse, CompanyNotFoundResponse]:
    """Search for company analysis with fuzzy matching and auto-generation"""
    
    try:
        company_name = request.company_name.strip()
        if not company_name:
            raise HTTPException(status_code=400, detail="Company name cannot be empty")
        
        logger.info(f"Searching for company: '{company_name}'")
        
        # Search existing records
        search_result = search_company(db, company_name)
        
        if search_result["found_existing"]:
            company = search_result["company"]
            logger.info(f"Found existing analysis for '{company_name}' (match type: {search_result['match_type']})")
            
            return CompanySearchResponse(
                id=company.id,
                company_name=company.company_name,
                canonical_name=company.canonical_name,
                analysis_result=company.analysis_result,
                status=company.status,
                created_at=company.created_at
            )
        
        # No existing record found, generate new analysis
        logger.info(f"No existing record found for '{company_name}', generating new analysis...")
        
        try:
            analysis_result = generate_company_analysis(company_name)
            
            # Save to database
            company_record = save_company_analysis(db, company_name, company_name, analysis_result)
            
            return CompanySearchResponse(
                id=company_record.id,
                company_name=company_record.company_name,
                canonical_name=company_record.canonical_name,
                analysis_result=company_record.analysis_result,
                status=company_record.status,
                created_at=company_record.created_at
            )
            
        except GeminiAPIError as e:
            logger.error(f"Gemini API error for '{company_name}': {e.message}")
            return CompanyNotFoundResponse(
                error="Company not found",
                message="Unable to find information for this company"
            )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in company search: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/{company_id}", response_model=CompanySearchResponse)
async def get_company_analysis(
    company_id: int,
    token: str = Depends(get_current_token),
    db: Session = Depends(get_db)
) -> CompanySearchResponse:
    """Get specific company analysis by ID"""
    
    try:
        company = db.query(CompanyAnalysis).filter(CompanyAnalysis.id == company_id).first()
        
        if not company:
            raise HTTPException(status_code=404, detail="Company analysis not found")
        
        return CompanySearchResponse(
            id=company.id,
            company_name=company.company_name,
            canonical_name=company.canonical_name,
            analysis_result=company.analysis_result,
            status=company.status,
            created_at=company.created_at
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving company {company_id}: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/search/async", response_model=AsyncJobResponse)
async def search_company_async(
    request: CompanySearchRequest,
    token: str = Depends(get_current_token)
) -> AsyncJobResponse:
    """Start async company search - returns immediately with job_id
    
    NOTE: Frontend should check database FIRST before calling this endpoint.
    This endpoint is ONLY for companies NOT found in database.
    """
    
    try:
        company_name = request.company_name.strip()
        if not company_name:
            raise HTTPException(status_code=400, detail="Company name cannot be empty")
        
        logger.info(f"🚀 Starting async search for NEW company: '{company_name}' (not in database)")
        
        # Create async job and start background processing
        # Frontend has already confirmed company doesn't exist in database
        job_id = create_async_job(company_name)
        
        # Estimate completion time (5 minutes)
        estimated_completion = datetime.now(timezone.utc) + timedelta(minutes=5)
        
        return AsyncJobResponse(
            job_id=job_id,
            status="processing",
            progress_message="Starting company analysis...",
            created_at=datetime.now(timezone.utc),
            estimated_completion=estimated_completion
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting async search: {e}")
        raise HTTPException(status_code=500, detail="Failed to start analysis")


@router.get("/jobs/{job_id}/status", response_model=AsyncJobStatus)
async def get_job_status_endpoint(
    job_id: str,
    token: str = Depends(get_current_token)
) -> AsyncJobStatus:
    """Get status of async job"""
    
    try:
        job_status = get_job_status(job_id)
        
        if not job_status:
            raise HTTPException(status_code=404, detail="Job not found")
        
        return AsyncJobStatus(**job_status)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting job status: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")