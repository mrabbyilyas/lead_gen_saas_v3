from typing import Dict, Optional, Any
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from app.config import settings
from app.utils.helpers import generate_token, is_token_expired
from app.utils.exceptions import AuthenticationError
from app.utils.logger import logger
from app.database.connection import SessionLocal
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
    # Use timezone-aware UTC to match database timezone handling
    now_utc = datetime.now(timezone.utc)
    expires_at = now_utc + timedelta(hours=settings.TOKEN_EXPIRE_HOURS)
    
    # Store token in database
    db = SessionLocal()
    try:
        db_token = AccessToken(
            token=token,
            client_id=client_id,
            expires_at=expires_at
        )
        db.add(db_token)
        db.commit()
        db.refresh(db_token)  # Ensure the token is properly committed
        
        logger.info(f"Token created for client_id: {client_id}, expires at: {expires_at} UTC")
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
    logger.info(f"🔍 VALIDATING TOKEN: '{token}' (length: {len(token)})")
    
    db = SessionLocal()
    try:
        # Test database connection first
        logger.info(f"📊 Database connection established for token validation")
        
        # Log all tokens in database for comparison
        all_tokens = db.query(AccessToken).all()
        logger.info(f"📋 Found {len(all_tokens)} tokens in database:")
        for i, t in enumerate(all_tokens):
            logger.info(f"  {i+1}. Token: '{t.token}' (len: {len(t.token)}, expires: {t.expires_at})")
            # Character-by-character comparison for debugging
            if t.token == token:
                logger.info(f"  ✅ EXACT MATCH found for token {i+1}")
            else:
                logger.info(f"  ❌ No match - comparing chars:")
                min_len = min(len(token), len(t.token))
                for j in range(min_len):
                    if token[j] != t.token[j]:
                        logger.info(f"    Diff at pos {j}: incoming='{token[j]}' vs db='{t.token[j]}'")
                        break
        
        # Perform the actual query
        db_token = db.query(AccessToken).filter(AccessToken.token == token).first()
        
        if not db_token:
            logger.error(f"❌ TOKEN NOT FOUND: '{token}' (checked {len(all_tokens)} database tokens)")
            return False
        
        # Check if token is expired (use timezone-aware UTC to match database)
        current_time = datetime.now(timezone.utc)
        logger.info(f"⏰ Time check: current={current_time} UTC, expires={db_token.expires_at}")
        
        if current_time > db_token.expires_at:
            logger.error(f"⏰ TOKEN EXPIRED: {token[:10]}... (current: {current_time} UTC, expired at: {db_token.expires_at})")
            # Clean up expired token
            db.delete(db_token)
            db.commit()
            return False
        
        logger.info(f"✅ TOKEN VALIDATED SUCCESSFULLY: {token[:10]}... (current: {current_time} UTC, expires at: {db_token.expires_at})")
        return True
    except Exception as e:
        logger.error(f"💥 Error validating token: {e}")
        import traceback
        logger.error(f"💥 Traceback: {traceback.format_exc()}")
        return False
    finally:
        db.close()

def cleanup_expired_tokens() -> None:
    """Clean up expired tokens"""
    db = SessionLocal()
    try:
        # Use timezone-aware UTC to match database timezone
        current_time = datetime.now(timezone.utc)
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