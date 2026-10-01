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


@router.post("/profile", response_model=DonorOut, status_code=201)
def create_donor_profile(
    payload: DonorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
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


@router.get("/profile", response_model=DonorOut)
def get_donor_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    donor = db.query(Donor).filter(Donor.user_id == current_user.id).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor profile not found")
    return donor


@router.put("/profile", response_model=DonorOut)
def update_donor_profile(
    payload: DonorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    donor = db.query(Donor).filter(Donor.user_id == current_user.id).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor profile not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
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
