from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.models.blood_request import BloodRequest
from app.models.donor import Donor
from app.models.request_match import RequestMatch
from app.models.notification import Notification
from app.models.donor_response import DonorResponse
from app.models.enums import (
    RequestStatus,
    DonorResponseStatus,
    NotificationChannel,
    NotificationStatus,
)
from app.services.compatibility import compatible_donor_groups
from app.services.distance import haversine_km

router = APIRouter(prefix="/api", tags=["Matching"])

# ---------- Schemas ----------


class MatchOut(BaseModel):
    match_id: int
    donor_id: int
    blood_group: str
    distance_km: Optional[float]
    is_available: bool
    status: str  # PENDING / ACCEPTED / REJECTED

    model_config = {"from_attributes": True}


class MatchListOut(BaseModel):
    request_id: int
    matches: List[MatchOut]


# ---------- Helper ----------


def _notify(
    db: Session,
    user_id: int,
    donor_id: Optional[int],
    request_id: Optional[int],
    title: str,
    message: str,
):
    notif = Notification(
        recipient_user_id=user_id,
        donor_id=donor_id,
        request_id=request_id,
        channel=NotificationChannel.IN_APP,
        status=NotificationStatus.SENT,
        title=title,
        message=message,
    )
    db.add(notif)


# ---------- Endpoints ----------


@router.get("/requests/{request_id}/matches", response_model=MatchListOut)
def get_matches(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    req = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.created_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access these matches")

    # Find or generate matches
    existing = (
        db.query(RequestMatch).filter(RequestMatch.request_id == request_id).all()
    )

    if not existing:
        # Generate matches: find compatible available donors
        compatible_groups = compatible_donor_groups(req.blood_group.value)
        donors = (
            db.query(Donor)
            .filter(
                Donor.blood_group.in_(compatible_groups),
                Donor.is_available == True,
                Donor.is_eligible == True,
            )
            .all()
        )

        for donor in donors:
            dist = haversine_km(
                req.latitude, req.longitude, donor.latitude, donor.longitude
            )
            match = RequestMatch(
                request_id=req.id,
                donor_id=donor.id,
                distance_km=round(dist, 3),
                is_notified=False,
            )
            db.add(match)
            # Notify donor
            _notify(
                db,
                donor.user_id,
                donor.id,
                req.id,
                "New Blood Request Match",
                f"You are a blood group match for a {req.blood_group.value} request in {req.latitude},{req.longitude}. Please respond.",
            )

        db.commit()
        existing = (
            db.query(RequestMatch).filter(RequestMatch.request_id == request_id).all()
        )

    # Build response with status from donor_responses
    result = []
    for m in existing:
        response = (
            db.query(DonorResponse)
            .filter(
                DonorResponse.request_id == request_id,
                DonorResponse.donor_id == m.donor_id,
            )
            .first()
        )
        status_str = "PENDING"
        if response:
            status_str = response.status.value

        result.append(
            MatchOut(
                match_id=m.id,
                donor_id=m.donor_id,
                blood_group=m.donor.blood_group.value,
                distance_km=float(m.distance_km) if m.distance_km is not None else None,
                is_available=m.donor.is_available,
                status=status_str,
            )
        )

    # Sort by distance
    result.sort(key=lambda x: x.distance_km or float("inf"))
    return MatchListOut(request_id=request_id, matches=result)


@router.post("/matches/{match_id}/accept")
def accept_match(
    match_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    match = db.query(RequestMatch).filter(RequestMatch.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    # Verify the current user IS the donor for this match
    donor = (
        db.query(Donor)
        .filter(Donor.id == match.donor_id, Donor.user_id == current_user.id)
        .first()
    )
    if not donor:
        raise HTTPException(
            status_code=403, detail="You are not the donor for this match"
        )

    # Check no existing response
    existing = (
        db.query(DonorResponse)
        .filter(
            DonorResponse.request_id == match.request_id,
            DonorResponse.donor_id == match.donor_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=409, detail=f"Already responded: {existing.status.value}"
        )

    response = DonorResponse(
        request_id=match.request_id,
        donor_id=match.donor_id,
        status=DonorResponseStatus.ACCEPTED,
    )
    db.add(response)

    # Update request status
    req = match.request
    req.status = RequestStatus.MATCHING

    # Notify requester
    if req.created_by_user_id:
        _notify(
            db,
            req.created_by_user_id,
            match.donor_id,
            req.id,
            "Donor Accepted",
            f"A donor with blood group {donor.blood_group.value} has accepted your request.",
        )

    db.commit()
    return {
        "detail": "Match accepted",
        "request_id": match.request_id,
        "donor_id": match.donor_id,
    }


@router.post("/matches/{match_id}/reject")
def reject_match(
    match_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    match = db.query(RequestMatch).filter(RequestMatch.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    donor = (
        db.query(Donor)
        .filter(Donor.id == match.donor_id, Donor.user_id == current_user.id)
        .first()
    )
    if not donor:
        raise HTTPException(
            status_code=403, detail="You are not the donor for this match"
        )

    existing = (
        db.query(DonorResponse)
        .filter(
            DonorResponse.request_id == match.request_id,
            DonorResponse.donor_id == match.donor_id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=409, detail=f"Already responded: {existing.status.value}"
        )

    response = DonorResponse(
        request_id=match.request_id,
        donor_id=match.donor_id,
        status=DonorResponseStatus.DECLINED,
    )
    db.add(response)

    # Notify requester
    if match.request.created_by_user_id:
        _notify(
            db,
            match.request.created_by_user_id,
            match.donor_id,
            match.request_id,
            "Donor Declined",
            f"A donor has declined your blood request.",
        )

    db.commit()
    return {
        "detail": "Match rejected",
        "request_id": match.request_id,
        "donor_id": match.donor_id,
    }
