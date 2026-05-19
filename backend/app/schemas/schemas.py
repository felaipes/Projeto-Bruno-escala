from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime
import uuid as _uuid


# ── Collaborator ─────────────────────────────────────────────────────────────

class CollaboratorBase(BaseModel):
    id: str = Field(default_factory=lambda: str(_uuid.uuid4()))
    name: str
    role: str
    block_saturday_1: bool = False


class CollaboratorCreate(BaseModel):
    name: str
    role: str
    block_saturday_1: bool = False


class CollaboratorResponse(BaseModel):
    id: str
    name: str
    role: str
    block_saturday_1: bool
    created_at: datetime
    model_config = {"from_attributes": True}


# ── Shift ─────────────────────────────────────────────────────────────────────

class ShiftBase(BaseModel):
    id: str = Field(default_factory=lambda: str(_uuid.uuid4()))
    name: str
    start_time: str
    required_graduados: int = 0
    required_estagiarios: int = 0
    required_recepcao: int = 0
    required_servicos_gerais: int = 0


class ShiftCreate(BaseModel):
    name: str
    start_time: str
    required_graduados: int = 0
    required_estagiarios: int = 0
    required_recepcao: int = 0
    required_servicos_gerais: int = 0


class ShiftResponse(BaseModel):
    id: str
    name: str
    start_time: str
    required_graduados: int
    required_estagiarios: int
    required_recepcao: int
    required_servicos_gerais: int
    created_at: datetime
    model_config = {"from_attributes": True}


# ── Schedule / Generation ─────────────────────────────────────────────────────

class ScheduleRequest(BaseModel):
    collaborators: List[CollaboratorBase]
    shifts: List[ShiftBase]
    month: Optional[int] = None
    year: Optional[int] = None


class ShiftAssignment(BaseModel):
    id: str = ""
    shift_id: str
    shift_name: str
    collaborator_id: str
    collaborator_name: str
    date: str
    start_time: str
    end_time: str


class ScheduleResult(BaseModel):
    assignments: List[ShiftAssignment]
    unfilled_shifts: List[dict]
    shift_counts: Dict[str, int]
    month: Optional[int] = None
    year: Optional[int] = None


# ── Saved Schedules ───────────────────────────────────────────────────────────

class ScheduleListItem(BaseModel):
    id: str
    month: int
    year: int
    access_token: str
    created_at: datetime
    assignments_count: int = 0


class FullScheduleResponse(BaseModel):
    id: str
    month: int
    year: int
    access_token: str
    assignments: List[ShiftAssignment]


class ManualScheduleCreate(BaseModel):
    month: int
    year: int


class AssignmentCreate(BaseModel):
    collaborator_id: str
    collaborator_name: str
    shift_id: str
    shift_name: str
    date: str
    start_time: str
    end_time: str


class AssignmentResponse(BaseModel):
    id: str
    schedule_id: str
    collaborator_id: str
    collaborator_name: str
    shift_id: str
    shift_name: str
    date: str
    start_time: str
    end_time: str
    model_config = {"from_attributes": True}


# ── Public access ─────────────────────────────────────────────────────────────

class SaveScheduleResponse(BaseModel):
    id: str
    access_token: str


class PublicScheduleResponse(BaseModel):
    id: str
    month: int
    year: int
    assignments: List[ShiftAssignment]
