from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.blood_request import BloodRequest
from app.models.donor import Donor
from app.models.enums import (
    NotificationChannel,
    NotificationStatus,
    RequestStatus,
)
from app.models.notification import Notification
from app.models.request_match import RequestMatch
from app.services.compatibility import compatible_donor_groups
from app.services.distance import haversine_km


def create_request_matches(db: Session, request: BloodRequest) -> list[RequestMatch]:
    """Create matches and in-app notifications for eligible donors."""
    if request.status not in {
        RequestStatus.PENDING,
        RequestStatus.VERIFIED,
        RequestStatus.MATCHING,
    }:
        return []

    required_before = request.required_before
    if required_before.tzinfo is None:
        required_before = required_before.replace(tzinfo=timezone.utc)
    if required_before <= datetime.now(timezone.utc):
        return []

    existing_donor_ids = {
        donor_id
        for (donor_id,) in db.query(RequestMatch.donor_id)
        .filter(RequestMatch.request_id == request.id)
        .all()
    }
    compatible_groups = compatible_donor_groups(request.blood_group.value)
    donors = (
        db.query(Donor)
        .filter(
            Donor.blood_group.in_(compatible_groups),
            Donor.is_available.is_(True),
            Donor.is_eligible.is_(True),
        )
        .all()
    )

    matches = []
    for donor in donors:
        if donor.id in existing_donor_ids:
            continue

        distance = haversine_km(
            request.latitude,
            request.longitude,
            donor.latitude,
            donor.longitude,
        )
        match = RequestMatch(
            request_id=request.id,
            donor_id=donor.id,
            distance_km=round(distance, 3),
            is_notified=True,
        )
        db.add(match)
        db.add(
            Notification(
                recipient_user_id=donor.user_id,
                donor_id=donor.id,
                request_id=request.id,
                channel=NotificationChannel.IN_APP,
                status=NotificationStatus.SENT,
                title="New Blood Request Match",
                message=(
                    f"You are a blood group match for a "
                    f"{request.blood_group.value} request in "
                    f"{request.latitude},{request.longitude}. Please respond."
                ),
            )
        )
        matches.append(match)

    return matches
