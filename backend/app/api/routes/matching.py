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
from app.models.hospital import Hospital
from app.models.enums import (
    RequestStatus,
    DonorResponseStatus,
    NotificationChannel,
    NotificationStatus,
    UserRole,
)
from app.schemas.matching import EscalateRequest
from app.services.matching import create_request_matches
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


def _get_request(request_id: int, db: Session) -> BloodRequest:
    request = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    return request


def _can_manage_request(request: BloodRequest, current_user: User) -> bool:
    return (
        request.created_by_user_id == current_user.id
        or current_user.role == UserRole.ADMIN
    )


def _get_or_create_matches(request: BloodRequest, db: Session) -> List[RequestMatch]:
    existing = (
        db.query(RequestMatch).filter(RequestMatch.request_id == request.id).all()
    )
    if not existing:
        create_request_matches(db, request)
        db.commit()
        existing = (
            db.query(RequestMatch).filter(RequestMatch.request_id == request.id).all()
        )
    return existing


def _match_list(request: BloodRequest, db: Session) -> MatchListOut:
    result = []
    for match in _get_or_create_matches(request, db):
        response = (
            db.query(DonorResponse)
            .filter(
                DonorResponse.request_id == request.id,
                DonorResponse.donor_id == match.donor_id,
            )
            .first()
        )
        status_str = response.status.value if response else "PENDING"
        result.append(
            MatchOut(
                match_id=match.id,
                donor_id=match.donor_id,
                blood_group=match.donor.blood_group.value,
                distance_km=(
                    float(match.distance_km)
                    if match.distance_km is not None
                    else None
                ),
                is_available=match.donor.is_available,
                status=status_str,
            )
        )
    result.sort(key=lambda item: item.distance_km or float("inf"))
    return MatchListOut(request_id=request.id, matches=result)


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
    req = _get_request(request_id, db)
    if not _can_manage_request(req, current_user):
        raise HTTPException(status_code=403, detail="Not authorized to access these matches")
    return _match_list(req, db)


@router.post("/matching/{request_id}/run", response_model=MatchListOut)
def run_matching(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    request = _get_request(request_id, db)
    if not _can_manage_request(request, current_user):
        raise HTTPException(status_code=403, detail="Not authorized to run matching")
    return _match_list(request, db)


@router.get("/matching/{request_id}", response_model=MatchListOut)
def get_matching(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    request = _get_request(request_id, db)
    if not _can_manage_request(request, current_user):
        raise HTTPException(status_code=403, detail="Not authorized to access matching")
    return _match_list(request, db)


@router.post("/matching/{request_id}/escalate")
def escalate_matching(
    request_id: int,
    payload: EscalateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    request = _get_request(request_id, db)
    if not _can_manage_request(request, current_user):
        raise HTTPException(status_code=403, detail="Not authorized to escalate matching")
    matches_before = len(_get_or_create_matches(request, db))
    matches_after = len(_get_or_create_matches(request, db))
    return {
        "matched_count": matches_after,
        "notified_count": max(0, matches_after - matches_before),
        "next_radius_km": payload.next_radius_km,
    }


@router.post("/matching/{request_id}/stop")
def stop_matching(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    request = _get_request(request_id, db)
    if not _can_manage_request(request, current_user):
        raise HTTPException(status_code=403, detail="Not authorized to stop matching")
    return {"detail": "Matching stopped", "request_id": request.id}


@router.get("/matching/{request_id}/map")
def get_map_data(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    request = _get_request(request_id, db)
    if not _can_manage_request(request, current_user):
        raise HTTPException(status_code=403, detail="Not authorized to access map data")

    donors = []
    for match in _get_or_create_matches(request, db):
        donor = match.donor
        donors.append(
            {
                "id": donor.id,
                "latitude": donor.latitude,
                "longitude": donor.longitude,
                "distance_km": float(match.distance_km) if match.distance_km is not None else haversine_km(
                    request.latitude, request.longitude, donor.latitude, donor.longitude
                ),
                "blood_group": donor.blood_group.value,
            }
        )

    hospitals = []
    for hospital in db.query(Hospital).all():
        hospitals.append(
            {
                "id": hospital.id,
                "name": hospital.name,
                "latitude": hospital.latitude,
                "longitude": hospital.longitude,
                "distance_km": haversine_km(
                    request.latitude,
                    request.longitude,
                    hospital.latitude,
                    hospital.longitude,
                ),
            }
        )

    return {
        "request_location": {
            "latitude": request.latitude,
            "longitude": request.longitude,
        },
        "donors": donors,
        "hospitals": hospitals,
    }


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
