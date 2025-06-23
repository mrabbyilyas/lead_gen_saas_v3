import os
from fastapi import FastAPI, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from app.database.connection import init_db
from app.core.auth import cleanup_expired_tokens
from app.api import auth, admin, companies
from app.utils.logger import logger
from app.utils.exceptions import APIException
from app.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan events"""
    # Startup
    logger.info("Starting Company Analysis API...")
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down Company Analysis API...")
    cleanup_expired_tokens()

app = FastAPI(
    title="Company Analysis API",
    description="MVP API for company intelligence analysis using Gemini AI",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware - allow all origins for now to fix CORS issues
allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
)

# Exception handlers
@app.exception_handler(APIException)
async def api_exception_handler(request: Request, exc: APIException):
    return HTTPException(status_code=exc.status_code, detail=exc.message)

# Include routers
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(companies.router)

@app.get("/")
async def root():
    return {
        "message": "Company Analysis API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/stats")
async def get_stats(authorization: str = Header(...)):
    """Get database statistics"""
    from app.core.auth import validate_token
    from app.database.connection import get_db
    from app.database.models import CompanyAnalysis
    from sqlalchemy.orm import Session
    from sqlalchemy import func, Integer, Float
    from datetime import datetime, timedelta
    
    # Validate token
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    if not validate_token(token):
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # Get database session
    db_gen = get_db()
    db: Session = next(db_gen)
    
    try:
        # Get total companies
        total_companies = db.query(CompanyAnalysis).count()
        
        # Get high score leads (you can adjust the criteria)
        high_score_leads = db.query(CompanyAnalysis).filter(
            CompanyAnalysis.analysis_result.op('->>')('diversity_score').cast(Integer) > 3
        ).count()
        
        # Get average score
        avg_result = db.query(
            func.avg(CompanyAnalysis.analysis_result.op('->>')('diversity_score').cast(Float))
        ).scalar()
        average_score = round(float(avg_result or 0), 1)
        
        # Get success rate
        success_count = db.query(CompanyAnalysis).filter(
            CompanyAnalysis.status == 'success'
        ).count()
        success_rate = round((success_count / total_companies * 100) if total_companies > 0 else 0)
        
        # Get recent analyses (last 30 days)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_analyses_count = db.query(CompanyAnalysis).filter(
            CompanyAnalysis.created_at >= thirty_days_ago
        ).count()
        
        return {
            "total_companies": total_companies,
            "high_score_leads": high_score_leads,
            "average_score": average_score,
            "success_rate": success_rate,
            "recent_analyses_count": recent_analyses_count
        }
        
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )