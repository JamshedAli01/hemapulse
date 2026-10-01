from pydantic import BaseModel, ConfigDict
from app.models.enums import DonorResponseStatus
from datetime import datetime
from typing import Optional


class DonorResponseRequest(BaseModel):
    donor_id: int


class DeclineRequest(BaseModel):
    donor_id: int
    reason: Optional[str] = None


class DonorActionResponse(BaseModel):
    id: int
    request_id: int
    donor_id: int
    status: DonorResponseStatus
    reason: Optional[str]
    responded_at: datetime

    model_config = ConfigDict(from_attributes=True)
