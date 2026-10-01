from datetime import datetime
from typing import Optional
from sqlalchemy import BigInteger, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM
from app.db.base import Base
from app.models.enums import NotificationChannel, NotificationStatus


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    request_id: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        ForeignKey("blood_requests.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    donor_id: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        ForeignKey("donors.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    recipient_user_id: Mapped[Optional[int]] = mapped_column(
        BigInteger,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )
    channel: Mapped[NotificationChannel] = mapped_column(
        PG_ENUM(
            NotificationChannel,
            name="notification_channel",
            create_type=False,
            values_callable=lambda obj: [e.value for e in obj],
        ),
        nullable=False,
    )
    status: Mapped[NotificationStatus] = mapped_column(
        PG_ENUM(
            NotificationStatus,
            name="notification_status",
            create_type=False,
            values_callable=lambda obj: [e.value for e in obj],
        ),
        default=NotificationStatus.PENDING,
        nullable=False,
        index=True,
    )
    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    sent_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    read_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    failure_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    external_message_id: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), nullable=False, index=True
    )

    request: Mapped[Optional["BloodRequest"]] = relationship(
        "BloodRequest", back_populates="notifications"
    )
    donor: Mapped[Optional["Donor"]] = relationship(
        "Donor", back_populates="notifications"
    )
    recipient_user: Mapped[Optional["User"]] = relationship(
        "User", back_populates="notifications"
    )
