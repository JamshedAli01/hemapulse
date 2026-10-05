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
from app.models.enums import BloodGroup, RequestStatus, RequestUrgency, UserRole
from app.services.matching import create_request_matches

router = APIRouter(prefix="/api/requests", tags=["Blood Requests"])

# ---------- Schemas ----------


class RequestCreate(BaseModel):
    hospital_id: int
    blood_group: BloodGroup
    units_required: int
    required_before: datetime
    description: str
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
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

    model_config = {"from_attributes": True}


# ---------- Endpoints ----------


def _request_response(
    request: BloodRequest, current_user: User, db: Session
) -> dict:
    response = RequestOut.model_validate(request).model_dump()
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
    if req.created_by_user_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="Not authorized to modify this request"
        )

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(req, field, value)

    db.commit()
    db.refresh(req)
    return req
