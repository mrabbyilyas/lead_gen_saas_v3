from fastapi import APIRouter, HTTPException
from app.schemas.auth import TokenRequest, TokenResponse
from app.core.auth import create_access_token
from app.utils.exceptions import AuthenticationError
from app.utils.logger import logger

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/token", response_model=TokenResponse)
async def get_access_token(request: TokenRequest) -> TokenResponse:
    """Generate access token for API authentication"""
    try:
        token_data = create_access_token(request.client_id, request.client_secret)
        return TokenResponse(**token_data)
    except AuthenticationError as e:
        logger.warning(f"Authentication failed: {e.message}")
        raise HTTPException(status_code=e.status_code, detail=e.message)
    except Exception as e:
        logger.error(f"Unexpected error in token generation: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")