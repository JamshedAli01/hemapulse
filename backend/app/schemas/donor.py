from pydantic import BaseModel, Field, ConfigDict
from app.models.enums import BloodGroup
from datetime import date, datetime
from typing import Optional


class DonorRequest(BaseModel):
    user_id: int
    blood_group: BloodGroup
    date_of_birth: date
    city: str
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    is_available: bool = True
    is_eligible: bool = True
    last_donation_date: Optional[date] = None


class DonorAvailabilityUpdate(BaseModel):
    is_available: bool


class DonorResponse(BaseModel):
    id: int
    user_id: int
    blood_group: BloodGroup
    date_of_birth: date
    city: str
    latitude: float
    longitude: float
    is_available: bool
    is_eligible: bool
    last_donation_date: Optional[date]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
