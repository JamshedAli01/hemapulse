import os

models_dir = "app/models"
os.makedirs(models_dir, exist_ok=True)

enums_code = """import enum

class UserRole(str, enum.Enum):
    ADMIN = 'ADMIN'
    REQUESTER = 'REQUESTER'
    DONOR = 'DONOR'
    HOSPITAL = 'HOSPITAL'

class BloodGroup(str, enum.Enum):
    A_POS = 'A+'
    A_NEG = 'A-'
    B_POS = 'B+'
    B_NEG = 'B-'
    AB_POS = 'AB+'
    AB_NEG = 'AB-'
    O_POS = 'O+'
    O_NEG = 'O-'

class RequestStatus(str, enum.Enum):
    PENDING = 'PENDING'
    VERIFIED = 'VERIFIED'
    MATCHING = 'MATCHING'
    FULFILLED = 'FULFILLED'
    CANCELLED = 'CANCELLED'
    EXPIRED = 'EXPIRED'

class RequestUrgency(str, enum.Enum):
    LOW = 'LOW'
    MEDIUM = 'MEDIUM'
    HIGH = 'HIGH'
    CRITICAL = 'CRITICAL'

class NotificationChannel(str, enum.Enum):
    IN_APP = 'IN_APP'
    EMAIL = 'EMAIL'
    SMS = 'SMS'

class NotificationStatus(str, enum.Enum):
    PENDING = 'PENDING'
    SENT = 'SENT'
    FAILED = 'FAILED'
    READ = 'READ'

class DonorResponseStatus(str, enum.Enum):
    ACCEPTED = 'ACCEPTED'
    DECLINED = 'DECLINED'

class DonationStatus(str, enum.Enum):
    SCHEDULED = 'SCHEDULED'
    CONFIRMED = 'CONFIRMED'
    CANCELLED = 'CANCELLED'

class ConfirmationMethod(str, enum.Enum):
    MANUAL = 'MANUAL'
    HOSPITAL = 'HOSPITAL'
    QR = 'QR'
"""

user_code = """from datetime import datetime
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
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    password_hash: Mapped[str] = mapped_column(Text, nullable=False)
    role: Mapped[UserRole] = mapped_column(PG_ENUM(UserRole, name='user_role', create_type=False), nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now(), onupdate=func.now(), nullable=False)

    donor: Mapped[Optional["Donor"]] = relationship("Donor", back_populates="user", uselist=False, cascade="all, delete-orphan")
    created_requests: Mapped[List["BloodRequest"]] = relationship("BloodRequest", foreign_keys="[BloodRequest.created_by_user_id]", back_populates="created_by_user")
    verified_requests: Mapped[List["BloodRequest"]] = relationship("BloodRequest", foreign_keys="[BloodRequest.verified_by_user_id]", back_populates="verified_by_user")
    notifications: Mapped[List["Notification"]] = relationship("Notification", back_populates="recipient_user", cascade="all, delete-orphan")
    confirmed_donations: Mapped[List["Donation"]] = relationship("Donation", back_populates="confirmed_by_user")
"""

donor_code = """from datetime import date, datetime
from typing import Optional, List
from sqlalchemy import BigInteger, String, Boolean, DateTime, Date, Float, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM
from app.db.base import Base
from app.models.enums import BloodGroup

class Donor(Base):
    __tablename__ = "donors"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    blood_group: Mapped[BloodGroup] = mapped_column(PG_ENUM(BloodGroup, name='blood_group', create_type=False), nullable=False, index=True)
    date_of_birth: Mapped[date] = mapped_column(Date, nullable=False)
    city: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    is_eligible: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False, index=True)
    last_donation_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now(), onupdate=func.now(), nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="donor")
    request_matches: Mapped[List["RequestMatch"]] = relationship("RequestMatch", back_populates="donor", cascade="all, delete-orphan")
    donor_responses: Mapped[List["DonorResponse"]] = relationship("DonorResponse", back_populates="donor", cascade="all, delete-orphan")
    notifications: Mapped[List["Notification"]] = relationship("Notification", back_populates="donor", cascade="all, delete-orphan")
    donations: Mapped[List["Donation"]] = relationship("Donation", back_populates="donor")
"""

hospital_code = """from datetime import datetime
from typing import List, Optional
from sqlalchemy import BigInteger, String, Text, Float, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class Hospital(Base):
    __tablename__ = "hospitals"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    city: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now(), onupdate=func.now(), nullable=False)

    blood_requests: Mapped[List["BloodRequest"]] = relationship("BloodRequest", back_populates="hospital")
"""

blood_request_code = """from datetime import datetime
from typing import Optional, List
from sqlalchemy import BigInteger, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, func, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM
from app.db.base import Base
from app.models.enums import BloodGroup, RequestStatus, RequestUrgency

class BloodRequest(Base):
    __tablename__ = "blood_requests"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    hospital_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("hospitals.id", ondelete="RESTRICT"), nullable=False, index=True)
    created_by_user_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    blood_group: Mapped[BloodGroup] = mapped_column(PG_ENUM(BloodGroup, name='blood_group', create_type=False), nullable=False, index=True)
    units_required: Mapped[int] = mapped_column(Integer, CheckConstraint('units_required > 0'), nullable=False)
    units_fulfilled: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    required_before: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[RequestStatus] = mapped_column(PG_ENUM(RequestStatus, name='request_status', create_type=False), default=RequestStatus.PENDING, nullable=False, index=True)
    urgency: Mapped[RequestUrgency] = mapped_column(PG_ENUM(RequestUrgency, name='request_urgency', create_type=False), default=RequestUrgency.MEDIUM, nullable=False, index=True)
    verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    verification_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    verified_by_user_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    fulfilled_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now(), onupdate=func.now(), nullable=False)

    hospital: Mapped["Hospital"] = relationship("Hospital", back_populates="blood_requests")
    created_by_user: Mapped[Optional["User"]] = relationship("User", foreign_keys=[created_by_user_id], back_populates="created_requests")
    verified_by_user: Mapped[Optional["User"]] = relationship("User", foreign_keys=[verified_by_user_id], back_populates="verified_requests")
    ai_analyses: Mapped[List["AIRequestAnalysis"]] = relationship("AIRequestAnalysis", back_populates="request", cascade="all, delete-orphan")
    matches: Mapped[List["RequestMatch"]] = relationship("RequestMatch", back_populates="request", cascade="all, delete-orphan")
    donor_responses: Mapped[List["DonorResponse"]] = relationship("DonorResponse", back_populates="request", cascade="all, delete-orphan")
    notifications: Mapped[List["Notification"]] = relationship("Notification", back_populates="request", cascade="all, delete-orphan")
    donations: Mapped[List["Donation"]] = relationship("Donation", back_populates="request")
"""

ai_request_analysis_code = """from datetime import datetime
from typing import Optional, Any
from sqlalchemy import BigInteger, String, Text, Boolean, DateTime, Numeric, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM, JSONB
from app.db.base import Base
from app.models.enums import RequestUrgency

class AIRequestAnalysis(Base):
    __tablename__ = "ai_request_analyses"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    request_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("blood_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    urgency: Mapped[Optional[RequestUrgency]] = mapped_column(PG_ENUM(RequestUrgency, name='request_urgency', create_type=False), nullable=True)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_duplicate: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True, index=True)
    duplicate_request_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("blood_requests.id", ondelete="SET NULL"), nullable=True)
    duplicate_confidence: Mapped[Optional[float]] = mapped_column(Numeric(5,4), nullable=True)
    ai_provider: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    ai_model: Mapped[Optional[str]] = mapped_column(String(150), nullable=True)
    raw_response: Mapped[Optional[Any]] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now(), nullable=False)

    request: Mapped["BloodRequest"] = relationship("BloodRequest", foreign_keys=[request_id], back_populates="ai_analyses")
    duplicate_request: Mapped[Optional["BloodRequest"]] = relationship("BloodRequest", foreign_keys=[duplicate_request_id])
"""

request_match_code = """from datetime import datetime
from typing import Optional
from sqlalchemy import BigInteger, Integer, Boolean, DateTime, Numeric, ForeignKey, func, UniqueConstraint, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class RequestMatch(Base):
    __tablename__ = "request_matches"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    request_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("blood_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    donor_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("donors.id", ondelete="CASCADE"), nullable=False, index=True)
    distance_km: Mapped[Optional[float]] = mapped_column(Numeric(10,3), nullable=True, index=True)
    compatibility_score: Mapped[Optional[float]] = mapped_column(Numeric(6,3), nullable=True)
    availability_score: Mapped[Optional[float]] = mapped_column(Numeric(6,3), nullable=True)
    urgency_score: Mapped[Optional[float]] = mapped_column(Numeric(6,3), nullable=True)
    total_score: Mapped[Optional[float]] = mapped_column(Numeric(6,3), nullable=True)
    rank: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    radius_km: Mapped[Optional[float]] = mapped_column(Numeric(10,3), nullable=True)
    batch_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_notified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    matched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now(), nullable=False)

    request: Mapped["BloodRequest"] = relationship("BloodRequest", back_populates="matches")
    donor: Mapped["Donor"] = relationship("Donor", back_populates="request_matches")

    __table_args__ = (
        UniqueConstraint('request_id', 'donor_id', name='request_matches_request_id_donor_id_key'),
        Index('idx_matches_rank', 'request_id', 'rank')
    )
"""

donor_response_code = """from datetime import datetime
from typing import Optional
from sqlalchemy import BigInteger, Text, DateTime, ForeignKey, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM
from app.db.base import Base
from app.models.enums import DonorResponseStatus

class DonorResponse(Base):
    __tablename__ = "donor_responses"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    request_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("blood_requests.id", ondelete="CASCADE"), nullable=False, index=True)
    donor_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("donors.id", ondelete="CASCADE"), nullable=False, index=True)
    status: Mapped[DonorResponseStatus] = mapped_column(PG_ENUM(DonorResponseStatus, name='donor_response_status', create_type=False), nullable=False, index=True)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    responded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now(), nullable=False)

    request: Mapped["BloodRequest"] = relationship("BloodRequest", back_populates="donor_responses")
    donor: Mapped["Donor"] = relationship("Donor", back_populates="donor_responses")

    __table_args__ = (
        UniqueConstraint('request_id', 'donor_id', name='donor_responses_request_id_donor_id_key'),
    )
"""

notification_code = """from datetime import datetime
from typing import Optional
from sqlalchemy import BigInteger, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM
from app.db.base import Base
from app.models.enums import NotificationChannel, NotificationStatus

class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    request_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("blood_requests.id", ondelete="CASCADE"), nullable=True, index=True)
    donor_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("donors.id", ondelete="CASCADE"), nullable=True, index=True)
    recipient_user_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    channel: Mapped[NotificationChannel] = mapped_column(PG_ENUM(NotificationChannel, name='notification_channel', create_type=False), nullable=False)
    status: Mapped[NotificationStatus] = mapped_column(PG_ENUM(NotificationStatus, name='notification_status', create_type=False), default=NotificationStatus.PENDING, nullable=False, index=True)
    title: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    failure_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    external_message_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now(), nullable=False, index=True)

    request: Mapped[Optional["BloodRequest"]] = relationship("BloodRequest", back_populates="notifications")
    donor: Mapped[Optional["Donor"]] = relationship("Donor", back_populates="notifications")
    recipient_user: Mapped[Optional["User"]] = relationship("User", back_populates="notifications")
"""

donation_code = """from datetime import datetime
from typing import Optional
from sqlalchemy import BigInteger, Integer, DateTime, ForeignKey, func, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM
from app.db.base import Base
from app.models.enums import DonationStatus, ConfirmationMethod

class Donation(Base):
    __tablename__ = "donations"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    request_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("blood_requests.id", ondelete="RESTRICT"), nullable=False, index=True)
    donor_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("donors.id", ondelete="RESTRICT"), nullable=False, index=True)
    units: Mapped[int] = mapped_column(Integer, CheckConstraint('units > 0'), nullable=False)
    status: Mapped[DonationStatus] = mapped_column(PG_ENUM(DonationStatus, name='donation_status', create_type=False), default=DonationStatus.SCHEDULED, nullable=False, index=True)
    confirmation_method: Mapped[Optional[ConfirmationMethod]] = mapped_column(PG_ENUM(ConfirmationMethod, name='confirmation_method', create_type=False), nullable=True)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now(), nullable=False)
    confirmed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    confirmed_by_user_id: Mapped[Optional[int]] = mapped_column(BigInteger, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now(), onupdate=func.now(), nullable=False)

    request: Mapped["BloodRequest"] = relationship("BloodRequest", back_populates="donations")
    donor: Mapped["Donor"] = relationship("Donor", back_populates="donations")
    confirmed_by_user: Mapped[Optional["User"]] = relationship("User", back_populates="confirmed_donations")
    qr_token: Mapped[Optional["DonationQRToken"]] = relationship("DonationQRToken", back_populates="donation", uselist=False, cascade="all, delete-orphan")
"""

donation_qr_token_code = """from datetime import datetime
from typing import Optional
from sqlalchemy import BigInteger, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class DonationQRToken(Base):
    __tablename__ = "donation_qr_tokens"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    donation_id: Mapped[int] = mapped_column(BigInteger, ForeignKey("donations.id", ondelete="CASCADE"), unique=True, nullable=False)
    qr_token: Mapped[str] = mapped_column(Text, unique=True, nullable=False, index=True)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    used_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now(), nullable=False)

    donation: Mapped["Donation"] = relationship("Donation", back_populates="qr_token")
"""

init_code = """from app.db.base import Base
from app.models.enums import *
from app.models.user import User
from app.models.donor import Donor
from app.models.hospital import Hospital
from app.models.blood_request import BloodRequest
from app.models.ai_request_analysis import AIRequestAnalysis
from app.models.request_match import RequestMatch
from app.models.donor_response import DonorResponse
from app.models.notification import Notification
from app.models.donation import Donation
from app.models.donation_qr_token import DonationQRToken
"""

with open(f"{models_dir}/enums.py", "w") as f: f.write(enums_code)
with open(f"{models_dir}/user.py", "w") as f: f.write(user_code)
with open(f"{models_dir}/donor.py", "w") as f: f.write(donor_code)
with open(f"{models_dir}/hospital.py", "w") as f: f.write(hospital_code)
with open(f"{models_dir}/blood_request.py", "w") as f: f.write(blood_request_code)
with open(f"{models_dir}/ai_request_analysis.py", "w") as f: f.write(ai_request_analysis_code)
with open(f"{models_dir}/request_match.py", "w") as f: f.write(request_match_code)
with open(f"{models_dir}/donor_response.py", "w") as f: f.write(donor_response_code)
with open(f"{models_dir}/notification.py", "w") as f: f.write(notification_code)
with open(f"{models_dir}/donation.py", "w") as f: f.write(donation_code)
with open(f"{models_dir}/donation_qr_token.py", "w") as f: f.write(donation_qr_token_code)
with open(f"{models_dir}/__init__.py", "w") as f: f.write(init_code)
print("Models created successfully.")
