"""Push notification service using Firebase Cloud Messaging (FCM)."""
import logging
from typing import Optional, Dict, Any, List
import httpx
from app.config import settings

logger = logging.getLogger(__name__)


class PushService:
    """Service for sending push notifications via FCM."""
    
    def __init__(self):
        """Initialize push notification service."""
        self.fcm_server_key = settings.fcm_server_key
        self.fcm_endpoint = "https://fcm.googleapis.com/fcm/send"
        
        if not self.fcm_server_key:
            logger.warning("FCM server key not configured. Push service will be disabled.")
    
    async def send(
        self,
        device_token: str,
        title: str,
        body: str,
        data: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Send a push notification to a single device.
        
        Args:
            device_token: FCM device token
            title: Notification title
            body: Notification body
            data: Additional data payload
            metadata: Additional metadata for tracking
            
        Returns:
            Dict with status and response data
        """
        if not settings.enable_push:
            logger.info("Push notifications are disabled")
            return {"status": "disabled", "success": False}
        
        if not self.fcm_server_key:
            logger.error("FCM server key not configured")
            return {"status": "error", "success": False, "error": "FCM not configured"}
        
        try:
            headers = {
                "Authorization": f"key={self.fcm_server_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "to": device_token,
                "notification": {
                    "title": title,
                    "body": body
                }
            }
            
            if data:
                payload["data"] = data
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.fcm_endpoint,
                    headers=headers,
                    json=payload,
                    timeout=10.0
                )
                response.raise_for_status()
                result = response.json()
            
            success = result.get("success", 0) > 0
            
            logger.info(f"Push notification sent. Success: {success}")
            
            return {
                "status": "success" if success else "error",
                "success": success,
                "message_id": result.get("results", [{}])[0].get("message_id") if result.get("results") else None,
                "error": result.get("results", [{}])[0].get("error") if not success and result.get("results") else None
            }
        
        except Exception as e:
            logger.error(f"Failed to send push notification: {str(e)}")
            return {
                "status": "error",
                "success": False,
                "error": str(e)
            }
    
    async def send_multicast(
        self,
        device_tokens: List[str],
        title: str,
        body: str,
        data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Send push notifications to multiple devices.
        
        Args:
            device_tokens: List of FCM device tokens
            title: Notification title
            body: Notification body
            data: Additional data payload
            
        Returns:
            Dict with status and results
        """
        if not settings.enable_push:
            logger.info("Push notifications are disabled")
            return {"status": "disabled", "success": False}
        
        if not self.fcm_server_key:
            logger.error("FCM server key not configured")
            return {"status": "error", "success": False, "error": "FCM not configured"}
        
        try:
            headers = {
                "Authorization": f"key={self.fcm_server_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "registration_ids": device_tokens,
                "notification": {
                    "title": title,
                    "body": body
                }
            }
            
            if data:
                payload["data"] = data
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.fcm_endpoint,
                    headers=headers,
                    json=payload,
                    timeout=10.0
                )
                response.raise_for_status()
                result = response.json()
            
            success_count = result.get("success", 0)
            failure_count = result.get("failure", 0)
            
            logger.info(f"Push notifications sent. Success: {success_count}, Failed: {failure_count}")
            
            return {
                "status": "success",
                "success": True,
                "success_count": success_count,
                "failure_count": failure_count,
                "results": result.get("results", [])
            }
        
        except Exception as e:
            logger.error(f"Failed to send multicast push notifications: {str(e)}")
            return {
                "status": "error",
                "success": False,
                "error": str(e)
            }

