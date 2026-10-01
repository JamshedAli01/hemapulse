from datetime import datetime
from typing import Optional
from sqlalchemy import BigInteger, Integer, DateTime, ForeignKey, func, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM
from app.db.base import Base
from app.models.enums import DonationStatus, ConfirmationMethod


class Donation(Base):
    __tablename__ = "donations"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    request_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("blood_requests.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    donor_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("donors.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    units: Mapped[int] = mapped_column(
        Integer, CheckConstraint("units > 0"), nullable=False
    )
    status: Mapped[DonationStatus] = mapped_column(
        PG_ENUM(
            DonationStatus,
            name="donation_status",
            create_type=False,
            values_callable=lambda obj: [e.value for e in obj],
        ),
        default=DonationStatus.SCHEDULED,
        nullable=False,
        index=True,
    )
    confirmation_method: Mapped[Optional[ConfirmationMethod]] = mapped_column(
        PG_ENUM(
            ConfirmationMethod,
            name="confirmation_method",
            create_type=False,
            values_callable=lambda obj: [e.value for e in obj],
        ),
        nullable=True,
    )
    scheduled_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), nullable=False
    )
    confirmed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    confirmed_by_user_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now(), nullable=False
    )

    request: Mapped["BloodRequest"] = relationship(
        "BloodRequest", back_populates="donations"
    )
    donor: Mapped["Donor"] = relationship("Donor", back_populates="donations")
    confirmed_by_user: Mapped[Optional["User"]] = relationship(
        "User", back_populates="confirmed_donations"
    )
    qr_token: Mapped[Optional["DonationQRToken"]] = relationship(
        "DonationQRToken",
        back_populates="donation",
        uselist=False,
        cascade="all, delete-orphan",
    )
