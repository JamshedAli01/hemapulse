from datetime import datetime, timezone

from app.models.enums import RequestStatus


def effective_request_status(status: RequestStatus, required_before: datetime) -> RequestStatus:
    """Return the user-facing status without mutating the stored lifecycle."""
    if status in {RequestStatus.FULFILLED, RequestStatus.CANCELLED, RequestStatus.EXPIRED}:
        return status
    deadline = required_before
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)
    if deadline <= datetime.now(timezone.utc):
        return RequestStatus.EXPIRED
    return status
