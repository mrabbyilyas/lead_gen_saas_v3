from typing import Dict, Optional, Any
from datetime import datetime
from app.config import settings
from app.utils.helpers import generate_token, is_token_expired
from app.utils.exceptions import AuthenticationError
from app.utils.logger import logger

# In-memory token storage for MVP
active_tokens: Dict[str, Dict[str, datetime]] = {}

def authenticate_credentials(client_id: str, client_secret: str) -> bool:
    """Validate client credentials"""
    return (
        client_id == settings.CLIENT_ID and 
        client_secret == settings.CLIENT_SECRET
    )

def create_access_token(client_id: str, client_secret: str) -> Dict[str, Any]:
    """Create new access token"""
    if not authenticate_credentials(client_id, client_secret):
        logger.warning(f"Failed authentication attempt for client_id: {client_id}")
        raise AuthenticationError("Invalid credentials")
    
    token = generate_token()
    active_tokens[token] = {
        "created_at": datetime.now(),
        "client_id": client_id
    }
    
    logger.info(f"Token created for client_id: {client_id}")
    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": settings.TOKEN_EXPIRE_HOURS * 3600
    }

def validate_token(token: str) -> bool:
    """Validate access token"""
    if token not in active_tokens:
        return False
    
    token_data = active_tokens[token]
    if is_token_expired(token_data["created_at"], settings.TOKEN_EXPIRE_HOURS):
        # Clean up expired token
        del active_tokens[token]
        return False
    
    return True

def cleanup_expired_tokens() -> None:
    """Clean up expired tokens"""
    expired_tokens = [
        token for token, data in active_tokens.items()
        if is_token_expired(data["created_at"], settings.TOKEN_EXPIRE_HOURS)
    ]
    
    for token in expired_tokens:
        del active_tokens[token]
    
    if expired_tokens:
        logger.info(f"Cleaned up {len(expired_tokens)} expired tokens")