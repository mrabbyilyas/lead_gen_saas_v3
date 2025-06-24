from typing import Optional

class APIException(Exception):
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class AuthenticationError(APIException):
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, 401)

class CompanyNotFoundError(APIException):
    def __init__(self, message: str = "Company not found"):
        super().__init__(message, 404)

class GeminiAPIError(APIException):
    def __init__(self, message: str = "Gemini API error"):
        super().__init__(message, 503)

class DatabaseError(APIException):
    def __init__(self, message: str = "Database error"):
        super().__init__(message, 500)