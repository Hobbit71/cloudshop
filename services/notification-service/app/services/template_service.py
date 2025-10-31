"""Template service for rendering notification templates."""
import logging
from typing import Dict, Any, Optional
from string import Template
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.template import NotificationTemplate

logger = logging.getLogger(__name__)


class TemplateService:
    """Service for managing and rendering notification templates."""
    
    async def get_template(
        self,
        db: AsyncSession,
        template_name: str
    ) -> Optional[NotificationTemplate]:
        """
        Get a template by name.
        
        Args:
            db: Database session
            template_name: Template name
            
        Returns:
            Template or None if not found
        """
        query = select(NotificationTemplate).where(
            NotificationTemplate.name == template_name,
            NotificationTemplate.is_active == True
        )
        
        result = await db.execute(query)
        return result.scalar_one_or_none()
    
    async def render_template(
        self,
        db: AsyncSession,
        template_name: str,
        variables: Dict[str, Any]
    ) -> Optional[Dict[str, str]]:
        """
        Render a template with variables.
        
        Args:
            db: Database session
            template_name: Template name
            variables: Variables to substitute in template
            
        Returns:
            Dict with 'subject' and 'body' or None if template not found
        """
        template = await self.get_template(db, template_name)
        
        if not template:
            logger.warning(f"Template '{template_name}' not found or inactive")
            return None
        
        try:
            # Convert all variables to strings for template substitution
            str_variables = {k: str(v) for k, v in variables.items()}
            
            # Render body template
            body_template = Template(template.body_template)
            rendered_body = body_template.safe_substitute(**str_variables)
            
            # Render subject template if exists
            rendered_subject = None
            if template.subject_template:
                subject_template = Template(template.subject_template)
                rendered_subject = subject_template.safe_substitute(**str_variables)
            
            return {
                "subject": rendered_subject,
                "body": rendered_body,
                "channel": template.channel
            }
        
        except Exception as e:
            logger.error(f"Error rendering template '{template_name}': {str(e)}")
            return None

