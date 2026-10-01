from datetime import datetime
from typing import Optional, Any
from sqlalchemy import (
    BigInteger,
    String,
    Text,
    Boolean,
    DateTime,
    Numeric,
    ForeignKey,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM, JSONB
from app.db.base import Base
from app.models.enums import RequestUrgency


class AIRequestAnalysis(Base):
    __tablename__ = "ai_request_analyses"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    request_id: Mapped[int] = mapped_column(
        BigInteger,
        ForeignKey("blood_requests.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    urgency: Mapped[Optional[RequestUrgency]] = mapped_column(
        PG_ENUM(
            RequestUrgency,
            name="request_urgency",
            create_type=False,
            values_callable=lambda obj: [e.value for e in obj],
        ),
        nullable=True,
    )
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_duplicate: Mapped[Optional[bool]] = mapped_column(
        Boolean, nullable=True, index=True
    )
    duplicate_request_id: Mapped[Optional[int]] = mapped_column(
        BigInteger, ForeignKey("blood_requests.id", ondelete="SET NULL"), nullable=True
    )
    duplicate_confidence: Mapped[Optional[float]] = mapped_column(
        Numeric(5, 4), nullable=True
    )
    ai_provider: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    ai_model: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    raw_response: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), nullable=False
    )

    request: Mapped["BloodRequest"] = relationship(
        "BloodRequest", foreign_keys=[request_id], back_populates="ai_analyses"
    )
    duplicate_request: Mapped[Optional["BloodRequest"]] = relationship(
        "BloodRequest", foreign_keys=[duplicate_request_id]
    )
