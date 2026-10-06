from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from datetime import datetime, timezone

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
    # Lock the donor first, then the request.  Every acceptance path uses this
    # order, preventing two concurrent requests from reserving one donor.
    donor = (
        db.query(Donor)
        .filter(Donor.id == donor.id)
        .with_for_update()
        .one()
    )
    request = (
        db.query(BloodRequest)
        .filter(BloodRequest.id == request_id)
        .with_for_update()
        .first()
    )
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
    now = datetime.now(timezone.utc)
    if request.status in {
        RequestStatus.CANCELLED,
        RequestStatus.FULFILLED,
        RequestStatus.EXPIRED,
    } or request.required_before <= now:
        if request.required_before <= now and request.status not in {
            RequestStatus.CANCELLED,
            RequestStatus.FULFILLED,
            RequestStatus.EXPIRED,
        }:
            request.status = RequestStatus.EXPIRED
        db.rollback()
        raise HTTPException(status_code=409, detail="Request is no longer active")
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

    donor_match_notifications = (
        db.query(Notification)
        .filter(
            Notification.recipient_user_id == donor.user_id,
            Notification.donor_id == donor.id,
            Notification.request_id == request.id,
            Notification.title.in_(["Blood Request Match", "New Blood Request Match"]),
            Notification.message.contains("Please respond"),
        )
        .all()
    )
    response_message = (
        "You accepted this blood request."
        if status is DonorResponseStatus.ACCEPTED
        else "You declined this blood request."
    )
    for notification in donor_match_notifications:
        notification.message = response_message

    if status is DonorResponseStatus.ACCEPTED:
        active_other = (
            db.query(DonorResponse)
            .join(BloodRequest, BloodRequest.id == DonorResponse.request_id)
            .filter(
                DonorResponse.donor_id == donor.id,
                DonorResponse.status == DonorResponseStatus.ACCEPTED,
                DonorResponse.request_id != request.id,
                BloodRequest.status.notin_(
                    [RequestStatus.CANCELLED, RequestStatus.FULFILLED, RequestStatus.EXPIRED]
                ),
                BloodRequest.required_before > now,
            )
            .first()
        )
        if active_other:
            raise HTTPException(
                status_code=409,
                detail="Donor already has an active accepted request",
            )
        competing_notifications = (
            db.query(Notification)
            .join(BloodRequest, BloodRequest.id == Notification.request_id)
            .filter(
                Notification.donor_id == donor.id,
                Notification.recipient_user_id == donor.user_id,
                Notification.request_id != request.id,
                Notification.message.contains("Please respond"),
                BloodRequest.status.notin_(
                    [
                        RequestStatus.CANCELLED,
                        RequestStatus.FULFILLED,
                        RequestStatus.EXPIRED,
                    ]
                ),
                BloodRequest.required_before > now,
            )
            .all()
        )
        for notification in competing_notifications:
            notification.message = (
                "You are no longer available for this request because you "
                "committed to another active blood request."
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
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Donor has already responded")
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
