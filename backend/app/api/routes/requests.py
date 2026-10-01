from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.models.blood_request import BloodRequest
from app.models.hospital import Hospital
from app.models.enums import BloodGroup, RequestStatus, RequestUrgency

router = APIRouter(prefix="/api/requests", tags=["Blood Requests"])

# ---------- Schemas ----------


class RequestCreate(BaseModel):
    hospital_id: int
    blood_group: BloodGroup
    units_required: int
    required_before: datetime
    description: str
    latitude: float
    longitude: float
    urgency: RequestUrgency = RequestUrgency.MEDIUM


class RequestUpdate(BaseModel):
    status: Optional[RequestStatus] = None
    urgency: Optional[RequestUrgency] = None
    description: Optional[str] = None
    units_required: Optional[int] = None


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

    model_config = {"from_attributes": True}


# ---------- Endpoints ----------


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
    db.commit()
    db.refresh(req)
    return req


@router.get("", response_model=List[RequestOut])
def list_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return (
        db.query(BloodRequest)
        .filter(BloodRequest.created_by_user_id == current_user.id)
        .order_by(BloodRequest.created_at.desc())
        .all()
    )


@router.get("/{request_id}", response_model=RequestOut)
def get_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    req = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    return req


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
