from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.dependencies import get_current_active_user
from app.schemas.donation import DonationCreate, ConfirmDonation, ConfirmQR, DonationResponse
from app.models.donation import Donation
from app.models.donation_qr_token import DonationQRToken
from app.models.enums import DonationStatus, ConfirmationMethod
import secrets
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/api/donations", tags=["Donations"])


@router.post("", response_model=DonationResponse, status_code=201)
def create_donation(
    payload: DonationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    donation = Donation(
        request_id=payload.request_id,
        donor_id=payload.donor_id,
        units=payload.units,
        status=DonationStatus.SCHEDULED,
        scheduled_at=datetime.now(timezone.utc),
    )
    db.add(donation)
    db.commit()
    db.refresh(donation)
    return donation


@router.patch("/{donation_id}/confirm", response_model=DonationResponse)
def confirm_donation(
    donation_id: int,
    payload: ConfirmDonation,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    donation = db.query(Donation).filter(Donation.id == donation_id).first()
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")

    donation.status = DonationStatus.CONFIRMED
    donation.confirmation_method = payload.confirmation_method
    donation.confirmed_at = datetime.now(timezone.utc)
    donation.confirmed_by_user_id = current_user.id

    db.commit()
    db.refresh(donation)
    return donation


@router.post("/{donation_id}/qr")
def generate_qr(
    donation_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    donation = db.query(Donation).filter(Donation.id == donation_id).first()
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")

    # Remove any existing token first
    existing = db.query(DonationQRToken).filter(DonationQRToken.donation_id == donation_id).first()
    if existing:
        db.delete(existing)
        db.commit()

    token_str = secrets.token_hex(16)
    expires = datetime.now(timezone.utc) + timedelta(hours=24)

    qr_token = DonationQRToken(
        donation_id=donation.id,
        qr_token=token_str,
        expires_at=expires,
    )
    db.add(qr_token)
    db.commit()

    return {"qr_token": token_str, "expires_at": expires.isoformat()}


@router.post("/confirm-qr")
def confirm_qr(
    payload: ConfirmQR,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    qr_token = (
        db.query(DonationQRToken)
        .filter(DonationQRToken.qr_token == payload.qr_token)
        .first()
    )
    if not qr_token:
        raise HTTPException(status_code=404, detail="Invalid QR Token")

    if qr_token.used_at is not None:
        raise HTTPException(status_code=400, detail="QR Token already used")

    if qr_token.expires_at and qr_token.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="QR Token expired")

    donation = qr_token.donation
    donation.status = DonationStatus.CONFIRMED
    donation.confirmation_method = ConfirmationMethod.QR
    donation.confirmed_at = datetime.now(timezone.utc)
    donation.confirmed_by_user_id = current_user.id

    qr_token.used_at = datetime.now(timezone.utc)

    db.commit()
    return {"message": "QR donation confirmed"}

