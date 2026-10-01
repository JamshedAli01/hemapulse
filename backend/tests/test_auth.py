from fastapi.testclient import TestClient
from sqlalchemy import text
from app.main import app
from app.db.session import SessionLocal

client = TestClient(app)


def test_seeded_user_login_and_me():
    # Login seeded user
    response = client.post(
        "/api/auth/login",
        json={"email": "admin@bloodnet.pk", "password": "Hackathon@123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "password_hash" not in data

    token = data["access_token"]

    # Get ME
    me_response = client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert me_response.status_code == 200
    me_data = me_response.json()
    assert me_data["email"] == "admin@bloodnet.pk"
    assert me_data["role"] == "ADMIN"
    assert "password_hash" not in me_data
    assert "password" not in me_data


def test_register_duplicate():
    # Attempt register with duplicate
    response = client.post(
        "/api/auth/register",
        json={
            "name": "Admin Two",
            "email": "admin@bloodnet.pk",
            "phone": "+92300000",
            "password": "newpassword123",
            "role": "REQUESTER",
        },
    )
    assert response.status_code == 409


def test_register_new_user():
    # Clean up first if it exists from a previous test run
    db = SessionLocal()
    db.execute(text("DELETE FROM users WHERE email='test_new@bloodnet.pk'"))
    db.commit()
    db.close()

    response = client.post(
        "/api/auth/register",
        json={
            "name": "Test User",
            "email": "test_new@bloodnet.pk",
            "phone": "+92300001",
            "password": "testpassword123",
            "role": "DONOR",
        },
    )
    assert response.status_code == 201

    # Login new user
    login_response = client.post(
        "/api/auth/login",
        json={"email": "test_new@bloodnet.pk", "password": "testpassword123"},
    )
    assert login_response.status_code == 200

    token = login_response.json()["access_token"]

    me_response = client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "test_new@bloodnet.pk"
    assert me_response.json()["role"] == "DONOR"


def test_invalid_login():
    response = client.post(
        "/api/auth/login",
        json={"email": "admin@bloodnet.pk", "password": "wrongpassword"},
    )
    assert response.status_code == 401


def test_unauthorized_me():
    response = client.get("/api/auth/me")
    assert response.status_code == 401

    response2 = client.get(
        "/api/auth/me", headers={"Authorization": "Bearer invalidtoken"}
    )
    assert response2.status_code == 401
