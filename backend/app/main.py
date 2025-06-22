import os
from fastapi import FastAPI, HTTPException, Request
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

# CORS middleware - configurable for production
allowed_origins = [
    "http://localhost:3000",  # Local development
    "http://127.0.0.1:3000",  # Local development alternative
]

# Add production origins from environment variables
if not settings.DEBUG:
    # Production CORS origins
    frontend_url = os.getenv("FRONTEND_URL")
    if frontend_url:
        allowed_origins.append(frontend_url)
    # Add common Vercel pattern
    vercel_app = os.getenv("VERCEL_APP_NAME")
    if vercel_app:
        allowed_origins.append(f"https://{vercel_app}.vercel.app")
else:
    # Development mode - allow all origins
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )