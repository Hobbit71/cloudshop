"""Request logging middleware."""
import logging
import time
from fastapi import Request

logger = logging.getLogger(__name__)


async def logger_middleware(request: Request, call_next):
    """Log request and response."""
    start_time = time.time()
    
    # Log request
    logger.info(
        f"Request: {request.method} {request.url.path} - "
        f"Client: {request.client.host if request.client else 'Unknown'}"
    )
    
    try:
        response = await call_next(request)
        
        # Calculate process time
        process_time = time.time() - start_time
        
        # Log response
        logger.info(
            f"Response: {request.method} {request.url.path} - "
            f"Status: {response.status_code} - "
            f"Time: {process_time:.3f}s"
        )
        
        return response
    except Exception as e:
        process_time = time.time() - start_time
        logger.error(
            f"Error: {request.method} {request.url.path} - "
            f"Exception: {str(e)} - "
            f"Time: {process_time:.3f}s"
        )
        raise

