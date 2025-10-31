"""Dependency injection."""
from typing import Optional
from uuid import UUID
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db


async def get_current_user_id(
    x_user_id: Optional[str] = Header(None, alias="X-User-Id")
) -> UUID:
    """
    Extract user ID from header.
    
    Args:
        x_user_id: User ID from header
        
    Returns:
        UUID: User ID
        
    Raises:
        HTTPException: If user ID is missing or invalid
    """
    if not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not provided"
        )
    
    try:
        return UUID(x_user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )


async def get_db_session(
    db: AsyncSession = Depends(get_db)
) -> AsyncSession:
    """
    Get database session dependency.
    
    Args:
        db: Database session
        
    Returns:
        AsyncSession: Database session
    """
    return db

