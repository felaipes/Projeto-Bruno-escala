import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Schedule, Assignment
from app.schemas.schemas import (
    ScheduleRequest,
    ScheduleResult,
    SaveScheduleResponse,
    PublicScheduleResponse,
    ShiftAssignment,
)
from app.services.scheduling_service import SchedulingService

router = APIRouter(prefix="/api/schedules", tags=["schedules"])


@router.post("/generate", response_model=ScheduleResult)
def generate_schedule(request: ScheduleRequest):
    try:
        service = SchedulingService(request)
        return service.generate()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/save", response_model=SaveScheduleResponse, status_code=201)
def save_schedule(request: ScheduleRequest, db: Session = Depends(get_db)):
    try:
        service = SchedulingService(request)
        result = service.generate()
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    from datetime import datetime
    now = datetime.utcnow()

    schedule = Schedule(
        id=str(uuid.uuid4()),
        month=request.month or now.month,
        year=request.year or now.year,
        access_token=str(uuid.uuid4()),
    )
    db.add(schedule)

    for a in result.assignments:
        db.add(
            Assignment(
                id=str(uuid.uuid4()),
                schedule_id=schedule.id,
                collaborator_id=a.collaborator_id,
                collaborator_name=a.collaborator_name,
                shift_id=a.shift_id,
                shift_name=a.shift_name,
                date=a.date,
                start_time=a.start_time,
                end_time=a.end_time,
            )
        )

    db.commit()
    return SaveScheduleResponse(id=schedule.id, access_token=schedule.access_token)


@router.get("/public/{access_token}", response_model=PublicScheduleResponse)
def get_public_schedule(access_token: str, db: Session = Depends(get_db)):
    schedule = db.query(Schedule).filter(Schedule.access_token == access_token).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Escala não encontrada")

    return PublicScheduleResponse(
        id=schedule.id,
        month=schedule.month,
        year=schedule.year,
        assignments=[
            ShiftAssignment(
                shift_id=a.shift_id,
                shift_name=a.shift_name,
                collaborator_id=a.collaborator_id,
                collaborator_name=a.collaborator_name,
                date=a.date,
                start_time=a.start_time,
                end_time=a.end_time,
            )
            for a in schedule.assignments
        ],
    )
