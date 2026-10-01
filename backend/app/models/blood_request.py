from datetime import datetime
from typing import TYPE_CHECKING, Optional, List

if TYPE_CHECKING:
    from app.models.hospital import Hospital
    from app.models.user import User
    from app.models.ai_request_analysis import AIRequestAnalysis
    from app.models.request_match import RequestMatch
    from app.models.donor_response import DonorResponse
    from app.models.notification import Notification
    from app.models.donation import Donation
from sqlalchemy import (
    BigInteger,
    Integer,
    Text,
    Float,
    Boolean,
    DateTime,
    ForeignKey,
    func,
    CheckConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM
from app.db.base import Base
from app.models.enums import BloodGroup, RequestStatus, RequestUrgency


class BloodRequest(Base):
    __tablename__ = "blood_requests"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    hospital_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("hospitals.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    created_by_user_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    blood_group: Mapped[BloodGroup] = mapped_column(
        PG_ENUM(
            BloodGroup,
            name="blood_group",
            create_type=False,
            values_callable=lambda obj: [e.value for e in obj],
        ),
        nullable=False,
        index=True,
    )
    units_required: Mapped[int] = mapped_column(
        Integer, CheckConstraint("units_required > 0"), nullable=False
    )
    units_fulfilled: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    required_before: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[RequestStatus] = mapped_column(
        PG_ENUM(
            RequestStatus,
            name="request_status",
            create_type=False,
            values_callable=lambda obj: [e.value for e in obj],
        ),
        default=RequestStatus.PENDING,
        nullable=False,
        index=True,
    )
    urgency: Mapped[RequestUrgency] = mapped_column(
        PG_ENUM(
            RequestUrgency,
            name="request_urgency",
            create_type=False,
            values_callable=lambda obj: [e.value for e in obj],
        ),
        default=RequestUrgency.MEDIUM,
        nullable=False,
        index=True,
    )
    verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    verification_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    verified_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    verified_by_user_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    fulfilled_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now(), nullable=False
    )

    hospital: Mapped["Hospital"] = relationship(
        "Hospital", back_populates="blood_requests"
    )
    created_by_user: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[created_by_user_id], back_populates="created_requests"
    )
    verified_by_user: Mapped[Optional["User"]] = relationship(
        "User", foreign_keys=[verified_by_user_id], back_populates="verified_requests"
    )
    ai_analyses: Mapped[List["AIRequestAnalysis"]] = relationship(
        "AIRequestAnalysis",
        foreign_keys="[AIRequestAnalysis.request_id]",
        back_populates="request",
        cascade="all, delete-orphan",
    )
    matches: Mapped[List["RequestMatch"]] = relationship(
        "RequestMatch", back_populates="request", cascade="all, delete-orphan"
    )
    donor_responses: Mapped[List["DonorResponse"]] = relationship(
        "DonorResponse", back_populates="request", cascade="all, delete-orphan"
    )
    notifications: Mapped[List["Notification"]] = relationship(
        "Notification", back_populates="request", cascade="all, delete-orphan"
    )
    donations: Mapped[List["Donation"]] = relationship(
        "Donation", back_populates="request"
    )
