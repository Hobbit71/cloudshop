"""Email notification service using SendGrid."""
import logging
from typing import Optional, Dict, Any
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, Content
from app.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending email notifications via SendGrid."""
    
    def __init__(self):
        """Initialize email service."""
        if settings.sendgrid_api_key:
            self.client = SendGridAPIClient(api_key=settings.sendgrid_api_key)
        else:
            self.client = None
            logger.warning("SendGrid API key not configured. Email service will be disabled.")
    
    async def send(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        from_email: Optional[str] = None,
        from_name: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Send an email.
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML email content
            text_content: Plain text email content (optional)
            from_email: Sender email (defaults to configured value)
            from_name: Sender name (defaults to configured value)
            metadata: Additional metadata for tracking
            
        Returns:
            Dict with status and response data
        """
        if not settings.enable_email:
            logger.info("Email notifications are disabled")
            return {"status": "disabled", "success": False}
        
        if not self.client:
            logger.error("SendGrid client not initialized")
            return {"status": "error", "success": False, "error": "SendGrid not configured"}
        
        try:
            from_email = from_email or settings.sendgrid_from_email
            from_name = from_name or settings.sendgrid_from_name
            
            message = Mail(
                from_email=Email(from_email, from_name),
                to_emails=to_email,
                subject=subject,
                html_content=Content("text/html", html_content)
            )
            
            if text_content:
                message.plain_text_content = Content("text/plain", text_content)
            
            # Add tracking metadata if provided
            if metadata:
                message.custom_args = {k: str(v) for k, v in metadata.items()}
            
            response = self.client.send(message)
            
            logger.info(f"Email sent successfully to {to_email}. Status: {response.status_code}")
            
            return {
                "status": "success",
                "success": True,
                "status_code": response.status_code,
                "headers": dict(response.headers) if hasattr(response, 'headers') else {}
            }
        
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return {
                "status": "error",
                "success": False,
                "error": str(e)
            }

