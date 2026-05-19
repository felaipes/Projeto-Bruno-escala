from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime


# ── Collaborator ────────────────────────────────────────────────────────────

class CollaboratorBase(BaseModel):
    name: str
    role: str
    block_saturday_1: bool = False


class CollaboratorCreate(CollaboratorBase):
    pass


class CollaboratorResponse(CollaboratorBase):
    id: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Shift ────────────────────────────────────────────────────────────────────

class ShiftBase(BaseModel):
    name: str
    start_time: str
    required_graduados: int = 0
    required_estagiarios: int = 0
    required_recepcao: int = 0
    required_servicos_gerais: int = 0


class ShiftCreate(ShiftBase):
    pass


class ShiftResponse(ShiftBase):
    id: str
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Schedule / Generation ────────────────────────────────────────────────────

class ScheduleRequest(BaseModel):
    collaborators: List[CollaboratorBase]
    shifts: List[ShiftBase]
    month: Optional[int] = None
    year: Optional[int] = None


class ShiftAssignment(BaseModel):
    shift_id: str
    shift_name: str
    collaborator_id: str
    collaborator_name: str
    date: str        # "YYYY-MM-DD" or weekday label for stateless use
    start_time: str
    end_time: str


class ScheduleResult(BaseModel):
    assignments: List[ShiftAssignment]
    unfilled_shifts: List[dict]
    shift_counts: Dict[str, int]
    month: Optional[int] = None
    year: Optional[int] = None


# ── Public / Professional access ─────────────────────────────────────────────

class SaveScheduleResponse(BaseModel):
    id: str
    access_token: str


class PublicScheduleResponse(BaseModel):
    id: str
    month: int
    year: int
    assignments: List[ShiftAssignment]
