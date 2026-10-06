from datetime import date, datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.models.donor import Donor
from app.models.enums import BloodGroup
from app.models.enums import DonorResponseStatus, RequestStatus
from app.models.blood_request import BloodRequest
from app.models.donor_response import DonorResponse
from app.models.request_match import RequestMatch
from app.services.location import is_valid_pakistan_location
from app.services.request_lifecycle import effective_request_status

router = APIRouter(prefix="/api/donors", tags=["Donors"])

# ---------- Schemas ----------


class DonorCreate(BaseModel):
    blood_group: BloodGroup
    date_of_birth: date
    city: str
    latitude: float
    longitude: float
    is_available: bool = True
    last_donation_date: Optional[date] = None


class DonorUpdate(BaseModel):
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    is_available: Optional[bool] = None
    last_donation_date: Optional[date] = None


class DonorOut(BaseModel):
    id: int
    user_id: int
    blood_group: str
    date_of_birth: date
    city: str
    latitude: float
    longitude: float
    is_available: bool
    is_eligible: bool
    last_donation_date: Optional[date]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------- Endpoints ----------


@router.post("", response_model=DonorOut, status_code=201)
@router.post("/profile", response_model=DonorOut, status_code=201)
def create_donor_profile(
    payload: DonorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if not is_valid_pakistan_location(payload.latitude, payload.longitude):
        raise HTTPException(status_code=422, detail="Donor coordinates must be within Pakistan")
    existing = db.query(Donor).filter(Donor.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Donor profile already exists")

    donor = Donor(
        user_id=current_user.id,
        blood_group=payload.blood_group,
        date_of_birth=payload.date_of_birth,
        city=payload.city,
        latitude=payload.latitude,
        longitude=payload.longitude,
        is_available=payload.is_available,
        last_donation_date=payload.last_donation_date,
    )
    db.add(donor)
    db.commit()
    db.refresh(donor)
    return donor


@router.get("", response_model=DonorOut)
@router.get("/profile", response_model=DonorOut)
def get_donor_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    donor = db.query(Donor).filter(Donor.user_id == current_user.id).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor profile not found")
    return donor


@router.put("", response_model=DonorOut)
@router.put("/profile", response_model=DonorOut)
def update_donor_profile(
    payload: DonorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    donor = db.query(Donor).filter(Donor.user_id == current_user.id).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor profile not found")

    updates = payload.model_dump(exclude_unset=True)
    latitude = updates.get("latitude", donor.latitude)
    longitude = updates.get("longitude", donor.longitude)
    if not is_valid_pakistan_location(latitude, longitude):
        raise HTTPException(status_code=422, detail="Donor coordinates must be within Pakistan")
    for field, value in updates.items():
        setattr(donor, field, value)

    db.commit()
    db.refresh(donor)
    return donor


@router.get("/available", response_model=list[DonorOut])
def list_available_donors(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    donors = (
        db.query(Donor)
        .filter(Donor.is_available == True, Donor.is_eligible == True)
        .all()
    )
    return donors


@router.get("/matches")
def list_my_matches(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    donor = db.query(Donor).filter(Donor.user_id == current_user.id).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor profile not found")

    rows = (
        db.query(RequestMatch, BloodRequest, DonorResponse)
        .join(BloodRequest, BloodRequest.id == RequestMatch.request_id)
        .outerjoin(
            DonorResponse,
            (DonorResponse.request_id == RequestMatch.request_id)
            & (DonorResponse.donor_id == donor.id),
        )
        .filter(RequestMatch.donor_id == donor.id)
        .order_by(RequestMatch.matched_at.desc())
        .all()
    )
    active_statuses = {
        RequestStatus.PENDING,
        RequestStatus.VERIFIED,
        RequestStatus.MATCHING,
    }
    return [
        {
            "request_id": request.id,
            "blood_group": request.blood_group.value,
            "urgency": request.urgency.value,
            "units_required": request.units_required,
            "units_fulfilled": request.units_fulfilled,
            "hospital": request.hospital.name,
            "city": request.hospital.city,
            "address": request.hospital.address,
            "distance_km": float(match.distance_km) if match.distance_km is not None else None,
            "request_status": effective_request_status(
                request.status, request.required_before
            ).value,
            "response_status": response.status.value if response else None,
            "is_committed": bool(
                response
                and response.status == DonorResponseStatus.ACCEPTED
                and effective_request_status(
                    request.status, request.required_before
                ) in active_statuses
            ),
            "is_active_match": effective_request_status(
                request.status, request.required_before
            ) in active_statuses
            and response is None,
            "is_history_match": (
                response is not None
                and response.status == DonorResponseStatus.DECLINED
            )
            or effective_request_status(
                request.status, request.required_before
            ) == RequestStatus.EXPIRED,
        }
        for match, request, response in rows
    ]
