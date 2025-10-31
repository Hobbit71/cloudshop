"""Custom exceptions."""
from fastapi import HTTPException, status
from typing import Any, Optional


class OrderServiceException(HTTPException):
    """Base exception for Order Service."""
    
    def __init__(
        self,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail: Any = None,
        headers: Optional[dict[str, Any]] = None,
    ) -> None:
        super().__init__(status_code=status_code, detail=detail, headers=headers)


class OrderNotFoundError(OrderServiceException):
    """Order not found exception."""
    
    def __init__(self, order_id: str) -> None:
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with id {order_id} not found"
        )


class InvalidOrderStatusError(OrderServiceException):
    """Invalid order status transition exception."""
    
    def __init__(self, current_status: str, new_status: str) -> None:
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition order from {current_status} to {new_status}"
        )


class OrderValidationError(OrderServiceException):
    """Order validation exception."""
    
    def __init__(self, detail: str) -> None:
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )


class OrderCancellationError(OrderServiceException):
    """Order cancellation exception."""
    
    def __init__(self, detail: str) -> None:
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail
        )


async def order_service_exception_handler(
    request: Any,
    exc: OrderServiceException
) -> Any:
    """Handle OrderServiceException."""
    from fastapi.responses import JSONResponse
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.__class__.__name__,
            "detail": exc.detail,
        }
    )

