from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.db.session import get_db
from app.core.dependencies import get_current_active_user
from app.schemas.donation import DonationCreate, ConfirmDonation, ConfirmQR, DonationResponse
from app.models.donation import Donation
from app.models.donation_qr_token import DonationQRToken
from app.models.blood_request import BloodRequest
from app.models.donor import Donor
from app.models.enums import DonationStatus, ConfirmationMethod
from app.models.enums import DonorResponseStatus, RequestStatus, UserRole
from app.models.donor_response import DonorResponse
import secrets
from datetime import datetime, timezone, timedelta
from sqlalchemy import func
from app.services.request_lifecycle import effective_request_status

router = APIRouter(prefix="/api/donations", tags=["Donations"])


@router.post("", response_model=DonationResponse, status_code=201)
def create_donation(
    payload: DonationCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
):
    request = (
        db.query(BloodRequest)
        .filter(BloodRequest.id == payload.request_id)
        .with_for_update()
        .first()
    )
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    donor = db.query(Donor).filter(Donor.user_id == current_user.id).first()
    if not donor or payload.donor_id not in {donor.id, donor.user_id}:
        raise HTTPException(status_code=403, detail="You are not the specified donor")
    if payload.units <= 0:
        raise HTTPException(status_code=422, detail="Donation units must be positive")
    commitment = (
        db.query(DonorResponse)
        .filter(
            DonorResponse.request_id == request.id,
            DonorResponse.donor_id == donor.id,
            DonorResponse.status == DonorResponseStatus.ACCEPTED,
        )
        .first()
    )
    if not commitment or effective_request_status(
        request.status, request.required_before
    ) in {
        RequestStatus.CANCELLED,
        RequestStatus.FULFILLED,
        RequestStatus.EXPIRED,
    }:
        raise HTTPException(status_code=409, detail="An active accepted donor commitment is required")
    confirmed_units = (
        db.query(func.coalesce(func.sum(Donation.units), 0))
        .filter(
            Donation.request_id == request.id,
            Donation.status == DonationStatus.CONFIRMED,
        )
        .scalar()
    )
    scheduled_units = (
        db.query(func.coalesce(func.sum(Donation.units), 0))
        .filter(
            Donation.request_id == request.id,
            Donation.status == DonationStatus.SCHEDULED,
        )
        .scalar()
    )
    if confirmed_units + scheduled_units + payload.units > request.units_required:
        raise HTTPException(
            status_code=409,
            detail="Requested donation quantity exceeds the remaining requirement.",
        )
    existing = (
        db.query(Donation)
        .filter(
            Donation.request_id == request.id,
            Donation.donor_id == donor.id,
            Donation.status != DonationStatus.CANCELLED,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=409, detail="A donation is already scheduled for this commitment")

    donation = Donation(
        request_id=payload.request_id,
        donor_id=donor.id,
        units=payload.units,
        status=DonationStatus.SCHEDULED,
        scheduled_at=datetime.now(timezone.utc),
    )
    db.add(donation)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Donation could not be scheduled")
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
    if donation.status != DonationStatus.SCHEDULED:
        raise HTTPException(status_code=409, detail="Only scheduled donations can be confirmed")
    if current_user.role == UserRole.HOSPITAL and donation.request.created_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Hospital user is not associated with this request")
    if current_user.role not in {UserRole.ADMIN, UserRole.HOSPITAL}:
        raise HTTPException(status_code=403, detail="Only an authorized hospital or admin can confirm donations")

    request = db.query(BloodRequest).filter(BloodRequest.id == donation.request_id).with_for_update().one()
    confirmed_units = (
        db.query(func.coalesce(func.sum(Donation.units), 0))
        .filter(
            Donation.request_id == request.id,
            Donation.status == DonationStatus.CONFIRMED,
            Donation.id != donation.id,
        )
        .scalar()
    )
    if confirmed_units + donation.units > request.units_required:
        raise HTTPException(
            status_code=409,
            detail="Confirmed donation quantity exceeds the remaining requirement.",
        )
    donation.status = DonationStatus.CONFIRMED
    donation.confirmation_method = payload.confirmation_method
    donation.confirmed_at = datetime.now(timezone.utc)
    donation.confirmed_by_user_id = current_user.id
    request.units_fulfilled = int(confirmed_units) + donation.units
    if request.units_fulfilled >= request.units_required:
        request.status = RequestStatus.FULFILLED
        request.fulfilled_at = datetime.now(timezone.utc)

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
    if donation.status != DonationStatus.SCHEDULED:
        raise HTTPException(status_code=409, detail="Only scheduled donations can be confirmed")
    if current_user.role == UserRole.HOSPITAL and donation.request.created_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Hospital user is not associated with this request")
    if current_user.role not in {UserRole.ADMIN, UserRole.HOSPITAL} and donation.donor.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the donor or an authorized hospital can generate a QR token")

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
    if current_user.role == UserRole.HOSPITAL and donation.request.created_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Hospital user is not associated with this request")
    if current_user.role not in {UserRole.ADMIN, UserRole.HOSPITAL}:
        raise HTTPException(status_code=403, detail="Only an authorized hospital or admin can confirm donations")
    if donation.status != DonationStatus.SCHEDULED:
        raise HTTPException(status_code=409, detail="Only scheduled donations can be confirmed")
    request = db.query(BloodRequest).filter(BloodRequest.id == donation.request_id).with_for_update().one()
    confirmed_units = (
        db.query(func.coalesce(func.sum(Donation.units), 0))
        .filter(
            Donation.request_id == request.id,
            Donation.status == DonationStatus.CONFIRMED,
            Donation.id != donation.id,
        )
        .scalar()
    )
    if confirmed_units + donation.units > request.units_required:
        raise HTTPException(
            status_code=409,
            detail="Confirmed donation quantity exceeds the remaining requirement.",
        )
    donation.status = DonationStatus.CONFIRMED
    donation.confirmation_method = ConfirmationMethod.QR
    donation.confirmed_at = datetime.now(timezone.utc)
    donation.confirmed_by_user_id = current_user.id
    request.units_fulfilled = int(confirmed_units) + donation.units
    if request.units_fulfilled >= request.units_required:
        request.status = RequestStatus.FULFILLED
        request.fulfilled_at = datetime.now(timezone.utc)

    qr_token.used_at = datetime.now(timezone.utc)

    db.commit()
    return {"message": "QR donation confirmed"}
