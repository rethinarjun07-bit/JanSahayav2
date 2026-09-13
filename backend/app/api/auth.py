import json
from typing import Optional
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.models.entities import User
from backend.app.schemas.domain import (
    LoginRequest, RegisterRequest, DemoSwitchRequest, QuickLoginRequest, UserResponse
)
from backend.app.core.security import verify_password, get_password_hash, create_access_token
from backend.app.api.deps import get_current_user, get_current_user_optional

router = APIRouter(prefix="/auth", tags=["Authentication"])

def format_user_response(user: User) -> dict:
    badges = []
    if user.badges:
        try:
            badges = json.loads(user.badges)
        except Exception:
            badges = []
    
    skills = []
    if user.skills:
        try:
            skills = json.loads(user.skills)
        except Exception:
            skills = []

    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "organization": user.organization,
        "designation": user.designation,
        "phone": user.phone,
        "district": user.district,
        "state": user.state,
        "avatar": user.avatar,
        "bio": user.bio,
        "skills": skills,
        "karmaPoints": user.karma_points,
        "badges": badges,
        "isVerified": user.is_verified,
    }

def set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key="jansahaya_token",
        value=token,
        httponly=True,
        max_age=60 * 60 * 24 * 7,
        path="/",
        samesite="lax",
    )

@router.post("/login")
def login(req: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user or not verify_password(req.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token_data = {
        "userId": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "organization": user.organization,
        "district": user.district,
    }
    token = create_access_token(token_data)
    set_auth_cookie(response, token)

    return {
        "token": token,
        "user": format_user_response(user)
    }

@router.post("/register")
def register(req: RegisterRequest, response: Response, db: Session = Depends(get_db)):
    requested_role = req.role.upper().strip()
    allowed_roles = ["CITIZEN", "SOLVER", "INDUSTRY"]
    if requested_role == "ADMIN" or requested_role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Government Authority (ADMIN) accounts cannot be self-registered via public endpoints."
        )

    existing = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    new_user = User(
        email=req.email.lower().strip(),
        password=get_password_hash(req.password),
        name=req.name,
        role=requested_role,
        organization=req.organization,
        designation=req.designation,
        phone=req.phone,
        district=req.district,
        state=req.state or "Jharkhand",
        karma_points=100,
        badges="[]",
        skills="[]",
        is_verified=True,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token_data = {
        "userId": new_user.id,
        "email": new_user.email,
        "name": new_user.name,
        "role": new_user.role,
        "organization": new_user.organization,
        "district": new_user.district,
    }
    token = create_access_token(token_data)
    set_auth_cookie(response, token)

    return {
        "token": token,
        "user": format_user_response(new_user)
    }

@router.get("/me")
def get_me(current_user: Optional[User] = Depends(get_current_user_optional)):
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return {
        "user": format_user_response(current_user)
    }

@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("jansahaya_token", path="/")
    return {"message": "Logged out successfully"}

@router.post("/demo-switch")
def demo_switch(req: DemoSwitchRequest, response: Response, db: Session = Depends(get_db)):
    """1-Click Role Switcher for Hackathon evaluators"""
    role_email_map = {
        "ADMIN": "admin@demo.in",
        "CITIZEN": "citizen@demo.in",
        "SOLVER": "solver@demo.in",
        "INDUSTRY": "industry@demo.in",
    }
    target_email = role_email_map.get(req.role.upper())
    if not target_email:
        raise HTTPException(status_code=400, detail=f"Unsupported role: {req.role}")

    user = db.query(User).filter(User.email == target_email).first()
    if not user:
        # Fallback to any user with that role
        user = db.query(User).filter(User.role == req.role.upper()).first()

    if not user:
        raise HTTPException(status_code=404, detail=f"No demo user found for role {req.role}. Please run seed script.")

    token_data = {
        "userId": user.id,
        "email": user.email,
        "name": user.name,
        "role": user.role,
        "organization": user.organization,
        "district": user.district,
    }
    token = create_access_token(token_data)
    set_auth_cookie(response, token)

    return {
        "token": token,
        "user": format_user_response(user)
    }

@router.post("/quick-login")
def quick_login(req: QuickLoginRequest, response: Response, db: Session = Depends(get_db)):
    return demo_switch(DemoSwitchRequest(role=req.role), response, db)
