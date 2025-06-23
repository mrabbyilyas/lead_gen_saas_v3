from typing import Dict, Optional, Any
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.config import settings
from app.utils.helpers import generate_token, is_token_expired
from app.utils.exceptions import AuthenticationError
from app.utils.logger import logger
from app.database.connection import get_db
from app.database.models import AccessToken

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
    expires_at = datetime.now() + timedelta(hours=settings.TOKEN_EXPIRE_HOURS)
    
    # Store token in database
    db = next(get_db())
    try:
        db_token = AccessToken(
            token=token,
            client_id=client_id,
            expires_at=expires_at
        )
        db.add(db_token)
        db.commit()
        
        logger.info(f"Token created for client_id: {client_id}")
        return {
            "access_token": token,
            "token_type": "bearer",
            "expires_in": settings.TOKEN_EXPIRE_HOURS * 3600
        }
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create token: {e}")
        raise AuthenticationError("Failed to create token")
    finally:
        db.close()

def validate_token(token: str) -> bool:
    """Validate access token"""
    db = next(get_db())
    try:
        db_token = db.query(AccessToken).filter(AccessToken.token == token).first()
        
        if not db_token:
            return False
        
        # Check if token is expired
        if datetime.now() > db_token.expires_at:
            # Clean up expired token
            db.delete(db_token)
            db.commit()
            return False
        
        return True
    except Exception as e:
        logger.error(f"Error validating token: {e}")
        return False
    finally:
        db.close()

def cleanup_expired_tokens() -> None:
    """Clean up expired tokens"""
    db = next(get_db())
    try:
        current_time = datetime.now()
        expired_tokens = db.query(AccessToken).filter(AccessToken.expires_at < current_time).all()
        
        if expired_tokens:
            count = len(expired_tokens)
            for token in expired_tokens:
                db.delete(token)
            db.commit()
            logger.info(f"Cleaned up {count} expired tokens")
    except Exception as e:
        logger.error(f"Error cleaning up expired tokens: {e}")
        db.rollback()
    finally:
        db.close()