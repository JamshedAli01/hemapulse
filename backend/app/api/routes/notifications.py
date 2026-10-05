from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.models.notification import Notification
from app.models.enums import NotificationStatus
from app.models.blood_request import BloodRequest
from app.models.donor import Donor
from app.schemas.notification import SendNotificationRequest

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


class NotificationOut(BaseModel):
    id: int
    title: Optional[str]
    message: str
    status: str
    request_id: Optional[int]
    created_at: datetime

    model_config = {"from_attributes": True}


@router.get("", response_model=List[NotificationOut])
def list_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return (
        db.query(Notification)
        .filter(Notification.recipient_user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )


@router.post("/{request_id}/send")
def send_notifications(
    request_id: int,
    payload: SendNotificationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    request = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    if request.created_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to send notifications")

    donors = db.query(Donor).filter(Donor.id.in_(payload.donor_ids)).all()
    donors_by_id = {donor.id: donor for donor in donors}
    missing = sorted(set(payload.donor_ids) - set(donors_by_id))
    if missing:
        raise HTTPException(status_code=404, detail=f"Donor not found: {missing[0]}")

    for donor in donors:
        db.add(
            Notification(
                recipient_user_id=donor.user_id,
                donor_id=donor.id,
                request_id=request.id,
                channel=payload.channel,
                status=NotificationStatus.SENT,
                title="Blood Request Match",
                message="You are matched to a blood request. Please respond.",
                sent_at=datetime.now(timezone.utc),
            )
        )
    db.commit()
    return {"sent_count": len(donors)}


@router.patch("/{notification_id}/read")
def mark_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    notif = (
        db.query(Notification)
        .filter(
            Notification.id == notification_id,
            Notification.recipient_user_id == current_user.id,
        )
        .first()
    )
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")

    notif.status = NotificationStatus.READ
    notif.read_at = datetime.now(timezone.utc)
    db.commit()
    return {"detail": "Marked as read"}
