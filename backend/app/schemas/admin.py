from pydantic import BaseModel

class UpdateGeminiKeyRequest(BaseModel):
    new_gemini_api_key: str
    
class UpdateGeminiKeyResponse(BaseModel):
    message: str