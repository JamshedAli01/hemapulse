from pydantic import BaseModel, Field, ConfigDict
from app.models.enums import DonationStatus, ConfirmationMethod
from typing import Optional
from datetime import datetime


class DonationCreate(BaseModel):
    request_id: int
    donor_id: int
    units: int = Field(..., gt=0)


class ConfirmDonation(BaseModel):
    confirmation_method: ConfirmationMethod


class ConfirmQR(BaseModel):
    qr_token: str


class DonationResponse(BaseModel):
    id: int
    request_id: int
    donor_id: int
    units: int
    status: DonationStatus
    confirmation_method: Optional[ConfirmationMethod]
    scheduled_at: datetime
    confirmed_at: Optional[datetime]
    confirmed_by_user_id: Optional[int]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
