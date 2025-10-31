"""Address schemas."""
from pydantic import BaseModel, Field
from typing import Optional


class AddressSchema(BaseModel):
    """Address schema."""
    street: str = Field(..., min_length=1, max_length=200)
    city: str = Field(..., min_length=1, max_length=100)
    state: str = Field(..., min_length=2, max_length=50)
    zip_code: str = Field(..., min_length=5, max_length=10)
    country: str = Field(default="US", min_length=2, max_length=50)
    apartment: Optional[str] = Field(None, max_length=50)
    
    class Config:
        json_schema_extra = {
            "example": {
                "street": "123 Main St",
                "city": "New York",
                "state": "NY",
                "zip_code": "10001",
                "country": "US",
                "apartment": "Apt 4B"
            }
        }

