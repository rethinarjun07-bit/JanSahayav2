import json
from datetime import datetime
from typing import Optional, List
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status, Query
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session, joinedload
# pyrefly: ignore [missing-import]
from sqlalchemy import desc

from backend.app.db.session import get_db
from backend.app.models.entities import Solution, Milestone, Review, User, Challenge
from backend.app.schemas.domain import SolutionCreate, ReviewCreate, EndorseRequest
from backend.app.api.deps import get_current_user, get_current_user_optional

router = APIRouter(prefix="/solutions", tags=["Solutions"])

def format_solution_dict(s: Solution) -> dict:
    tech_stack = []
    if s.tech_stack:
        try:
            tech_stack = json.loads(s.tech_stack)
        except Exception:
            tech_stack = [s.tech_stack]

    media_urls = []
    if s.media_urls:
        try:
            media_urls = json.loads(s.media_urls)
        except Exception:
            media_urls = [s.media_urls]

    milestones_data = []
    if s.milestones:
        for m in sorted(s.milestones, key=lambda x: x.order):
            milestones_data.append({
                "id": m.id,
                "order": m.order,
                "title": m.title,
                "description": m.description,
                "targetDate": m.target_date.isoformat() if m.target_date else None,
                "status": m.status,
                "proofUrl": m.proof_url,
                "notes": m.notes,
            })

    reviews_data = []
    if s.reviews:
        for r in s.reviews:
            reviews_data.append({
                "id": r.id,
                "role": r.role,
                "rating": r.rating,
                "feasibilityScore": r.feasibility_score,
                "impactScore": r.impact_score,
                "costEffectiveness": r.cost_effectiveness,
                "scalabilityScore": r.scalability_score,
                "feedback": r.feedback,
                "createdAt": r.created_at.isoformat() if r.created_at else None,
                "reviewer": {
                    "id": r.reviewer.id,
                    "name": r.reviewer.name,
                    "role": r.reviewer.role,
                    "organization": r.reviewer.organization,
                } if r.reviewer else None,
            })

    return {
        "id": s.id,
        "challengeId": s.challenge_id,
        "authorId": s.author_id,
        "teamName": s.team_name,
        "title": s.title,
        "abstract": s.abstract,
        "methodology": s.methodology,
        "techStack": tech_stack,
        "budgetEstimate": s.budget_estimate,
        "timelineMonths": s.timeline_months,
        "prototypeUrl": s.prototype_url,
        "mediaUrls": media_urls,
        "status": s.status,
        "milestoneStage": s.milestone_stage,
        "govtEndorsed": s.govt_endorsed,
        "endorsedBy": s.endorsed_by,
        "endorsedAt": s.endorsed_at.isoformat() if s.endorsed_at else None,
        "createdAt": s.created_at.isoformat() if s.created_at else None,
        "author": {
            "id": s.author.id,
            "name": s.author.name,
            "email": s.author.email,
            "role": s.author.role,
            "organization": s.author.organization,
            "designation": s.author.designation,
            "avatar": s.author.avatar,
        } if s.author else None,
        "challenge": {
            "id": s.challenge.id,
            "title": s.challenge.title,
            "category": s.challenge.category,
            "district": s.challenge.district,
            "severity": s.challenge.severity,
        } if s.challenge else None,
        "milestones": milestones_data,
        "reviews": reviews_data,
    }

@router.get("")
def list_solutions(
    challengeId: Optional[str] = None,
    authorId: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Solution).options(
        joinedload(Solution.author),
        joinedload(Solution.challenge),
        joinedload(Solution.milestones),
        joinedload(Solution.reviews).joinedload(Review.reviewer),
    )

    if challengeId:
        query = query.filter(Solution.challenge_id == challengeId)
    if authorId:
        query = query.filter(Solution.author_id == authorId)

    total = query.count()
    solutions = query.order_by(desc(Solution.created_at)).offset(offset).limit(limit).all()

    return {
        "solutions": [format_solution_dict(s) for s in solutions],
        "total": total,
    }

@router.get("/{id}")
def get_solution(id: str, db: Session = Depends(get_db)):
    solution = db.query(Solution).options(
        joinedload(Solution.author),
        joinedload(Solution.challenge),
        joinedload(Solution.milestones),
        joinedload(Solution.reviews).joinedload(Review.reviewer),
    ).filter(Solution.id == id).first()

    if not solution:
        raise HTTPException(status_code=404, detail="Solution not found")

    return format_solution_dict(solution)

@router.post("")
def create_solution(
    req: SolutionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    challenge = db.query(Challenge).filter(Challenge.id == req.challengeId).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Associated challenge not found")

    solution = Solution(
        challenge_id=req.challengeId,
        author_id=current_user.id,
        team_name=req.teamName or f"{current_user.name}'s Innovation Lab",
        title=req.title,
        abstract=req.abstract,
        methodology=req.methodology,
        tech_stack=json.dumps(req.techStack or []),
        budget_estimate=req.budgetEstimate,
        timeline_months=req.timelineMonths,
        prototype_url=req.prototypeUrl,
        media_urls=json.dumps(req.mediaUrls or []),
        status="PROPOSED",
        milestone_stage="Phase 1: Conceptualization & Validation",
    )
    db.add(solution)
    db.flush()

    # Add default or custom milestones
    if req.milestones:
        for m in req.milestones:
            ms = Milestone(
                solution_id=solution.id,
                order=m.order,
                title=m.title,
                description=m.description,
                target_date=m.targetDate,
                status="PENDING",
            )
            db.add(ms)
    else:
        # Generate standard 4-stage milestones
        standard_milestones = [
            (1, "Phase 1: Design & Lab Prototype", "Formalizing engineering blueprint and simulation testing."),
            (2, "Phase 2: Pilot Deployment & Testing", "Deploying sensor / pilot unit on ground for operational testing."),
            (3, "Phase 3: Government & Field Verification", "Inspected by district administration and empaneled university."),
            (4, "Phase 4: Full Scale State Rollout", "Scaling to target districts with CSR co-funding."),
        ]
        for order, m_title, m_desc in standard_milestones:
            ms = Milestone(
                solution_id=solution.id,
                order=order,
                title=m_title,
                description=m_desc,
                status="SUBMITTED" if order == 1 else "PENDING",
            )
            db.add(ms)

    # Award solver karma points (+100)
    current_user.karma_points = (current_user.karma_points or 100) + 100

    db.commit()
    db.refresh(solution)

    return {
        "solution": format_solution_dict(solution),
        "message": "Solution proposed successfully"
    }

@router.post("/{id}/review")
def add_review(
    id: str,
    req: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["SOLVER", "INDUSTRY", "ADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Only Technical Evaluators (SOLVER, INDUSTRY, ADMIN) can submit proposal reviews."
        )

    solution = db.query(Solution).filter(Solution.id == id).first()
    if not solution:
        raise HTTPException(status_code=404, detail="Solution not found")

    if solution.author_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: Solvers and proposal authors cannot review their own proposals."
        )

    existing_review = db.query(Review).filter(
        Review.solution_id == id,
        Review.reviewer_id == current_user.id
    ).first()
    if existing_review:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Conflict: You have already submitted a review for this proposal."
        )

    review = Review(
        solution_id=id,
        reviewer_id=current_user.id,
        role=req.role or current_user.role,
        rating=req.rating,
        feasibility_score=req.feasibilityScore,
        impact_score=req.impactScore,
        cost_effectiveness=req.costEffectiveness,
        scalability_score=req.scalabilityScore,
        feedback=req.feedback,
    )
    db.add(review)

    # Update solution status to MENTOR_REVIEW if applicable
    if solution.status == "PROPOSED":
        solution.status = "MENTOR_REVIEW"

    # Reward reviewer karma
    current_user.karma_points = (current_user.karma_points or 100) + 25

    db.commit()
    db.refresh(review)

    return {
        "message": "Review submitted successfully",
        "review": {
            "id": review.id,
            "rating": review.rating,
            "feedback": review.feedback,
            "role": review.role,
            "createdAt": review.created_at.isoformat(),
        }
    }

@router.post("/{id}/endorse")
def endorse_solution(
    id: str,
    req: EndorseRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    solution = db.query(Solution).filter(Solution.id == id).first()
    if not solution:
        raise HTTPException(status_code=404, detail="Solution not found")

    solution.govt_endorsed = True
    solution.endorsed_by = req.endorsedBy or current_user.name
    solution.endorsed_at = datetime.utcnow()
    solution.status = "GOVT_VERIFIED"

    db.commit()

    return {
        "message": "Solution endorsed successfully by official nodal authorities",
        "endorsedBy": solution.endorsed_by,
        "endorsedAt": solution.endorsed_at.isoformat(),
    }
