from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from app.config import settings
from app.utils.logger import logger

# Updated connection string for psycopg (version 3)
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_recycle=300,
    echo=settings.DEBUG,
    # Add these for better compatibility
    connect_args={
        "sslmode": "require",  # Azure PostgreSQL requires SSL
        "connect_timeout": 10,
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
        # Test connection first
        with engine.connect() as conn:
            logger.info("Database connection successful")
            
            # Enable pg_trgm extension for similarity search
            try:
                conn.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm;")
                conn.commit()
                logger.info("pg_trgm extension enabled")
            except Exception as e:
                logger.warning(f"Could not enable pg_trgm extension: {e}")
        
        Base.metadata.create_all(bind=engine)
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise