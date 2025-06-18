from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from datetime import datetime

class CompanySearchRequest(BaseModel):
    company_name: str

class CompanySearchResponse(BaseModel):
    id: int
    company_name: str
    canonical_name: Optional[str]
    analysis_result: Dict[str, Any]
    status: str
    created_at: datetime

class CompanyNotFoundResponse(BaseModel):
    error: str
    message: str
    suggestions: Optional[List[str]] = None