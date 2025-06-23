from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Database
    DATABASE_HOST: str = os.getenv("DATABASE_HOST", "localhost")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "postgres")
    DATABASE_PORT: int = int(os.getenv("DATABASE_PORT", "5432"))
    DATABASE_USER: str = os.getenv("DATABASE_USER", "postgres")
    DATABASE_PASSWORD: str = os.getenv("DATABASE_PASSWORD", "")
    
    # Auth
    CLIENT_ID: str = os.getenv("CLIENT_ID", "")
    CLIENT_SECRET: str = os.getenv("CLIENT_SECRET", "")
    TOKEN_EXPIRE_HOURS: int = 24
    
    # Gemini
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # App
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    @property
    def database_url(self) -> str:
        return f"postgresql+psycopg://{self.DATABASE_USER}:{self.DATABASE_PASSWORD}@{self.DATABASE_HOST}:{self.DATABASE_PORT}/{self.DATABASE_NAME}"

settings = Settings()