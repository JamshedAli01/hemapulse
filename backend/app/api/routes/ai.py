from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_active_user
from app.schemas.ai import AnalyzeRequest, CheckDuplicateRequest
from app.models.blood_request import BloodRequest
from app.models.enums import RequestStatus, RequestUrgency, UserRole

router = APIRouter(prefix="/api/ai", tags=["AI"])


@router.post("/analyze-request")
def analyze_request(
    payload: AnalyzeRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    req = db.query(BloodRequest).filter(BloodRequest.id == payload.request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.created_by_user_id != current_user.id and current_user.role not in {
        UserRole.ADMIN,
        UserRole.HOSPITAL,
    }:
        raise HTTPException(status_code=403, detail="Not authorized to analyze this request")

    desc_lower = payload.description.lower()
    if any(kw in desc_lower for kw in ["critical", "life-threatening", "emergency", "immediate"]):
        urgency = RequestUrgency.CRITICAL
        summary = "This request has been flagged as CRITICAL based on the description keywords."
    elif any(kw in desc_lower for kw in ["urgent", "needed soon", "quick"]):
        urgency = RequestUrgency.HIGH
        summary = "This request is flagged as HIGH urgency."
    else:
        urgency = RequestUrgency.MEDIUM
        summary = "This request is flagged as MEDIUM urgency. Standard matching procedures apply."

    return {
        "request_id": payload.request_id,
        "urgency": urgency.value,
        "summary": summary,
        "ai_provider": "rule-based",
        "ai_model": "keyword-classifier-v1",
    }


@router.post("/check-duplicate")
def check_duplicate(
    payload: CheckDuplicateRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    req = db.query(BloodRequest).filter(BloodRequest.id == payload.request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.created_by_user_id != current_user.id and current_user.role not in {
        UserRole.ADMIN,
        UserRole.HOSPITAL,
    }:
        raise HTTPException(status_code=403, detail="Not authorized to inspect this request")

    duplicates = (
        db.query(BloodRequest)
        .filter(
            BloodRequest.id != req.id,
            BloodRequest.hospital_id == req.hospital_id,
            BloodRequest.blood_group == req.blood_group,
            BloodRequest.status.in_(
                [RequestStatus.PENDING, RequestStatus.VERIFIED, RequestStatus.MATCHING]
            ),
        )
        .all()
    )

    if duplicates:
        return {
            "is_duplicate": True,
            "duplicate_request_ids": [d.id for d in duplicates],
            "confidence_score": 0.85,
            "reasoning": "Duplicate blood group request at the same hospital is already active.",
        }

    return {
        "is_duplicate": False,
        "duplicate_request_ids": [],
        "confidence_score": 0.0,
        "reasoning": "No matching active requests found.",
    }
