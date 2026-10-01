from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional


class HospitalRequest(BaseModel):
    name: str
    address: str
    city: str
    phone: Optional[str] = None
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)


class HospitalResponse(BaseModel):
    id: int
    name: str
    address: str
    city: str
    phone: Optional[str]
    latitude: float
    longitude: float
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
