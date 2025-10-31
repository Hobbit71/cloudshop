"""Custom exceptions."""
from fastapi import HTTPException, status


class NotificationServiceException(HTTPException):
    """Base exception for notification service."""
    
    def __init__(self, message: str, status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR):
        super().__init__(status_code=status_code, detail=message)


class NotificationNotFoundError(NotificationServiceException):
    """Raised when notification is not found."""
    
    def __init__(self, notification_id: int):
        super().__init__(
            f"Notification {notification_id} not found",
            status_code=status.HTTP_404_NOT_FOUND
        )


class TemplateNotFoundError(NotificationServiceException):
    """Raised when template is not found."""
    
    def __init__(self, template_name: str):
        super().__init__(
            f"Template '{template_name}' not found",
            status_code=status.HTTP_404_NOT_FOUND
        )


class InvalidChannelError(NotificationServiceException):
    """Raised when notification channel is invalid."""
    
    def __init__(self, channel: str):
        super().__init__(
            f"Invalid notification channel: {channel}",
            status_code=status.HTTP_400_BAD_REQUEST
        )


def notification_service_exception_handler(request, exc: NotificationServiceException):
    """Exception handler for NotificationServiceException."""
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "type": exc.__class__.__name__}
    )

