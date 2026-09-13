import json
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.models.entities import Challenge, User, University, DuplicateMerge, AuditLog
from backend.app.schemas.domain import VerifyRequest, AssignRequest, MergeRequest
from backend.app.api.deps import get_current_user, require_roles

router = APIRouter(prefix="/admin", tags=["Admin Government Operations"])

@router.post("/verify")
def verify_challenge(
    req: VerifyRequest,
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db)
):
    challenge = db.query(Challenge).filter(Challenge.id == req.challengeId).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    challenge.status = req.status
    challenge.official_notes = req.officialNotes
    challenge.verified_at = datetime.utcnow()
    challenge.verified_by_id = current_user.id
    if req.autoAssignedUniversity:
        challenge.auto_assigned_university = req.autoAssignedUniversity

    # Record Audit Log for statutory verification
    log = AuditLog(
        action="VERIFY_CHALLENGE",
        entity_type="Challenge",
        entity_id=challenge.id,
        actor_id=current_user.id,
        actor_name=current_user.name,
        details=json.dumps({
            "newStatus": req.status,
            "officialNotes": req.officialNotes,
            "officerDesignation": current_user.designation or "Nodal Officer",
            "department": current_user.organization or "Disaster Management Cell",
        })
    )
    db.add(log)
    db.commit()

    return {
        "message": f"Challenge marked as {req.status} by {current_user.name}",
        "challengeId": challenge.id,
        "status": challenge.status,
        "verifiedAt": challenge.verified_at.isoformat(),
        "verifiedBy": current_user.name,
    }

@router.post("/assign")
def assign_university(
    req: AssignRequest,
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db)
):
    challenge = db.query(Challenge).filter(Challenge.id == req.challengeId).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    if challenge.status not in ["VERIFIED", "ASSIGNED", "IN_PROGRESS"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot assign research lab to an unverified challenge. Challenge must be officially verified by Government first."
        )

    university = db.query(University).filter(University.id == req.universityId).first()
    if not university:
        raise HTTPException(status_code=404, detail="University not found")

    challenge.assigned_university_id = university.id
    challenge.assigned_department = req.assignedDepartment
    challenge.status = "ASSIGNED"

    # Audit log
    log = AuditLog(
        action="ASSIGN_UNIVERSITY",
        entity_type="Challenge",
        entity_id=challenge.id,
        actor_id=current_user.id,
        actor_name=current_user.name,
        details=json.dumps({
            "assignedUniversity": university.name,
            "department": req.assignedDepartment,
            "notes": req.notes,
        })
    )
    db.add(log)
    db.commit()

    return {
        "message": f"Assigned to {university.name} successfully",
        "challengeId": challenge.id,
        "assignedUniversity": university.name,
        "department": req.assignedDepartment,
        "status": challenge.status,
    }

@router.post("/merge")
def merge_duplicates(
    req: MergeRequest,
    current_user: User = Depends(require_roles(["ADMIN"])),
    db: Session = Depends(get_db)
):
    master = db.query(Challenge).filter(Challenge.id == req.masterChallengeId).first()
    dup = db.query(Challenge).filter(Challenge.id == req.duplicateChallengeId).first()

    if not master or not dup:
        raise HTTPException(status_code=404, detail="Master or Duplicate challenge not found")

    master.is_master = True
    dup.master_challenge_id = master.id
    dup.status = "MERGED"

    merge_record = DuplicateMerge(
        master_challenge_id=master.id,
        duplicate_challenge_id=dup.id,
        similarity_score=req.similarityScore,
        reason=req.reason,
        merged_by_id=current_user.id,
    )
    db.add(merge_record)

    # Audit log
    log = AuditLog(
        action="MERGE_DUPLICATE",
        entity_type="Challenge",
        entity_id=dup.id,
        actor_id=current_user.id,
        actor_name=current_user.name,
        details=json.dumps({
            "masterChallengeId": master.id,
            "masterTitle": master.title,
            "similarity": req.similarityScore,
            "reason": req.reason,
        })
    )
    db.add(log)
    db.commit()

    return {
        "message": f"Duplicate challenge merged into Master '{master.title}'",
        "masterId": master.id,
        "duplicateId": dup.id,
    }
