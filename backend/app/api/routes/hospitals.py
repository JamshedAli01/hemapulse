from typing import List

import httpx
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_active_user
from app.db.session import get_db
from app.models.hospital import Hospital
from app.models.user import User

router = APIRouter(prefix="/api/hospitals", tags=["Hospitals"])


class HospitalOut(BaseModel):
    id: int
    name: str
    address: str
    city: str
    latitude: float
    longitude: float
    phone: str | None = None

    model_config = {"from_attributes": True}


class HospitalCreate(BaseModel):
    name: str
    address: str
    city: str
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    phone: str | None = None


class LocationResult(BaseModel):
    name: str
    address: str
    city: str
    latitude: float
    longitude: float
    hospital_id: int | None = None


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


@router.get("/resolve", response_model=List[LocationResult])
def resolve_location(
    query: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    normalized_query = query.strip()
    if len(normalized_query) < 3:
        raise HTTPException(status_code=400, detail="Enter at least 3 characters.")

    search = f"%{normalized_query}%"
    existing = (
        db.query(Hospital)
        .filter(
            (Hospital.name.ilike(search))
            | (Hospital.address.ilike(search))
            | (Hospital.city.ilike(search))
        )
        .limit(5)
        .all()
    )
    if existing:
        return [
            LocationResult(
                hospital_id=hospital.id,
                name=hospital.name,
                address=hospital.address,
                city=hospital.city,
                latitude=hospital.latitude,
                longitude=hospital.longitude,
            )
            for hospital in existing
        ]

    try:
        response = httpx.get(
            "https://nominatim.openstreetmap.org/search",
            params={
                "q": normalized_query,
                "format": "jsonv2",
                "limit": 5,
                "addressdetails": 1,
                "countrycodes": "pk",
            },
            headers={"User-Agent": "HemaPulse/1.0 location lookup"},
            timeout=5.0,
        )
        response.raise_for_status()
        results = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise HTTPException(
            status_code=502, detail="Location lookup is temporarily unavailable."
        ) from exc

    locations: list[LocationResult] = []
    for result in results:
        try:
            latitude = float(result["lat"])
            longitude = float(result["lon"])
        except (KeyError, TypeError, ValueError):
            continue
        if not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
            continue
        address_data = result.get("address") or {}
        city = (
            address_data.get("city")
            or address_data.get("town")
            or address_data.get("village")
            or address_data.get("state")
            or ""
        )
        locations.append(
            LocationResult(
                name=(
                    address_data.get("hospital")
                    or address_data.get("amenity")
                    or result.get("name")
                    or normalized_query
                ),
                address=result.get("display_name", normalized_query),
                city=city,
                latitude=latitude,
                longitude=longitude,
            )
        )
    if not locations:
        raise HTTPException(
            status_code=404,
            detail="We couldn't find that location. Please check the hospital name, city, or address.",
        )
    return locations


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
