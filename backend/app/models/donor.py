from datetime import date, datetime
from typing import Optional, List
from sqlalchemy import (
    BigInteger,
    String,
    Boolean,
    DateTime,
    Date,
    Float,
    ForeignKey,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM
from app.db.base import Base
from app.models.enums import BloodGroup


class Donor(Base):
    __tablename__ = "donors"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
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
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    city: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    is_available: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False, index=True
    )
    is_eligible: Mapped[bool] = mapped_column(
        Boolean, default=True, nullable=False, index=True
    )
    last_donation_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship("User", back_populates="donor")
    request_matches: Mapped[List["RequestMatch"]] = relationship(
        "RequestMatch", back_populates="donor", cascade="all, delete-orphan"
    )
    donor_responses: Mapped[List["DonorResponse"]] = relationship(
        "DonorResponse", back_populates="donor", cascade="all, delete-orphan"
    )
    notifications: Mapped[List["Notification"]] = relationship(
        "Notification", back_populates="donor", cascade="all, delete-orphan"
    )
    donations: Mapped[List["Donation"]] = relationship(
        "Donation", back_populates="donor"
    )
