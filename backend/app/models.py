from pydantic import BaseModel
from typing import List, Dict
from datetime import time

class Collaborator(BaseModel):
    id: str
    name: str
    role: str  # 'graduado', 'estagiario', 'recepcao', 'servicos_gerais'
    block_saturday_1: bool = False
    estagiario_mode: str = 'abre'  # 'abre' ou 'fecha'

class Shift(BaseModel):
    id: str
    name: str # 'Sábado 1', 'Sábado 2', 'Domingo'
    start_time: time
    required_graduados: int = 0
    required_estagiarios: int = 0
    required_recepcao: int = 0
    required_servicos_gerais: int = 0

class ScheduleRequest(BaseModel):
    collaborators: List[Collaborator]
    shifts: List[Shift]

class ShiftAssignment(BaseModel):
    shift_id: str
    collaborator_id: str
    date: str
    start_time: time
    end_time: time

class ScheduleResult(BaseModel):
    assignments: List[ShiftAssignment]
    unfilled_shifts: List[dict]
    shift_counts: Dict[str, int]
