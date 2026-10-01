from pydantic import BaseModel, ConfigDict
from app.models.enums import NotificationChannel, NotificationStatus
from typing import List, Optional
from datetime import datetime


class SendNotificationRequest(BaseModel):
    donor_ids: List[int]
    channel: NotificationChannel


class NotificationResponse(BaseModel):
    id: int
    request_id: Optional[int]
    donor_id: Optional[int]
    recipient_user_id: Optional[int]
    channel: NotificationChannel
    status: NotificationStatus
    title: Optional[str]
    message: str
    sent_at: Optional[datetime]
    read_at: Optional[datetime]
    failure_reason: Optional[str]
    external_message_id: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
