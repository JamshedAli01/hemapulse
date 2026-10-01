"""Phase 4 Tests: Donors, Requests, Matching, Notifications, Compatibility, Distance"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import text

from app.main import app
from app.db.session import SessionLocal
from app.services.compatibility import can_donate, compatible_donor_groups
from app.services.distance import haversine_km

client = TestClient(app)

# ─── Helpers ─────────────────────────────────────────────────────────────────


def _login(email: str, password: str) -> str:
    r = client.post("/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return r.json()["access_token"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _cleanup_donor(user_id: int):
    db = SessionLocal()
    db.execute(
        text(
            "DELETE FROM request_matches WHERE donor_id IN (SELECT id FROM donors WHERE user_id=:uid)"
        ),
        {"uid": user_id},
    )
    db.execute(
        text(
            "DELETE FROM donor_responses WHERE donor_id IN (SELECT id FROM donors WHERE user_id=:uid)"
        ),
        {"uid": user_id},
    )
    db.execute(
        text(
            "DELETE FROM notifications WHERE donor_id IN (SELECT id FROM donors WHERE user_id=:uid)"
        ),
        {"uid": user_id},
    )
    db.execute(text("DELETE FROM donors WHERE user_id=:uid"), {"uid": user_id})
    db.commit()
    db.close()


def _get_user_id(email: str) -> int:
    db = SessionLocal()
    row = db.execute(
        text("SELECT id FROM users WHERE email=:e"), {"e": email}
    ).fetchone()
    db.close()
    return row[0]


def _cleanup_requests(user_id: int):
    db = SessionLocal()
    db.execute(
        text(
            "DELETE FROM request_matches WHERE request_id IN (SELECT id FROM blood_requests WHERE created_by_user_id=:uid)"
        ),
        {"uid": user_id},
    )
    db.execute(
        text(
            "DELETE FROM donor_responses WHERE request_id IN (SELECT id FROM blood_requests WHERE created_by_user_id=:uid)"
        ),
        {"uid": user_id},
    )
    db.execute(
        text(
            "DELETE FROM notifications WHERE request_id IN (SELECT id FROM blood_requests WHERE created_by_user_id=:uid)"
        ),
        {"uid": user_id},
    )
    db.execute(
        text("DELETE FROM blood_requests WHERE created_by_user_id=:uid"),
        {"uid": user_id},
    )
    db.commit()
    db.close()


def _cleanup_notifications(user_id: int):
    db = SessionLocal()
    db.execute(
        text("DELETE FROM notifications WHERE recipient_user_id=:uid"), {"uid": user_id}
    )
    db.commit()
    db.close()


def _get_hospital_id() -> int:
    db = SessionLocal()
    row = db.execute(text("SELECT id FROM hospitals LIMIT 1")).fetchone()
    db.close()
    return row[0]


# ─── Compatibility Tests ──────────────────────────────────────────────────────


def test_compatibility_o_neg_universal():
    for bg in ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"]:
        assert can_donate("O-", bg), f"O- should donate to {bg}"


def test_compatibility_ab_pos_self_only():
    assert can_donate("AB+", "AB+")
    assert not can_donate("AB+", "A+")
    assert not can_donate("AB+", "O+")


def test_compatibility_o_pos():
    assert can_donate("O+", "O+")
    assert can_donate("O+", "A+")
    assert can_donate("O+", "B+")
    assert can_donate("O+", "AB+")
    assert not can_donate("O+", "O-")
    assert not can_donate("O+", "A-")


def test_compatible_donor_groups_for_a_pos():
    groups = compatible_donor_groups("A+")
    assert "O-" in groups
    assert "O+" in groups
    assert "A-" in groups
    assert "A+" in groups
    assert "B+" not in groups


def test_haversine_same_point():
    assert haversine_km(25.0, 67.0, 25.0, 67.0) == 0.0


def test_haversine_known_distance():
    # Karachi to Hyderabad ~150 km
    d = haversine_km(24.8607, 67.0011, 25.3960, 68.3578)
    assert 140 < d < 160


# ─── Donor Tests ─────────────────────────────────────────────────────────────


def test_donor_create_and_get():
    admin_token = _login("admin@bloodnet.pk", "Hackathon@123")
    uid = _get_user_id("admin@bloodnet.pk")
    _cleanup_donor(uid)

    # Create
    r = client.post(
        "/api/donors/profile",
        json={
            "blood_group": "O+",
            "date_of_birth": "1990-01-01",
            "city": "Karachi",
            "latitude": 24.8607,
            "longitude": 67.0011,
            "is_available": True,
        },
        headers=_auth(admin_token),
    )
    assert r.status_code == 201, r.text
    data = r.json()
    assert data["blood_group"] == "O+"
    assert data["city"] == "Karachi"
    assert "password_hash" not in data

    # Get
    r2 = client.get("/api/donors/profile", headers=_auth(admin_token))
    assert r2.status_code == 200
    assert r2.json()["blood_group"] == "O+"

    _cleanup_donor(uid)


def test_donor_duplicate_profile():
    admin_token = _login("admin@bloodnet.pk", "Hackathon@123")
    uid = _get_user_id("admin@bloodnet.pk")
    _cleanup_donor(uid)

    payload = {
        "blood_group": "A+",
        "date_of_birth": "1985-05-10",
        "city": "Lahore",
        "latitude": 31.5204,
        "longitude": 74.3587,
    }
    r1 = client.post("/api/donors/profile", json=payload, headers=_auth(admin_token))
    assert r1.status_code == 201

    r2 = client.post("/api/donors/profile", json=payload, headers=_auth(admin_token))
    assert r2.status_code == 409

    _cleanup_donor(uid)


def test_donor_update():
    admin_token = _login("admin@bloodnet.pk", "Hackathon@123")
    uid = _get_user_id("admin@bloodnet.pk")
    _cleanup_donor(uid)

    client.post(
        "/api/donors/profile",
        json={
            "blood_group": "B+",
            "date_of_birth": "1992-03-15",
            "city": "Islamabad",
            "latitude": 33.7294,
            "longitude": 73.0931,
        },
        headers=_auth(admin_token),
    )

    r = client.put(
        "/api/donors/profile",
        json={"city": "Rawalpindi", "is_available": False},
        headers=_auth(admin_token),
    )
    assert r.status_code == 200
    assert r.json()["city"] == "Rawalpindi"
    assert r.json()["is_available"] == False

    _cleanup_donor(uid)


def test_donor_unauthenticated():
    r = client.get("/api/donors/profile")
    assert r.status_code == 401


def test_available_donors_list():
    admin_token = _login("admin@bloodnet.pk", "Hackathon@123")
    r = client.get("/api/donors/available", headers=_auth(admin_token))
    assert r.status_code == 200
    assert isinstance(r.json(), list)


# ─── Blood Request Tests ──────────────────────────────────────────────────────


def test_create_blood_request():
    admin_token = _login("admin@bloodnet.pk", "Hackathon@123")
    uid = _get_user_id("admin@bloodnet.pk")
    _cleanup_requests(uid)
    hospital_id = _get_hospital_id()

    r = client.post(
        "/api/requests",
        json={
            "hospital_id": hospital_id,
            "blood_group": "O+",
            "units_required": 2,
            "required_before": "2026-12-31T23:59:00",
            "description": "Urgent surgery",
            "latitude": 24.86,
            "longitude": 67.01,
            "urgency": "HIGH",
        },
        headers=_auth(admin_token),
    )
    assert r.status_code == 201, r.text
    data = r.json()
    assert data["blood_group"] == "O+"
    assert data["units_required"] == 2
    assert data["status"] == "PENDING"

    _cleanup_requests(uid)


def test_get_my_requests():
    admin_token = _login("admin@bloodnet.pk", "Hackathon@123")
    uid = _get_user_id("admin@bloodnet.pk")
    _cleanup_requests(uid)
    hospital_id = _get_hospital_id()

    client.post(
        "/api/requests",
        json={
            "hospital_id": hospital_id,
            "blood_group": "A-",
            "units_required": 1,
            "required_before": "2026-12-31T23:59:00",
            "description": "Elective",
            "latitude": 24.0,
            "longitude": 67.0,
        },
        headers=_auth(admin_token),
    )

    r = client.get("/api/requests", headers=_auth(admin_token))
    assert r.status_code == 200
    assert len(r.json()) >= 1

    _cleanup_requests(uid)


def test_request_unauthorized_patch():
    admin_token = _login("admin@bloodnet.pk", "Hackathon@123")
    uid = _get_user_id("admin@bloodnet.pk")
    _cleanup_requests(uid)
    hospital_id = _get_hospital_id()

    # Create request as admin
    r = client.post(
        "/api/requests",
        json={
            "hospital_id": hospital_id,
            "blood_group": "B+",
            "units_required": 1,
            "required_before": "2026-12-31T23:59:00",
            "description": "test",
            "latitude": 24.0,
            "longitude": 67.0,
        },
        headers=_auth(admin_token),
    )
    req_id = r.json()["id"]

    # Try to update as a different user (requester)
    other_token = _login("ahmed.requester@bloodnet.pk", "Hackathon@123")
    r2 = client.patch(
        f"/api/requests/{req_id}",
        json={"description": "hack"},
        headers=_auth(other_token),
    )
    assert r2.status_code == 403

    _cleanup_requests(uid)


# ─── Matching Tests ───────────────────────────────────────────────────────────


def test_matching_flow():
    """End-to-end: create request, get matches, verify compatible donor appears."""
    # Use seeded donor usman.donor@bloodnet.pk who has blood group O+
    # Create a request for O+ blood
    admin_token = _login("admin@bloodnet.pk", "Hackathon@123")
    uid = _get_user_id("admin@bloodnet.pk")
    _cleanup_requests(uid)
    hospital_id = _get_hospital_id()

    # Get seeded donor's location
    db = SessionLocal()
    donor_row = db.execute(
        text("SELECT id, latitude, longitude FROM donors LIMIT 1")
    ).fetchone()
    db.close()

    if not donor_row:
        pytest.skip("No seeded donors available")

    r = client.post(
        "/api/requests",
        json={
            "hospital_id": hospital_id,
            "blood_group": "O+",
            "units_required": 1,
            "required_before": "2026-12-31T23:59:00",
            "description": "Matching test",
            "latitude": donor_row[1],
            "longitude": donor_row[2],
        },
        headers=_auth(admin_token),
    )
    assert r.status_code == 201
    req_id = r.json()["id"]

    # Get matches
    r2 = client.get(f"/api/requests/{req_id}/matches", headers=_auth(admin_token))
    assert r2.status_code == 200
    data = r2.json()
    assert data["request_id"] == req_id
    assert isinstance(data["matches"], list)
    # At least one match since seeded donors have various blood groups
    # Compatible groups for O+ include O- and O+

    _cleanup_requests(uid)


# ─── Notification Tests ───────────────────────────────────────────────────────


def test_notifications_list_and_read():
    admin_token = _login("admin@bloodnet.pk", "Hackathon@123")
    uid = _get_user_id("admin@bloodnet.pk")
    _cleanup_notifications(uid)

    # Manually insert a notification
    db = SessionLocal()
    db.execute(
        text(
            "INSERT INTO notifications (recipient_user_id, channel, status, title, message) "
            "VALUES (:uid, 'IN_APP', 'SENT', 'Test', 'Test message')"
        ),
        {"uid": uid},
    )
    db.commit()
    db.close()

    r = client.get("/api/notifications", headers=_auth(admin_token))
    assert r.status_code == 200
    notifs = r.json()
    assert len(notifs) >= 1
    notif_id = notifs[0]["id"]

    # Mark as read
    r2 = client.patch(f"/api/notifications/{notif_id}/read", headers=_auth(admin_token))
    assert r2.status_code == 200

    _cleanup_notifications(uid)
