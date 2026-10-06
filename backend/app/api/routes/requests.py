from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.db.session import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.models.blood_request import BloodRequest
from app.models.hospital import Hospital
from app.models.donor import Donor
from app.models.request_match import RequestMatch
from app.models.donor_response import DonorResponse
from app.models.donation import Donation
from app.models.enums import DonationStatus, DonorResponseStatus
from app.models.enums import BloodGroup, RequestStatus, RequestUrgency, UserRole
from app.services.matching import create_request_matches
from app.services.location import is_valid_pakistan_location
from app.services.request_lifecycle import effective_request_status

router = APIRouter(prefix="/api/requests", tags=["Blood Requests"])

# ---------- Schemas ----------


class RequestCreate(BaseModel):
    hospital_id: int
    blood_group: BloodGroup
    units_required: int
    required_before: datetime
    description: str
    latitude: float = Field(..., ge=23.5, le=37.5)
    longitude: float = Field(..., ge=60.5, le=77.5)
    urgency: RequestUrgency = RequestUrgency.MEDIUM


class RequestUpdate(BaseModel):
    status: Optional[RequestStatus] = None
    urgency: Optional[RequestUrgency] = None
    description: Optional[str] = None
    units_required: Optional[int] = None


class HospitalSummary(BaseModel):
    id: int
    name: str
    city: str

    model_config = {"from_attributes": True}


class CurrentUserDonation(BaseModel):
    id: int
    units: int
    status: DonationStatus
    scheduled_at: datetime
    confirmed_at: Optional[datetime]

    model_config = {"from_attributes": True}


class RequestOut(BaseModel):
    id: int
    hospital_id: int
    created_by_user_id: Optional[int]
    blood_group: str
    units_required: int
    units_fulfilled: int
    required_before: datetime
    description: str
    latitude: float
    longitude: float
    status: str
    urgency: str
    verified: bool
    created_at: datetime
    updated_at: datetime
    hospital: HospitalSummary
    is_requester: bool = False
    is_matched_donor: bool = False
    current_user_response_status: Optional[DonorResponseStatus] = None
    committed_donor_count: int = 0
    units_scheduled: int = 0
    units_remaining_capacity: int = 0
    current_user_donation: Optional[CurrentUserDonation] = None

    model_config = {"from_attributes": True}


# ---------- Endpoints ----------


def _request_response(
    request: BloodRequest, current_user: User, db: Session
) -> dict:
    response = RequestOut.model_validate(request).model_dump()
    response["status"] = effective_request_status(
        request.status, request.required_before
    ).value
    response["is_requester"] = request.created_by_user_id == current_user.id
    response["is_matched_donor"] = (
        db.query(RequestMatch)
        .join(Donor, RequestMatch.donor_id == Donor.id)
        .filter(
            RequestMatch.request_id == request.id,
            Donor.user_id == current_user.id,
        )
        .first()
        is not None
    )
    response["committed_donor_count"] = (
        db.query(DonorResponse)
        .filter(
            DonorResponse.request_id == request.id,
            DonorResponse.status == DonorResponseStatus.ACCEPTED,
        )
        .count()
    )
    scheduled_units = (
        db.query(Donation.units)
        .filter(
            Donation.request_id == request.id,
            Donation.status == DonationStatus.SCHEDULED,
        )
        .all()
    )
    response["units_scheduled"] = sum(units for (units,) in scheduled_units)
    response["units_remaining_capacity"] = max(
        request.units_required - request.units_fulfilled - response["units_scheduled"],
        0,
    )

    donor = db.query(Donor).filter(Donor.user_id == current_user.id).first()
    if donor:
        donor_response = (
            db.query(DonorResponse)
            .filter(
                DonorResponse.request_id == request.id,
                DonorResponse.donor_id == donor.id,
            )
            .first()
        )
        response["current_user_response_status"] = (
            donor_response.status if donor_response else None
        )
        response["current_user_donation"] = (
            db.query(Donation)
            .filter(
                Donation.request_id == request.id,
                Donation.donor_id == donor.id,
                Donation.status != DonationStatus.CANCELLED,
            )
            .order_by(Donation.created_at.desc())
            .first()
        )
    return response


@router.post("", response_model=RequestOut, status_code=201)
def create_request(
    payload: RequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if payload.units_required < 1:
        raise HTTPException(status_code=400, detail="units_required must be at least 1")

    hospital = db.query(Hospital).filter(Hospital.id == payload.hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    if not is_valid_pakistan_location(payload.latitude, payload.longitude):
        raise HTTPException(status_code=422, detail="Request coordinates must be within Pakistan")
    if not is_valid_pakistan_location(hospital.latitude, hospital.longitude):
        raise HTTPException(
            status_code=422,
            detail="The selected hospital has invalid coordinates; choose another hospital",
        )

    req = BloodRequest(
        hospital_id=payload.hospital_id,
        created_by_user_id=current_user.id,
        blood_group=payload.blood_group,
        units_required=payload.units_required,
        required_before=payload.required_before,
        description=payload.description,
        latitude=payload.latitude,
        longitude=payload.longitude,
        urgency=payload.urgency,
        status=RequestStatus.PENDING,
    )
    db.add(req)
    db.flush()
    create_request_matches(db, req)
    db.commit()
    db.refresh(req)
    return _request_response(req, current_user, db)


@router.get("", response_model=List[RequestOut])
def list_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    requests = (
        db.query(BloodRequest)
        .filter(BloodRequest.created_by_user_id == current_user.id)
        .order_by(BloodRequest.created_at.desc())
        .all()
    )
    return [_request_response(request, current_user, db) for request in requests]


@router.get("/{request_id}", response_model=RequestOut)
def get_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    req = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    return _request_response(req, current_user, db)


@router.post("/{request_id}/cancel", response_model=RequestOut)
def cancel_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    req = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.created_by_user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this request")
    if req.status in {RequestStatus.CANCELLED, RequestStatus.FULFILLED}:
        raise HTTPException(status_code=409, detail="Request can no longer be cancelled")

    req.status = RequestStatus.CANCELLED
    req.cancelled_at = datetime.now(timezone.utc)
    for notification in req.notifications:
        if notification.message and "Please respond" in notification.message:
            notification.message = (
                "This request was cancelled and no longer needs a response."
            )
    db.commit()
    db.refresh(req)
    return _request_response(req, current_user, db)


@router.patch("/{request_id}", response_model=RequestOut)
def update_request(
    request_id: int,
    payload: RequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    req = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.created_by_user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=403, detail="Not authorized to modify this request"
        )

    updates = payload.model_dump(exclude_unset=True)
    if "status" in updates and updates["status"] not in {req.status}:
        raise HTTPException(
            status_code=400,
            detail="Use the dedicated verification or cancellation action for status changes",
        )
    for field, value in updates.items():
        setattr(req, field, value)

    db.commit()
    db.refresh(req)
    return req
