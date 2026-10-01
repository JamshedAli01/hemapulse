from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class EscalateRequest(BaseModel):
    current_radius_km: float
    next_radius_km: float
    batch_size: int


class RequestMatchResponse(BaseModel):
    id: int
    request_id: int
    donor_id: int
    distance_km: Optional[float]
    compatibility_score: Optional[float]
    availability_score: Optional[float]
    urgency_score: Optional[float]
    total_score: Optional[float]
    rank: Optional[int]
    radius_km: Optional[float]
    batch_number: Optional[int]
    is_notified: bool
    matched_at: datetime

    model_config = ConfigDict(from_attributes=True)
