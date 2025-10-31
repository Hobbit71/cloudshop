"""SMS notification service using Twilio."""
import logging
from typing import Optional, Dict, Any
from twilio.rest import Client
from app.config import settings

logger = logging.getLogger(__name__)


class SMSService:
    """Service for sending SMS notifications via Twilio."""
    
    def __init__(self):
        """Initialize SMS service."""
        if settings.twilio_account_sid and settings.twilio_auth_token:
            self.client = Client(
                settings.twilio_account_sid,
                settings.twilio_auth_token
            )
        else:
            self.client = None
            logger.warning("Twilio credentials not configured. SMS service will be disabled.")
    
    async def send(
        self,
        to_phone: str,
        message: str,
        from_phone: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Send an SMS.
        
        Args:
            to_phone: Recipient phone number (E.164 format)
            message: SMS message content
            from_phone: Sender phone number (defaults to configured value)
            metadata: Additional metadata for tracking
            
        Returns:
            Dict with status and response data
        """
        if not settings.enable_sms:
            logger.info("SMS notifications are disabled")
            return {"status": "disabled", "success": False}
        
        if not self.client:
            logger.error("Twilio client not initialized")
            return {"status": "error", "success": False, "error": "Twilio not configured"}
        
        try:
            from_phone = from_phone or settings.twilio_from_number
            
            if not from_phone:
                return {
                    "status": "error",
                    "success": False,
                    "error": "Twilio from number not configured"
                }
            
            twilio_message = self.client.messages.create(
                body=message,
                from_=from_phone,
                to=to_phone
            )
            
            logger.info(f"SMS sent successfully to {to_phone}. SID: {twilio_message.sid}")
            
            return {
                "status": "success",
                "success": True,
                "sid": twilio_message.sid,
                "status_code": twilio_message.status,
                "price": twilio_message.price,
                "price_unit": twilio_message.price_unit
            }
        
        except Exception as e:
            logger.error(f"Failed to send SMS to {to_phone}: {str(e)}")
            return {
                "status": "error",
                "success": False,
                "error": str(e)
            }

