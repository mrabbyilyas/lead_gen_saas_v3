#!/usr/bin/env python3
"""Initialize database tables and extensions"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.connection import init_db
from app.utils.logger import logger

def main() -> None:
    """Initialize database"""
    try:
        logger.info("Initializing database...")
        init_db()
        logger.info("Database initialization completed successfully!")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()