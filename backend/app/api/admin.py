from fastapi import APIRouter, HTTPException, Depends, Header
from app.schemas.admin import UpdateGeminiKeyRequest, UpdateGeminiKeyResponse
from app.core.gemini_client import update_gemini_api_key
from app.core.auth import validate_token
from app.utils.logger import logger
from app.utils.exceptions import AuthenticationError

router = APIRouter(prefix="/admin", tags=["admin"])

def get_current_token(authorization: str = Header(...)) -> str:
    """Extract and validate bearer token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    if not validate_token(token):
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return token

@router.put("/gemini-key", response_model=UpdateGeminiKeyResponse)
async def update_gemini_key(
    request: UpdateGeminiKeyRequest,
    token: str = Depends(get_current_token)
) -> UpdateGeminiKeyResponse:
    """Update Gemini API key"""
    try:
        update_gemini_api_key(request.new_gemini_api_key)
        logger.info("Gemini API key updated via admin endpoint")
        return UpdateGeminiKeyResponse(message="Gemini API key updated successfully")
    except Exception as e:
        logger.error(f"Failed to update Gemini API key: {e}")
        raise HTTPException(status_code=500, detail="Failed to update API key")