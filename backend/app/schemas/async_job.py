from typing import Optional, Any, Dict
from datetime import datetime
from pydantic import BaseModel


class AsyncJobCreate(BaseModel):
    company_name: str


class AsyncJobResponse(BaseModel):
    job_id: str
    status: str
    progress_message: Optional[str] = None
    created_at: datetime
    estimated_completion: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class AsyncJobStatus(BaseModel):
    job_id: str
    status: str
    progress_message: Optional[str] = None
    result: Optional[Dict[str, Any]] = None
    error_message: Optional[str] = None
    created_at: datetime
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class AsyncJobComplete(BaseModel):
    job_id: str
    status: str
    result: Dict[str, Any]
    completed_at: datetime
    
    class Config:
        from_attributes = True