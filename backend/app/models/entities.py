import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, ForeignKey, Text, UniqueConstraint
)
from sqlalchemy.orm import relationship
from backend.app.db.session import Base

def generate_id():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_id)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, default="CITIZEN", index=True)  # CITIZEN, SOLVER, INDUSTRY, ADMIN
    avatar = Column(String, nullable=True)
    organization = Column(String, nullable=True)
    designation = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    district = Column(String, nullable=True)
    state = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    skills = Column(Text, nullable=True)  # JSON array string
    karma_points = Column(Integer, default=100)
    badges = Column(Text, nullable=True)  # JSON array string
    is_verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    challenges = relationship("Challenge", back_populates="created_by", cascade="all, delete-orphan", foreign_keys="Challenge.created_by_id")
    solutions = relationship("Solution", back_populates="author", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="reviewer", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan")
    upvotes = relationship("Upvote", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="actor", cascade="all, delete-orphan")

class Challenge(Base):
    __tablename__ = "challenges"

    id = Column(String, primary_key=True, default=generate_id)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=False)
    category = Column(String, nullable=False, index=True)
    severity = Column(String, default="MEDIUM", index=True)  # LOW, MEDIUM, HIGH, CRITICAL
    urgency_score = Column(Integer, default=50)  # 1-100
    status = Column(String, default="SUBMITTED", index=True)  # SUBMITTED, VERIFIED, ASSIGNED, IN_PROGRESS, SOLVED, REJECTED, MERGED
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String, nullable=False)
    district = Column(String, nullable=False, index=True)
    state = Column(String, nullable=False)
    pincode = Column(String, nullable=True)
    media_urls = Column(Text, nullable=True)  # JSON array string
    audio_url = Column(String, nullable=True)
    voice_transcript = Column(Text, nullable=True)
    language = Column(String, default="en")
    
    master_challenge_id = Column(String, ForeignKey("challenges.id"), nullable=True)
    is_master = Column(Boolean, default=False)
    duplicate_score = Column(Float, nullable=True)
    ai_tags = Column(Text, nullable=True)  # JSON array string
    predicted_sector = Column(String, nullable=True)
    auto_assigned_university = Column(String, nullable=True)
    official_notes = Column(Text, nullable=True)
    verified_at = Column(DateTime, nullable=True)
    verified_by_id = Column(String, nullable=True)
    assigned_university_id = Column(String, ForeignKey("universities.id"), nullable=True)
    assigned_department = Column(String, nullable=True)
    view_count = Column(Integer, default=0)
    
    # Provenance Architecture (Citizen -> AI -> Government Official Decision)
    citizen_reported_category = Column(String, nullable=True)
    citizen_reported_severity = Column(String, nullable=True)
    ai_predicted_category = Column(String, nullable=True)
    ai_predicted_severity = Column(String, nullable=True)
    ai_urgency_score = Column(Integer, nullable=True)
    official_government_category = Column(String, nullable=True)
    official_government_severity = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    created_by_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_by = relationship("User", back_populates="challenges", foreign_keys=[created_by_id])

    master_challenge = relationship("Challenge", remote_side=[id], backref="duplicates")
    assigned_university = relationship("University", foreign_keys=[assigned_university_id])
    solutions = relationship("Solution", back_populates="challenge", cascade="all, delete-orphan")
    upvotes = relationship("Upvote", back_populates="challenge", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="challenge", cascade="all, delete-orphan")

class DuplicateMerge(Base):
    __tablename__ = "duplicate_merges"

    id = Column(String, primary_key=True, default=generate_id)
    master_challenge_id = Column(String, ForeignKey("challenges.id"), nullable=False)
    duplicate_challenge_id = Column(String, ForeignKey("challenges.id"), nullable=False)
    similarity_score = Column(Float, nullable=False)
    reason = Column(Text, nullable=False)
    merged_by_id = Column(String, nullable=False)
    merged_at = Column(DateTime, default=datetime.utcnow)

class Solution(Base):
    __tablename__ = "solutions"

    id = Column(String, primary_key=True, default=generate_id)
    challenge_id = Column(String, ForeignKey("challenges.id", ondelete="CASCADE"), nullable=False)
    author_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    team_name = Column(String, nullable=True)
    title = Column(String, nullable=False)
    abstract = Column(Text, nullable=False)
    methodology = Column(Text, nullable=False)
    tech_stack = Column(Text, nullable=True)  # JSON array string
    budget_estimate = Column(Float, nullable=True)
    timeline_months = Column(Integer, nullable=True)
    prototype_url = Column(String, nullable=True)
    media_urls = Column(Text, nullable=True)  # JSON array string
    status = Column(String, default="PROPOSED", index=True)  # DRAFT, PROPOSED, MENTOR_REVIEW, PILOT_DEPLOYED, GOVT_VERIFIED, DEPLOYED
    milestone_stage = Column(String, default="Phase 1: Conceptualization")
    govt_endorsed = Column(Boolean, default=False)
    endorsed_by = Column(String, nullable=True)
    endorsed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    challenge = relationship("Challenge", back_populates="solutions")
    author = relationship("User", back_populates="solutions")
    milestones = relationship("Milestone", back_populates="solution", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="solution", cascade="all, delete-orphan")
    upvotes = relationship("Upvote", back_populates="solution", cascade="all, delete-orphan")
    comments = relationship("Comment", back_populates="solution", cascade="all, delete-orphan")

class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(String, primary_key=True, default=generate_id)
    solution_id = Column(String, ForeignKey("solutions.id", ondelete="CASCADE"), nullable=False)
    order = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    target_date = Column(DateTime, nullable=True)
    status = Column(String, default="PENDING")  # PENDING, SUBMITTED, APPROVED, REJECTED
    proof_url = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    solution = relationship("Solution", back_populates="milestones")

class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (UniqueConstraint("reviewer_id", "solution_id", name="uq_reviewer_solution"),)

    id = Column(String, primary_key=True, default=generate_id)
    solution_id = Column(String, ForeignKey("solutions.id", ondelete="CASCADE"), nullable=False)
    reviewer_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String, nullable=False)  # MENTOR, INDUSTRY, GOVT_NODAL
    rating = Column(Float, nullable=False)  # 1 to 5
    feasibility_score = Column(Float, default=4.0)
    impact_score = Column(Float, default=4.0)
    cost_effectiveness = Column(Float, default=4.0)
    scalability_score = Column(Float, default=4.0)
    feedback = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    solution = relationship("Solution", back_populates="reviews")
    reviewer = relationship("User", back_populates="reviews")

class Upvote(Base):
    __tablename__ = "upvotes"

    id = Column(String, primary_key=True, default=generate_id)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    challenge_id = Column(String, ForeignKey("challenges.id", ondelete="CASCADE"), nullable=True)
    solution_id = Column(String, ForeignKey("solutions.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="upvotes")
    challenge = relationship("Challenge", back_populates="upvotes")
    solution = relationship("Solution", back_populates="upvotes")

class Comment(Base):
    __tablename__ = "comments"

    id = Column(String, primary_key=True, default=generate_id)
    content = Column(Text, nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    challenge_id = Column(String, ForeignKey("challenges.id", ondelete="CASCADE"), nullable=True)
    solution_id = Column(String, ForeignKey("solutions.id", ondelete="CASCADE"), nullable=True)
    audio_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="comments")
    challenge = relationship("Challenge", back_populates="comments")
    solution = relationship("Solution", back_populates="comments")

class University(Base):
    __tablename__ = "universities"

    id = Column(String, primary_key=True, default=generate_id)
    name = Column(String, nullable=False)
    code = Column(String, unique=True, index=True, nullable=False)
    state = Column(String, nullable=False)
    district = Column(String, nullable=False)
    departments = Column(Text, nullable=False)  # JSON array string
    expertise_tags = Column(Text, nullable=False)  # JSON array string
    nodal_officer_name = Column(String, nullable=False)
    nodal_officer_email = Column(String, nullable=False)
    logo_url = Column(String, nullable=True)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=generate_id)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, default="INFO")  # INFO, SUCCESS, WARNING, BADGE_EARNED, DUPLICATE_ALERT
    link = Column(String, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=generate_id)
    action = Column(String, nullable=False)
    entity_type = Column(String, nullable=False)
    entity_id = Column(String, nullable=False)
    actor_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    actor_name = Column(String, nullable=False)
    details = Column(Text, nullable=True)  # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)

    actor = relationship("User", back_populates="audit_logs")
