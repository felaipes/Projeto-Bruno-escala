from pydantic import BaseModel
from typing import List, Dict

class Collaborator(BaseModel):
    id: str
    name: str
    role: str  # 'graduado', 'estagiario', 'recepcao', 'servicos_gerais'
    block_saturday_1: bool = False
    start_time: str
    end_time: str

class ScheduleRequest(BaseModel):
    collaborators: List[Collaborator]
    selected_days: List[str]

class ShiftAssignment(BaseModel):
    shift_id: str
    collaborator_id: str
    date: str
    start_time: str
    end_time: str

class ScheduleResult(BaseModel):
    assignments: List[ShiftAssignment]
    unfilled_shifts: List[dict]
    shift_counts: Dict[str, int]
