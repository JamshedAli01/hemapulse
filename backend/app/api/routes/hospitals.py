from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.models.hospital import Hospital

router = APIRouter(prefix="/api/hospitals", tags=["Hospitals"])

class HospitalOut(BaseModel):
    id: int
    name: str
    address: str
    city: str
    latitude: float
    longitude: float
    contact_phone: str | None = None
    contact_email: str | None = None

    model_config = {"from_attributes": True}

class HospitalCreate(BaseModel):
    name: str
    address: str
    city: str
    latitude: float
    longitude: float
    contact_phone: str | None = None
    contact_email: str | None = None

@router.get("", response_model=List[HospitalOut])
def list_hospitals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    return db.query(Hospital).all()

@router.post("", response_model=HospitalOut)
def create_hospital(
    hospital_in: HospitalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    hospital = Hospital(**hospital_in.model_dump())
    db.add(hospital)
    db.commit()
    db.refresh(hospital)
    return hospital

@router.get("/{hospital_id}", response_model=HospitalOut)
def get_hospital(
    hospital_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return hospital
