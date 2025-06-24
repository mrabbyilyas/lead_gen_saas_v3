from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from app.config import settings
from app.utils.logger import logger

# Optimized connection string for psycopg (version 3) with enhanced pooling
engine = create_engine(
    settings.database_url,
    # Connection pool optimization
    pool_size=20,          # Increase pool size for concurrent requests
    max_overflow=30,       # Allow overflow connections during peak
    pool_pre_ping=True,    # Verify connections before use
    pool_recycle=3600,     # Recycle connections every hour (was 300)
    pool_timeout=30,       # Wait time for connection from pool
    echo=settings.DEBUG,
    # Enhanced connection arguments for Azure PostgreSQL
    connect_args={
        "sslmode": "require",              # Azure PostgreSQL requires SSL
        "connect_timeout": 20,             # Increased connection timeout
        "server_settings": {
            "application_name": "LeadIntel-Backend",
            "tcp_keepalives_idle": "600",
            "tcp_keepalives_interval": "30",
            "tcp_keepalives_count": "3",
        }
    }
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def init_db() -> None:
    """Initialize database tables"""
    try:
        # Import models to ensure they're registered with metadata
        from app.database.models import CompanyAnalysis, AccessToken, AsyncJob
        
        # Test connection first
        with engine.connect() as conn:
            logger.info("Database connection successful")
            
            # Enable pg_trgm extension for similarity search
            try:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS pg_trgm;"))
                conn.commit()
                logger.info("pg_trgm extension enabled")
            except Exception as e:
                logger.warning(f"Could not enable pg_trgm extension: {e}")
        
        Base.metadata.create_all(bind=engine)
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise