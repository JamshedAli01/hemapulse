import enum


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    REQUESTER = "REQUESTER"
    DONOR = "DONOR"
    HOSPITAL = "HOSPITAL"


class BloodGroup(str, enum.Enum):
    A_POS = "A+"
    A_NEG = "A-"
    B_POS = "B+"
    B_NEG = "B-"
    AB_POS = "AB+"
    AB_NEG = "AB-"
    O_POS = "O+"
    O_NEG = "O-"


class RequestStatus(str, enum.Enum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    MATCHING = "MATCHING"
    FULFILLED = "FULFILLED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"


class RequestUrgency(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class NotificationChannel(str, enum.Enum):
    IN_APP = "IN_APP"
    EMAIL = "EMAIL"
    SMS = "SMS"


class NotificationStatus(str, enum.Enum):
    PENDING = "PENDING"
    SENT = "SENT"
    FAILED = "FAILED"
    READ = "READ"


class DonorResponseStatus(str, enum.Enum):
    ACCEPTED = "ACCEPTED"
    DECLINED = "DECLINED"


class DonationStatus(str, enum.Enum):
    SCHEDULED = "SCHEDULED"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"


class ConfirmationMethod(str, enum.Enum):
    MANUAL = "MANUAL"
    HOSPITAL = "HOSPITAL"
    QR = "QR"
