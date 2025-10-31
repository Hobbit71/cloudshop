"""Template routes."""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.template import NotificationTemplate
from app.schemas.template import (
    TemplateCreate,
    TemplateResponse,
    TemplateUpdate
)

router = APIRouter(prefix="/templates", tags=["templates"])


@router.post("", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(
    template_data: TemplateCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a notification template."""
    # Check if template with same name exists
    query = select(NotificationTemplate).where(NotificationTemplate.name == template_data.name)
    result = await db.execute(query)
    existing = result.scalar_one_or_none()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Template with name '{template_data.name}' already exists"
        )
    
    template = NotificationTemplate(
        name=template_data.name,
        channel=template_data.channel,
        subject_template=template_data.subject_template,
        body_template=template_data.body_template,
        variables=template_data.variables,
        description=template_data.description,
        is_active=template_data.is_active
    )
    
    db.add(template)
    await db.commit()
    await db.refresh(template)
    
    return TemplateResponse.model_validate(template)


@router.get("", response_model=List[TemplateResponse])
async def list_templates(
    channel: Optional[str] = Query(None, description="Filter by channel"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    db: AsyncSession = Depends(get_db)
):
    """List notification templates."""
    query = select(NotificationTemplate)
    
    if channel:
        query = query.where(NotificationTemplate.channel == channel)
    
    if is_active is not None:
        query = query.where(NotificationTemplate.is_active == is_active)
    
    query = query.order_by(NotificationTemplate.created_at.desc())
    
    result = await db.execute(query)
    templates = list(result.scalars().all())
    
    return [TemplateResponse.model_validate(t) for t in templates]


@router.get("/{template_name}", response_model=TemplateResponse)
async def get_template(
    template_name: str,
    db: AsyncSession = Depends(get_db)
):
    """Get a specific template by name."""
    query = select(NotificationTemplate).where(NotificationTemplate.name == template_name)
    result = await db.execute(query)
    template = result.scalar_one_or_none()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template '{template_name}' not found"
        )
    
    return TemplateResponse.model_validate(template)


@router.put("/{template_name}", response_model=TemplateResponse)
async def update_template(
    template_name: str,
    template_data: TemplateUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update a notification template."""
    query = select(NotificationTemplate).where(NotificationTemplate.name == template_name)
    result = await db.execute(query)
    template = result.scalar_one_or_none()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template '{template_name}' not found"
        )
    
    if template_data.subject_template is not None:
        template.subject_template = template_data.subject_template
    if template_data.body_template is not None:
        template.body_template = template_data.body_template
    if template_data.variables is not None:
        template.variables = template_data.variables
    if template_data.description is not None:
        template.description = template_data.description
    if template_data.is_active is not None:
        template.is_active = template_data.is_active
    
    await db.commit()
    await db.refresh(template)
    
    return TemplateResponse.model_validate(template)


@router.delete("/{template_name}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_name: str,
    db: AsyncSession = Depends(get_db)
):
    """Delete a notification template."""
    query = select(NotificationTemplate).where(NotificationTemplate.name == template_name)
    result = await db.execute(query)
    template = result.scalar_one_or_none()
    
    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template '{template_name}' not found"
        )
    
    await db.delete(template)
    await db.commit()
    
    return None

