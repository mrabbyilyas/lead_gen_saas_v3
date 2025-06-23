import uuid
import threading
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal
from app.database.models import AsyncJob, CompanyAnalysis
from app.core.gemini_client import generate_company_analysis
from app.core.search_engine import search_company, save_company_analysis
from app.utils.logger import logger
from app.utils.exceptions import GeminiAPIError


def generate_job_id() -> str:
    """Generate unique job ID"""
    return f"job_{uuid.uuid4().hex[:12]}"


def create_async_job(company_name: str) -> str:
    """Create new async job and return job_id"""
    job_id = generate_job_id()
    
    db = SessionLocal()
    try:
        job = AsyncJob(
            job_id=job_id,
            company_name=company_name,
            status="processing",
            progress_message="Starting company analysis..."
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        
        logger.info(f"🚀 Created async job: {job_id} for company: {company_name}")
        
        # Start background processing
        thread = threading.Thread(
            target=process_company_analysis_async,
            args=(job_id, company_name),
            daemon=True
        )
        thread.start()
        
        return job_id
        
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create async job: {e}")
        raise
    finally:
        db.close()


def get_job_status(job_id: str) -> Optional[Dict[str, Any]]:
    """Get current job status"""
    db = SessionLocal()
    try:
        job = db.query(AsyncJob).filter(AsyncJob.job_id == job_id).first()
        if not job:
            return None
        
        result = {
            "job_id": job.job_id,
            "status": job.status,
            "progress_message": job.progress_message,
            "created_at": job.created_at,
            "completed_at": job.completed_at
        }
        
        if job.status == "completed" and job.result:
            result["result"] = job.result
        elif job.status == "failed" and job.error_message:
            result["error_message"] = job.error_message
            
        return result
        
    except Exception as e:
        logger.error(f"Error getting job status: {e}")
        return None
    finally:
        db.close()


def update_job_progress(job_id: str, progress_message: str) -> None:
    """Update job progress message"""
    db = SessionLocal()
    try:
        job = db.query(AsyncJob).filter(AsyncJob.job_id == job_id).first()
        if job:
            job.progress_message = progress_message
            db.commit()
            logger.info(f"📝 Job {job_id} progress: {progress_message}")
    except Exception as e:
        logger.error(f"Error updating job progress: {e}")
        db.rollback()
    finally:
        db.close()


def complete_job_success(job_id: str, result: Dict[str, Any]) -> None:
    """Mark job as completed with result"""
    db = SessionLocal()
    try:
        job = db.query(AsyncJob).filter(AsyncJob.job_id == job_id).first()
        if job:
            job.status = "completed"
            job.result = result
            job.completed_at = datetime.now(timezone.utc)
            job.progress_message = "Analysis completed successfully"
            db.commit()
            logger.info(f"✅ Job {job_id} completed successfully")
    except Exception as e:
        logger.error(f"Error completing job: {e}")
        db.rollback()
    finally:
        db.close()


def complete_job_failure(job_id: str, error_message: str) -> None:
    """Mark job as failed with error"""
    db = SessionLocal()
    try:
        job = db.query(AsyncJob).filter(AsyncJob.job_id == job_id).first()
        if job:
            job.status = "failed"
            job.error_message = error_message
            job.completed_at = datetime.now(timezone.utc)
            job.progress_message = "Analysis failed"
            db.commit()
            logger.error(f"❌ Job {job_id} failed: {error_message}")
    except Exception as e:
        logger.error(f"Error marking job as failed: {e}")
        db.rollback()
    finally:
        db.close()


def process_company_analysis_async(job_id: str, company_name: str) -> None:
    """Background processing of company analysis"""
    try:
        logger.info(f"🔄 Starting background processing for job {job_id}: {company_name}")
        
        # Update progress
        update_job_progress(job_id, "Checking existing records...")
        
        # Check for existing records (same logic as synchronous version)
        db = SessionLocal()
        try:
            search_result = search_company(db, company_name)
            
            if search_result["found_existing"]:
                logger.info(f"Found existing analysis for '{company_name}' in job {job_id}")
                company = search_result["company"]
                
                result = {
                    "id": company.id,
                    "company_name": company.company_name,
                    "canonical_name": company.canonical_name,
                    "analysis_result": company.analysis_result,
                    "status": company.status,
                    "created_at": company.created_at.isoformat()
                }
                
                complete_job_success(job_id, result)
                return
                
        finally:
            db.close()
        
        # Generate new analysis
        update_job_progress(job_id, "Generating AI analysis with Gemini...")
        logger.info(f"Generating new analysis for '{company_name}' in job {job_id}")
        
        # This is the long-running Gemini call that was causing timeouts
        analysis_result = generate_company_analysis(company_name)
        
        update_job_progress(job_id, "Saving analysis to database...")
        
        # Save to database
        db = SessionLocal()
        try:
            company_record = save_company_analysis(db, company_name, company_name, analysis_result)
            
            result = {
                "id": company_record.id,
                "company_name": company_record.company_name,
                "canonical_name": company_record.canonical_name,
                "analysis_result": company_record.analysis_result,
                "status": company_record.status,
                "created_at": company_record.created_at.isoformat()
            }
            
            complete_job_success(job_id, result)
            
        finally:
            db.close()
            
    except GeminiAPIError as e:
        error_msg = f"Gemini API error: {e.message}"
        logger.error(f"Job {job_id} failed: {error_msg}")
        complete_job_failure(job_id, error_msg)
        
    except Exception as e:
        error_msg = f"Unexpected error: {str(e)}"
        logger.error(f"Job {job_id} failed: {error_msg}")
        complete_job_failure(job_id, error_msg)