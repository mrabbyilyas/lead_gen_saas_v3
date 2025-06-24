import time
import secrets
from typing import Any, Dict
from datetime import datetime, timedelta

def generate_token() -> str:
    """Generate a random token"""
    return secrets.token_urlsafe(32)

def is_token_expired(created_at: datetime, expire_hours: int = 24) -> bool:
    """Check if token is expired"""
    return datetime.now() > created_at + timedelta(hours=expire_hours)

def exponential_backoff_delay(attempt: int) -> float:
    """Calculate exponential backoff delay"""
    return min(2 ** attempt, 16)  # Max 16 seconds

def sanitize_company_name(name: str) -> str:
    """Sanitize company name for search"""
    return name.strip().lower()