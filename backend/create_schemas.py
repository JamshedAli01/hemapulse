import os

schemas_dir = "app/schemas"
os.makedirs(schemas_dir, exist_ok=True)

common_code = """from typing import Generic, TypeVar, List
from pydantic import BaseModel, ConfigDict

T = TypeVar("T")

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    page: int
    page_size: int
    total: int
    pages: int

    model_config = ConfigDict(from_attributes=True)
"""

auth_code = """from pydantic import BaseModel, EmailStr, ConfigDict
from app.models.enums import UserRole
from datetime import datetime
from typing import Optional

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    password: str
    role: UserRole

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: UserRole
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
"""

donor_code = """from pydantic import BaseModel, Field, ConfigDict
from app.models.enums import BloodGroup
from datetime import date, datetime
from typing import Optional

class DonorRequest(BaseModel):
    user_id: int
    blood_group: BloodGroup
    date_of_birth: date
    city: str
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    is_available: bool = True
    is_eligible: bool = True
    last_donation_date: Optional[date] = None

class DonorAvailabilityUpdate(BaseModel):
    is_available: bool

class DonorResponse(BaseModel):
    id: int
    user_id: int
    blood_group: BloodGroup
    date_of_birth: date
    city: str
    latitude: float
    longitude: float
    is_available: bool
    is_eligible: bool
    last_donation_date: Optional[date]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
"""

hospital_code = """from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional

class HospitalRequest(BaseModel):
    name: str
    address: str
    city: str
    phone: Optional[str] = None
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)

class HospitalResponse(BaseModel):
    id: int
    name: str
    address: str
    city: str
    phone: Optional[str]
    latitude: float
    longitude: float
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
"""

blood_request_code = """from pydantic import BaseModel, Field, ConfigDict
from app.models.enums import BloodGroup, RequestStatus, RequestUrgency
from datetime import datetime
from typing import Optional

class BloodRequestCreate(BaseModel):
    hospital_id: int
    blood_group: BloodGroup
    units_required: int = Field(..., gt=0)
    required_before: datetime
    description: str
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)

class BloodRequestUpdate(BaseModel):
    blood_group: Optional[BloodGroup] = None
    units_required: Optional[int] = Field(None, gt=0)
    required_before: Optional[datetime] = None
    description: Optional[str] = None
    status: Optional[RequestStatus] = None
    urgency: Optional[RequestUrgency] = None

class VerifyRequest(BaseModel):
    verified: bool
    notes: Optional[str] = None

class BloodRequestResponse(BaseModel):
    id: int
    hospital_id: int
    created_by_user_id: Optional[int]
    blood_group: BloodGroup
    units_required: int
    units_fulfilled: int
    required_before: datetime
    description: str
    latitude: float
    longitude: float
    status: RequestStatus
    urgency: RequestUrgency
    verified: bool
    verification_notes: Optional[str]
    verified_at: Optional[datetime]
    verified_by_user_id: Optional[int]
    cancelled_at: Optional[datetime]
    fulfilled_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
"""

ai_code = """from pydantic import BaseModel, ConfigDict
from app.models.enums import RequestUrgency
from typing import Optional, Any

class AnalyzeRequest(BaseModel):
    request_id: int
    description: str

class CheckDuplicateRequest(BaseModel):
    request_id: int

class AIAnalysisResponse(BaseModel):
    request_id: int
    urgency: Optional[RequestUrgency]
    summary: Optional[str]
    is_duplicate: Optional[bool]
    duplicate_request_id: Optional[int]
    duplicate_confidence: Optional[float]
    ai_provider: Optional[str]
    ai_model: Optional[str]

    model_config = ConfigDict(from_attributes=True)
"""

matching_code = """from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class EscalateRequest(BaseModel):
    current_radius_km: float
    next_radius_km: float
    batch_size: int

class RequestMatchResponse(BaseModel):
    id: int
    request_id: int
    donor_id: int
    distance_km: Optional[float]
    compatibility_score: Optional[float]
    availability_score: Optional[float]
    urgency_score: Optional[float]
    total_score: Optional[float]
    rank: Optional[int]
    radius_km: Optional[float]
    batch_number: Optional[int]
    is_notified: bool
    matched_at: datetime

    model_config = ConfigDict(from_attributes=True)
"""

notification_code = """from pydantic import BaseModel, ConfigDict
from app.models.enums import NotificationChannel, NotificationStatus
from typing import List, Optional
from datetime import datetime

class SendNotificationRequest(BaseModel):
    donor_ids: List[int]
    channel: NotificationChannel

class NotificationResponse(BaseModel):
    id: int
    request_id: Optional[int]
    donor_id: Optional[int]
    recipient_user_id: Optional[int]
    channel: NotificationChannel
    status: NotificationStatus
    title: Optional[str]
    message: str
    sent_at: Optional[datetime]
    read_at: Optional[datetime]
    failure_reason: Optional[str]
    external_message_id: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
"""

donor_response_schema_code = """from pydantic import BaseModel, ConfigDict
from app.models.enums import DonorResponseStatus
from datetime import datetime
from typing import Optional

class DonorResponseRequest(BaseModel):
    donor_id: int

class DeclineRequest(BaseModel):
    donor_id: int
    reason: Optional[str] = None

class DonorActionResponse(BaseModel):
    id: int
    request_id: int
    donor_id: int
    status: DonorResponseStatus
    reason: Optional[str]
    responded_at: datetime

    model_config = ConfigDict(from_attributes=True)
"""

donation_code = """from pydantic import BaseModel, Field, ConfigDict
from app.models.enums import DonationStatus, ConfirmationMethod
from typing import Optional
from datetime import datetime

class DonationCreate(BaseModel):
    request_id: int
    donor_id: int
    units: int = Field(..., gt=0)

class ConfirmDonation(BaseModel):
    confirmation_method: ConfirmationMethod

class ConfirmQR(BaseModel):
    qr_token: str

class DonationResponse(BaseModel):
    id: int
    request_id: int
    donor_id: int
    units: int
    status: DonationStatus
    confirmation_method: Optional[ConfirmationMethod]
    scheduled_at: datetime
    confirmed_at: Optional[datetime]
    confirmed_by_user_id: Optional[int]
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
"""

dashboard_code = """from pydantic import BaseModel, ConfigDict
from typing import List, Dict, Any

class DashboardSummaryResponse(BaseModel):
    total_requests: int
    active_requests: int
    total_donors: int
    available_donors: int
    total_donations: int

class BloodGroupStats(BaseModel):
    blood_group: str
    count: int

class RequestAnalytics(BaseModel):
    date: str
    count: int

class FulfillmentAnalytics(BaseModel):
    date: str
    fulfilled: int
    unfulfilled: int
"""

init_schema_code = """from app.schemas.common import PaginatedResponse
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from app.schemas.donor import DonorRequest, DonorAvailabilityUpdate, DonorResponse
from app.schemas.hospital import HospitalRequest, HospitalResponse
from app.schemas.blood_request import BloodRequestCreate, BloodRequestUpdate, VerifyRequest, BloodRequestResponse
from app.schemas.ai import AnalyzeRequest, CheckDuplicateRequest, AIAnalysisResponse
from app.schemas.matching import EscalateRequest, RequestMatchResponse
from app.schemas.notification import SendNotificationRequest, NotificationResponse
from app.schemas.donor_response import DonorResponseRequest, DeclineRequest, DonorActionResponse
from app.schemas.donation import DonationCreate, ConfirmDonation, ConfirmQR, DonationResponse
from app.schemas.dashboard import DashboardSummaryResponse, BloodGroupStats, RequestAnalytics, FulfillmentAnalytics
"""

with open(f"{schemas_dir}/common.py", "w") as f: f.write(common_code)
with open(f"{schemas_dir}/auth.py", "w") as f: f.write(auth_code)
with open(f"{schemas_dir}/donor.py", "w") as f: f.write(donor_code)
with open(f"{schemas_dir}/hospital.py", "w") as f: f.write(hospital_code)
with open(f"{schemas_dir}/blood_request.py", "w") as f: f.write(blood_request_code)
with open(f"{schemas_dir}/ai.py", "w") as f: f.write(ai_code)
with open(f"{schemas_dir}/matching.py", "w") as f: f.write(matching_code)
with open(f"{schemas_dir}/notification.py", "w") as f: f.write(notification_code)
with open(f"{schemas_dir}/donor_response.py", "w") as f: f.write(donor_response_schema_code)
with open(f"{schemas_dir}/donation.py", "w") as f: f.write(donation_code)
with open(f"{schemas_dir}/dashboard.py", "w") as f: f.write(dashboard_code)
with open(f"{schemas_dir}/__init__.py", "w") as f: f.write(init_schema_code)
print("Schemas created successfully.")
