from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.session import get_db
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.models.donor import Donor
from app.models.blood_request import BloodRequest
from app.models.hospital import Hospital
from app.models.enums import RequestStatus

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


class DashboardSummary(BaseModel):
    total_donors: int
    total_requests: int
    active_requests: int
    fulfilled_requests: int
    total_hospitals: int


class BloodGroupStat(BaseModel):
    blood_group: str
    count: int


@router.get("/summary", response_model=DashboardSummary)
def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    total_donors = db.query(Donor).count()
    total_requests = db.query(BloodRequest).count()
    active_requests = (
        db.query(BloodRequest)
        .filter(BloodRequest.status == RequestStatus.PENDING)
        .count()
    )
    fulfilled_requests = (
        db.query(BloodRequest)
        .filter(BloodRequest.status == RequestStatus.FULFILLED)
        .count()
    )
    total_hospitals = db.query(Hospital).count()

    return DashboardSummary(
        total_donors=total_donors,
        total_requests=total_requests,
        active_requests=active_requests,
        fulfilled_requests=fulfilled_requests,
        total_hospitals=total_hospitals,
    )


@router.get("/blood-groups", response_model=List[BloodGroupStat])
def get_blood_groups(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    donors = db.query(Donor).all()
    counts: dict[str, int] = {}
    for donor in donors:
        key = donor.blood_group.value
        counts[key] = counts.get(key, 0) + 1

    return [BloodGroupStat(blood_group=bg, count=cnt) for bg, cnt in sorted(counts.items())]
