from datetime import datetime
from typing import Optional
from sqlalchemy import BigInteger, Text, DateTime, ForeignKey, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM
from app.db.base import Base
from app.models.enums import DonorResponseStatus


class DonorResponse(Base):
    __tablename__ = "donor_responses"

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
    status: Mapped[DonorResponseStatus] = mapped_column(
        PG_ENUM(
            DonorResponseStatus,
            name="donor_response_status",
            create_type=False,
            values_callable=lambda obj: [e.value for e in obj],
        ),
        nullable=False,
        index=True,
    )
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    responded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), nullable=False
    )

    request: Mapped["BloodRequest"] = relationship(
        "BloodRequest", back_populates="donor_responses"
    )
    donor: Mapped["Donor"] = relationship("Donor", back_populates="donor_responses")

    __table_args__ = (
        UniqueConstraint(
            "request_id", "donor_id", name="donor_responses_request_id_donor_id_key"
        ),
    )
