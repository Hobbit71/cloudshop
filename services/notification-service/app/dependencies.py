"""FastAPI dependencies."""
from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.config import settings

async def get_database(session: AsyncSession = Depends(get_db)) -> AsyncSession:
    """Get database session dependency."""
    return session


async def verify_auth(authorization: str = Header(None)):
    """
    Verify authentication token.
    
    In a real implementation, this would verify JWT tokens
    with the auth service.
    """
    if not settings.jwt_secret:
        # If JWT is not configured, allow all requests (development mode)
        return {"user_id": "anonymous"}
    
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header"
        )
    
    token = authorization.replace("Bearer ", "")
    # TODO: Implement JWT verification with auth service
    # For now, return a mock user
    return {"user_id": "user_from_token"}

