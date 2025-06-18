from typing import Dict, Any, Optional
from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.sql import func
from app.database.connection import Base

class CompanyAnalysis(Base):
    __tablename__ = "company_analysis"
    
    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(255), nullable=False, index=True)
    canonical_name = Column(String(255), nullable=True, index=True)
    search_query = Column(String(255), nullable=False)
    analysis_result = Column(JSONB, nullable=False)
    status = Column(String(50), nullable=False, default="success")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self) -> str:
        return f"<CompanyAnalysis(id={self.id}, company_name='{self.company_name}')>"