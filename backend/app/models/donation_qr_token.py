from datetime import datetime
from typing import Optional
from sqlalchemy import BigInteger, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class DonationQRToken(Base):
    __tablename__ = "donation_qr_tokens"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    donation_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("donations.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    qr_token: Mapped[str] = mapped_column(Text, unique=True, nullable=False, index=True)
    expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True, index=True
    )
    used_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), nullable=False
    )

    donation: Mapped["Donation"] = relationship("Donation", back_populates="qr_token")
