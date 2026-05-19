import uuid
from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Schedule, Assignment
from app.schemas.schemas import (
    ScheduleRequest, ScheduleResult, SaveScheduleResponse,
    PublicScheduleResponse, ShiftAssignment,
    ScheduleListItem, FullScheduleResponse,
    ManualScheduleCreate, AssignmentCreate, AssignmentResponse,
)
from app.services.scheduling_service import SchedulingService

router = APIRouter(prefix="/api/schedules", tags=["schedules"])


# ── Stateless generation ──────────────────────────────────────────────────────

@router.post("/generate", response_model=ScheduleResult)
def generate_schedule(request: ScheduleRequest):
    try:
        return SchedulingService(request).generate()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Saved schedules list ──────────────────────────────────────────────────────

@router.get("/", response_model=List[ScheduleListItem])
def list_schedules(db: Session = Depends(get_db)):
    schedules = db.query(Schedule).order_by(Schedule.created_at.desc()).all()
    return [
        ScheduleListItem(
            id=s.id, month=s.month, year=s.year,
            access_token=s.access_token, created_at=s.created_at,
            assignments_count=len(s.assignments),
        )
        for s in schedules
    ]


# ── Generate + save ───────────────────────────────────────────────────────────

@router.post("/save", response_model=SaveScheduleResponse, status_code=201)
def save_schedule(request: ScheduleRequest, db: Session = Depends(get_db)):
    try:
        result = SchedulingService(request).generate()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    now = datetime.utcnow()
    schedule = Schedule(
        id=str(uuid.uuid4()), month=request.month or now.month,
        year=request.year or now.year, access_token=str(uuid.uuid4()),
    )
    db.add(schedule)
    db.flush()

    for a in result.assignments:
        db.add(Assignment(
            id=str(uuid.uuid4()), schedule_id=schedule.id,
            collaborator_id=a.collaborator_id, collaborator_name=a.collaborator_name,
            shift_id=a.shift_id, shift_name=a.shift_name,
            date=a.date, start_time=a.start_time, end_time=a.end_time,
        ))
    db.commit()
    return SaveScheduleResponse(id=schedule.id, access_token=schedule.access_token)


# ── Manual empty schedule ─────────────────────────────────────────────────────

@router.post("/manual", response_model=SaveScheduleResponse, status_code=201)
def create_manual_schedule(data: ManualScheduleCreate, db: Session = Depends(get_db)):
    schedule = Schedule(
        id=str(uuid.uuid4()), month=data.month,
        year=data.year, access_token=str(uuid.uuid4()),
    )
    db.add(schedule)
    db.commit()
    return SaveScheduleResponse(id=schedule.id, access_token=schedule.access_token)


# ── Public read-only access ───────────────────────────────────────────────────

@router.get("/public/{access_token}", response_model=PublicScheduleResponse)
def get_public_schedule(access_token: str, db: Session = Depends(get_db)):
    schedule = db.query(Schedule).filter(Schedule.access_token == access_token).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Escala não encontrada")
    return PublicScheduleResponse(
        id=schedule.id, month=schedule.month, year=schedule.year,
        assignments=[
            ShiftAssignment(
                id=a.id, shift_id=a.shift_id, shift_name=a.shift_name,
                collaborator_id=a.collaborator_id, collaborator_name=a.collaborator_name,
                date=a.date, start_time=a.start_time, end_time=a.end_time,
            )
            for a in schedule.assignments
        ],
    )


# ── Get full schedule ─────────────────────────────────────────────────────────

@router.get("/{schedule_id}", response_model=FullScheduleResponse)
def get_schedule(schedule_id: str, db: Session = Depends(get_db)):
    schedule = db.query(Schedule).filter(Schedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Escala não encontrada")
    return FullScheduleResponse(
        id=schedule.id, month=schedule.month, year=schedule.year,
        access_token=schedule.access_token,
        assignments=[
            ShiftAssignment(
                id=a.id, shift_id=a.shift_id, shift_name=a.shift_name,
                collaborator_id=a.collaborator_id, collaborator_name=a.collaborator_name,
                date=a.date, start_time=a.start_time, end_time=a.end_time,
            )
            for a in schedule.assignments
        ],
    )


# ── Manual assignment CRUD ────────────────────────────────────────────────────

@router.post("/{schedule_id}/assignments", response_model=AssignmentResponse, status_code=201)
def add_assignment(schedule_id: str, data: AssignmentCreate, db: Session = Depends(get_db)):
    if not db.query(Schedule).filter(Schedule.id == schedule_id).first():
        raise HTTPException(status_code=404, detail="Escala não encontrada")
    assignment = Assignment(id=str(uuid.uuid4()), schedule_id=schedule_id, **data.model_dump())
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return assignment


@router.delete("/{schedule_id}/assignments/{assignment_id}", status_code=204)
def remove_assignment(schedule_id: str, assignment_id: str, db: Session = Depends(get_db)):
    a = db.query(Assignment).filter(
        Assignment.id == assignment_id, Assignment.schedule_id == schedule_id
    ).first()
    if not a:
        raise HTTPException(status_code=404, detail="Atribuição não encontrada")
    db.delete(a)
    db.commit()
