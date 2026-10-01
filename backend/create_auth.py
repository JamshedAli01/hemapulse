import os

security_code = """from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
import jwt
from typing import Optional, Any
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(subject: str | Any, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt
"""

dependencies_code = """from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import get_db
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.InvalidTokenError:
        raise credentials_exception
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=401, detail="Inactive user")
    return current_user
"""

auth_router_code = """from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.db.session import get_db
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.dependencies import get_current_active_user
from app.models.user import User
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from app.core.config import settings

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest, db: Session = Depends(get_db)) -> Any:
    normalized_email = request.email.lower().strip()
    
    existing_user = db.query(User).filter(User.email == normalized_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )
    
    user = User(
        name=request.name.strip(),
        email=normalized_email,
        phone=request.phone.strip() if request.phone else None,
        password_hash=get_password_hash(request.password),
        role=request.role,
        is_active=True
    )
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")
        
    return {"message": "Registered successfully"}

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)) -> Any:
    normalized_email = request.email.lower().strip()
    user = db.query(User).filter(User.email == normalized_email).first()
    
    auth_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Incorrect email or password",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not user:
        raise auth_exception
    
    if not verify_password(request.password, user.password_hash):
        raise auth_exception
        
    if not user.is_active:
        raise HTTPException(status_code=401, detail="Inactive user")
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.id, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
def read_users_me(
    current_user: User = Depends(get_current_active_user)
) -> Any:
    return current_user
"""

test_auth_code = """from fastapi.testclient import TestClient
from sqlalchemy import text
from app.main import app
from app.db.session import SessionLocal
import pytest
import time

client = TestClient(app)

def test_seeded_user_login_and_me():
    # Login seeded user
    response = client.post("/api/auth/login", json={
        "email": "admin@bloodnet.pk",
        "password": "Hackathon@123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "password_hash" not in data
    
    token = data["access_token"]
    
    # Get ME
    me_response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_response.status_code == 200
    me_data = me_response.json()
    assert me_data["email"] == "admin@bloodnet.pk"
    assert me_data["role"] == "ADMIN"
    assert "password_hash" not in me_data
    assert "password" not in me_data

def test_register_duplicate():
    # Attempt register with duplicate
    response = client.post("/api/auth/register", json={
        "name": "Admin Two",
        "email": "admin@bloodnet.pk",
        "phone": "+92300000",
        "password": "newpassword123",
        "role": "REQUESTER"
    })
    assert response.status_code == 409

def test_register_new_user():
    # Clean up first if it exists from a previous test run
    db = SessionLocal()
    db.execute(text("DELETE FROM users WHERE email='test_new@bloodnet.pk'"))
    db.commit()
    db.close()

    response = client.post("/api/auth/register", json={
        "name": "Test User",
        "email": "test_new@bloodnet.pk",
        "phone": "+92300001",
        "password": "testpassword123",
        "role": "DONOR"
    })
    assert response.status_code == 201

    # Login new user
    login_response = client.post("/api/auth/login", json={
        "email": "test_new@bloodnet.pk",
        "password": "testpassword123"
    })
    assert login_response.status_code == 200
    
    token = login_response.json()["access_token"]
    
    me_response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_response.status_code == 200
    assert me_response.json()["email"] == "test_new@bloodnet.pk"
    assert me_response.json()["role"] == "DONOR"

def test_invalid_login():
    response = client.post("/api/auth/login", json={
        "email": "admin@bloodnet.pk",
        "password": "wrongpassword"
    })
    assert response.status_code == 401

def test_unauthorized_me():
    response = client.get("/api/auth/me")
    assert response.status_code == 401
    
    response2 = client.get("/api/auth/me", headers={"Authorization": "Bearer invalidtoken"})
    assert response2.status_code == 401
"""

with open("app/core/security.py", "w") as f: f.write(security_code)
with open("app/core/dependencies.py", "w") as f: f.write(dependencies_code)
os.makedirs("app/api/routes", exist_ok=True)
with open("app/api/routes/auth.py", "w") as f: f.write(auth_router_code)
with open("tests/test_auth.py", "w") as f: f.write(test_auth_code)
print("Auth files created successfully.")
