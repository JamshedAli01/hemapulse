from pydantic import ValidationError
import pytest
from app.db.session import SessionLocal
from app.models import User, Donor, Hospital, BloodRequest
from app.schemas.donor import DonorRequest
from app.schemas.blood_request import BloodRequestCreate
from app.schemas.auth import UserResponse
from datetime import date, datetime, timezone


def test_models_import():
    import app.models

    assert app.models.User is not None


def test_db_connection_and_seeding():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "admin@bloodnet.pk").first()
        assert user is not None
        assert user.role.value == "ADMIN"

        hospital = (
            db.query(Hospital)
            .filter(Hospital.name == "Civil Hospital Hyderabad")
            .first()
        )
        assert hospital is not None

        donor = (
            db.query(Donor)
            .join(User)
            .filter(User.email == "usman.donor@bloodnet.pk")
            .first()
        )
        assert donor is not None
        assert donor.blood_group.value == "O+"

        req = (
            db.query(BloodRequest)
            .filter(BloodRequest.description.ilike("%O-negative blood immediately%"))
            .first()
        )
        assert req is not None
        assert req.blood_group.value == "O-"
    finally:
        db.close()


def test_pydantic_validation():
    # Valid Donor
    donor = DonorRequest(
        user_id=1,
        blood_group="A+",
        date_of_birth=date(1990, 1, 1),
        city="Test City",
        latitude=25.0,
        longitude=68.0,
    )
    assert donor.blood_group.value == "A+"

    # Invalid Blood Group
    with pytest.raises(ValidationError):
        DonorRequest(
            user_id=1,
            blood_group="INVALID",
            date_of_birth=date(1990, 1, 1),
            city="Test",
            latitude=25.0,
            longitude=68.0,
        )

    # Invalid Latitude
    with pytest.raises(ValidationError):
        DonorRequest(
            user_id=1,
            blood_group="A+",
            date_of_birth=date(1990, 1, 1),
            city="Test",
            latitude=95.0,  # > 90
            longitude=68.0,
        )

    # Invalid Longitude
    with pytest.raises(ValidationError):
        DonorRequest(
            user_id=1,
            blood_group="A+",
            date_of_birth=date(1990, 1, 1),
            city="Test",
            latitude=25.0,
            longitude=185.0,  # > 180
        )

    # Invalid units
    with pytest.raises(ValidationError):
        BloodRequestCreate(
            hospital_id=1,
            blood_group="A+",
            units_required=0,  # Must be > 0
            required_before=datetime.now(timezone.utc),
            description="Test",
            latitude=25.0,
            longitude=68.0,
        )


def test_password_hash_not_in_user_response():
    data = {
        "id": 1,
        "name": "Test",
        "email": "test@test.com",
        "password_hash": "secret",
        "role": "ADMIN",
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }
    user_res = UserResponse(**data)
    assert not hasattr(user_res, "password_hash")
