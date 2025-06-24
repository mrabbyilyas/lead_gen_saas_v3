from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from app.database.models import CompanyAnalysis
from app.utils.logger import logger
from app.utils.helpers import sanitize_company_name

def find_exact_match(db: Session, company_name: str) -> Optional[CompanyAnalysis]:
    """Find exact company match (case-insensitive)"""
    sanitized_name = sanitize_company_name(company_name)
    
    result = db.query(CompanyAnalysis).filter(
        func.lower(CompanyAnalysis.company_name) == sanitized_name
    ).first()
    
    if result:
        logger.info(f"Found exact match for '{company_name}': {result.canonical_name}")
    
    return result

def find_fuzzy_matches(db: Session, company_name: str, similarity_threshold: float = 0.75) -> List[CompanyAnalysis]:
    """Find fuzzy matches using basic pattern matching (Azure PostgreSQL compatible)"""
    sanitized_name = sanitize_company_name(company_name)
    
    # Use LIKE pattern matching instead of similarity function
    query = text(""" 
        SELECT * FROM company_analysis 
        WHERE 
            LOWER(company_name) LIKE :partial_pattern 
            OR LOWER(company_name) LIKE :reverse_pattern 
            OR LOWER(canonical_name) LIKE :partial_pattern 
            OR LOWER(canonical_name) LIKE :reverse_pattern 
        ORDER BY 
            CASE 
                WHEN LOWER(company_name) = :search_term THEN 1 
                WHEN LOWER(canonical_name) = :search_term THEN 2 
                WHEN LOWER(company_name) LIKE :partial_pattern THEN 3 
                WHEN LOWER(canonical_name) LIKE :partial_pattern THEN 4 
                ELSE 5 
            END, 
            LENGTH(company_name) 
    """)
    
    results = db.execute(query, { 
        "partial_pattern": f"%{sanitized_name}%", 
        "reverse_pattern": f"{sanitized_name}%", 
        "search_term": sanitized_name 
    }).fetchall()
    
    # Convert to CompanyAnalysis objects
    matches = []
    for row in results:
        match = db.query(CompanyAnalysis).filter(CompanyAnalysis.id == row.id).first()
        if match:
            matches.append(match)
    
    if matches:
        logger.info(f"Found {len(matches)} fuzzy matches for '{company_name}'")
    
    return matches

def get_best_match(matches: List[CompanyAnalysis], search_term: str, min_similarity: float = 0.85) -> Optional[CompanyAnalysis]:
    """Get the best match from fuzzy results"""
    if not matches:
        return None
    
    # For now, just return the first match (already ordered by similarity)
    # In future, could implement more sophisticated scoring
    best_match = matches[0]
    
    logger.info(f"Selected best match for '{search_term}': {best_match.canonical_name}")
    return best_match

def save_company_analysis(
    db: Session, 
    company_name: str, 
    search_query: str, 
    analysis_result: Dict[str, Any]
) -> CompanyAnalysis:
    """Save company analysis to database"""
    
    # Extract canonical name from analysis result
    canonical_name = None
    if "company_basic_info" in analysis_result:
        canonical_name = analysis_result["company_basic_info"].get("company_legal_name")
    
    company_record = CompanyAnalysis(
        company_name=sanitize_company_name(company_name),
        canonical_name=canonical_name,
        search_query=search_query,
        analysis_result=analysis_result,
        status="success"
    )
    
    try:
        db.add(company_record)
        db.commit()
        db.refresh(company_record)
        logger.info(f"Saved analysis for '{company_name}' with ID: {company_record.id}")
        return company_record
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to save analysis for '{company_name}': {e}")
        raise

def search_company(db: Session, company_name: str) -> Dict[str, Any]:
    """Main company search logic with fuzzy matching"""
    original_query = company_name
    
    # Step 1: Exact match
    exact_match = find_exact_match(db, company_name)
    if exact_match:
        return {
            "found_existing": True,
            "company": exact_match,
            "match_type": "exact"
        }
    
    # Step 2: Fuzzy matching
    fuzzy_matches = find_fuzzy_matches(db, company_name)
    
    if len(fuzzy_matches) == 1:
        return {
            "found_existing": True,
            "company": fuzzy_matches[0],
            "match_type": "fuzzy_single"
        }
    elif len(fuzzy_matches) > 1:
        best_match = get_best_match(fuzzy_matches, company_name)
        if best_match:
            return {
                "found_existing": True,
                "company": best_match,
                "match_type": "fuzzy_best",
                "alternatives": [m.canonical_name for m in fuzzy_matches[:5]]
            }
    
    # Step 3: No matches found
    return {
        "found_existing": False,
        "company": None,
        "match_type": "none"
    }