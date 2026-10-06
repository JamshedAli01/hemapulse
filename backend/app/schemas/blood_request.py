from pydantic import BaseModel, Field, ConfigDict
from app.models.enums import (
    BloodGroup,
    DonorResponseStatus,
    RequestStatus,
    RequestUrgency,
)
from datetime import datetime
from typing import Optional


class BloodRequestCreate(BaseModel):
    hospital_id: int
    blood_group: BloodGroup
    units_required: int = Field(..., gt=0)
    required_before: datetime
    description: str
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)


class BloodRequestUpdate(BaseModel):
    blood_group: Optional[BloodGroup] = None
    units_required: Optional[int] = Field(None, gt=0)
    required_before: Optional[datetime] = None
    description: Optional[str] = None
    status: Optional[RequestStatus] = None
    urgency: Optional[RequestUrgency] = None


class VerifyRequest(BaseModel):
    verified: bool
    notes: Optional[str] = None


class BloodRequestResponse(BaseModel):
    id: int
    hospital_id: int
    created_by_user_id: Optional[int]
    blood_group: BloodGroup
    units_required: int
    units_fulfilled: int
    required_before: datetime
    description: str
    latitude: float
    longitude: float
    status: RequestStatus
    urgency: RequestUrgency
    verified: bool
    verification_notes: Optional[str]
    verified_at: Optional[datetime]
    verified_by_user_id: Optional[int]
    cancelled_at: Optional[datetime]
    fulfilled_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    current_user_response_status: Optional[DonorResponseStatus] = None
    committed_donor_count: int = 0
    units_scheduled: int = 0
    units_remaining_capacity: int = 0

    model_config = ConfigDict(from_attributes=True)
