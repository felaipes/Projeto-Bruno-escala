import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Shift
from app.schemas.schemas import ShiftCreate, ShiftResponse

router = APIRouter(prefix="/api/shifts", tags=["shifts"])


@router.get("/", response_model=List[ShiftResponse])
def list_shifts(db: Session = Depends(get_db)):
    return db.query(Shift).order_by(Shift.created_at).all()


@router.post("/", response_model=ShiftResponse, status_code=201)
def create_shift(data: ShiftCreate, db: Session = Depends(get_db)):
    shift = Shift(id=str(uuid.uuid4()), **data.model_dump())
    db.add(shift)
    db.commit()
    db.refresh(shift)
    return shift


@router.put("/{shift_id}", response_model=ShiftResponse)
def update_shift(shift_id: str, data: ShiftCreate, db: Session = Depends(get_db)):
    shift = db.query(Shift).filter(Shift.id == shift_id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Turno não encontrado")
    for key, value in data.model_dump().items():
        setattr(shift, key, value)
    db.commit()
    db.refresh(shift)
    return shift


@router.delete("/{shift_id}", status_code=204)
def delete_shift(shift_id: str, db: Session = Depends(get_db)):
    shift = db.query(Shift).filter(Shift.id == shift_id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Turno não encontrado")
    db.delete(shift)
    db.commit()
