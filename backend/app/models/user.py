from datetime import datetime
from typing import Optional, List
from sqlalchemy import BigInteger, String, Boolean, DateTime, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM
from app.db.base import Base
from app.models.enums import UserRole


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    role: Mapped[UserRole] = mapped_column(
        PG_ENUM(
            UserRole,
            name="user_role",
            create_type=False,
            values_callable=lambda obj: [e.value for e in obj],
        ),
        nullable=False,
        index=True,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), onupdate=func.now(), nullable=False
    )

    donor: Mapped[Optional["Donor"]] = relationship(
        "Donor", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    created_requests: Mapped[List["BloodRequest"]] = relationship(
        "BloodRequest",
        foreign_keys="[BloodRequest.created_by_user_id]",
        back_populates="created_by_user",
    )
    verified_requests: Mapped[List["BloodRequest"]] = relationship(
        "BloodRequest",
        foreign_keys="[BloodRequest.verified_by_user_id]",
        back_populates="verified_by_user",
    )
    notifications: Mapped[List["Notification"]] = relationship(
        "Notification", back_populates="recipient_user", cascade="all, delete-orphan"
    )
    confirmed_donations: Mapped[List["Donation"]] = relationship(
        "Donation", back_populates="confirmed_by_user"
    )
