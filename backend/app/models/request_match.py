from datetime import datetime
from typing import Optional
from sqlalchemy import (
    BigInteger,
    Integer,
    Boolean,
    DateTime,
    Numeric,
    ForeignKey,
    func,
    UniqueConstraint,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class RequestMatch(Base):
    __tablename__ = "request_matches"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    request_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("blood_requests.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    donor_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("donors.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    distance_km: Mapped[Optional[float]] = mapped_column(
        Numeric(10, 3), nullable=True, index=True
    )
    compatibility_score: Mapped[Optional[float]] = mapped_column(
        Numeric(6, 3), nullable=True
    )
    availability_score: Mapped[Optional[float]] = mapped_column(
        Numeric(6, 3), nullable=True
    )
    urgency_score: Mapped[Optional[float]] = mapped_column(Numeric(6, 3), nullable=True)
    total_score: Mapped[Optional[float]] = mapped_column(Numeric(6, 3), nullable=True)
    rank: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    radius_km: Mapped[Optional[float]] = mapped_column(Numeric(10, 3), nullable=True)
    batch_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_notified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    matched_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), nullable=False
    )

    request: Mapped["BloodRequest"] = relationship(
        "BloodRequest", back_populates="matches"
    )
    donor: Mapped["Donor"] = relationship("Donor", back_populates="request_matches")

    __table_args__ = (
        UniqueConstraint(
            "request_id", "donor_id", name="request_matches_request_id_donor_id_key"
        ),
        Index("idx_matches_rank", "request_id", "rank"),
    )
