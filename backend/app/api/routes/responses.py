from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user
from app.db.session import get_db
from app.models.blood_request import BloodRequest
from app.models.donor import Donor
from app.models.donor_response import DonorResponse
from app.models.enums import DonorResponseStatus
from app.models.enums import NotificationChannel, NotificationStatus, RequestStatus
from app.models.notification import Notification
from app.models.request_match import RequestMatch
from app.models.user import User
from app.schemas.donor_response import DeclineRequest, DonorResponseRequest

router = APIRouter(prefix="/api/responses", tags=["Donor Responses"])


def _resolve_donor(
    payload_donor_id: int, current_user: User, db: Session
) -> Donor:
    donor = (
        db.query(Donor)
        .filter(Donor.user_id == current_user.id)
        .first()
    )
    if not donor or payload_donor_id not in {donor.id, donor.user_id}:
        raise HTTPException(status_code=403, detail="You are not the specified donor")
    return donor


def _record_response(
    request_id: int,
    donor: Donor,
    status: DonorResponseStatus,
    reason: str | None,
    db: Session,
):
    request = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    match = (
        db.query(RequestMatch)
        .filter(
            RequestMatch.request_id == request_id,
            RequestMatch.donor_id == donor.id,
        )
        .first()
    )
    if not match:
        raise HTTPException(status_code=404, detail="Donor is not matched to this request")
    existing = (
        db.query(DonorResponse)
        .filter(
            DonorResponse.request_id == request_id,
            DonorResponse.donor_id == donor.id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=409, detail=f"Already responded: {existing.status.value}"
        )

    response = DonorResponse(
        request_id=request_id,
        donor_id=donor.id,
        status=status,
        reason=reason,
    )
    db.add(response)
    if status is DonorResponseStatus.ACCEPTED:
        request.status = RequestStatus.MATCHING
        if request.created_by_user_id:
            db.add(
                Notification(
                    recipient_user_id=request.created_by_user_id,
                    donor_id=donor.id,
                    request_id=request.id,
                    channel=NotificationChannel.IN_APP,
                    status=NotificationStatus.SENT,
                    title="Donor Accepted",
                    message="A matched donor has accepted your blood request.",
                )
            )
    elif request.created_by_user_id:
        db.add(
            Notification(
                recipient_user_id=request.created_by_user_id,
                donor_id=donor.id,
                request_id=request.id,
                channel=NotificationChannel.IN_APP,
                status=NotificationStatus.SENT,
                title="Donor Declined",
                message="A matched donor has declined your blood request.",
            )
        )
    db.commit()
    db.refresh(response)
    return response


@router.post("/{request_id}/accept")
def accept_response(
    request_id: int,
    payload: DonorResponseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    donor = _resolve_donor(payload.donor_id, current_user, db)
    return _record_response(request_id, donor, DonorResponseStatus.ACCEPTED, None, db)


@router.post("/{request_id}/decline")
def decline_response(
    request_id: int,
    payload: DeclineRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    donor = _resolve_donor(payload.donor_id, current_user, db)
    return _record_response(
        request_id, donor, DonorResponseStatus.DECLINED, payload.reason, db
    )
