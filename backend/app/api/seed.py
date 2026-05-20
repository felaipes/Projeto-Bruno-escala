import uuid as _uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Collaborator, Schedule, Assignment
from app.schemas.schemas import CollaboratorBase, ShiftBase, ScheduleRequest
from app.services.scheduling_service import SchedulingService

router = APIRouter(prefix="/api", tags=["seed"])

SEED_COLLABORATORS = [
    {"name": "Prof. Ana Martins",    "role": "graduado",         "block_saturday_1": False},
    {"name": "Prof. Carlos Souza",   "role": "graduado",         "block_saturday_1": True},
    {"name": "Prof. Fernanda Lima",  "role": "graduado",         "block_saturday_1": False},
    {"name": "Prof. Ricardo Alves",  "role": "graduado",         "block_saturday_1": True},
    {"name": "Prof. Beatriz Costa",  "role": "graduado",         "block_saturday_1": False},
    {"name": "Est. João Pedro",      "role": "estagiario",       "block_saturday_1": False},
    {"name": "Est. Maria Silva",     "role": "estagiario",       "block_saturday_1": True},
    {"name": "Est. Lucas Ferreira",  "role": "estagiario",       "block_saturday_1": False},
    {"name": "Est. Camila Santos",   "role": "estagiario",       "block_saturday_1": False},
    {"name": "Patrícia Gomes",       "role": "recepcao",         "block_saturday_1": False},
    {"name": "Rodrigo Nunes",        "role": "recepcao",         "block_saturday_1": True},
    {"name": "Antônio Pereira",      "role": "servicos_gerais",  "block_saturday_1": False},
    {"name": "Cláudia Rocha",        "role": "servicos_gerais",  "block_saturday_1": False},
]

SEED_SHIFTS = [
    {"name": "Segunda (Turno 1)", "start_time": "05:00", "required_graduados": 1, "required_estagiarios": 1, "required_recepcao": 1, "required_servicos_gerais": 0},
    {"name": "Segunda (Turno 2)", "start_time": "11:00", "required_graduados": 1, "required_estagiarios": 1, "required_recepcao": 0, "required_servicos_gerais": 1},
    {"name": "Segunda (Turno 3)", "start_time": "17:00", "required_graduados": 1, "required_estagiarios": 1, "required_recepcao": 0, "required_servicos_gerais": 0},
    {"name": "Terça (Turno 1)",   "start_time": "05:00", "required_graduados": 1, "required_estagiarios": 1, "required_recepcao": 1, "required_servicos_gerais": 0},
    {"name": "Terça (Turno 2)",   "start_time": "11:00", "required_graduados": 1, "required_estagiarios": 1, "required_recepcao": 0, "required_servicos_gerais": 1},
    {"name": "Terça (Turno 3)",   "start_time": "17:00", "required_graduados": 1, "required_estagiarios": 1, "required_recepcao": 0, "required_servicos_gerais": 0},
    {"name": "Quarta (Turno 1)",  "start_time": "05:00", "required_graduados": 1, "required_estagiarios": 1, "required_recepcao": 1, "required_servicos_gerais": 0},
    {"name": "Quarta (Turno 2)",  "start_time": "11:00", "required_graduados": 1, "required_estagiarios": 1, "required_recepcao": 0, "required_servicos_gerais": 1},
    {"name": "Quarta (Turno 3)",  "start_time": "17:00", "required_graduados": 1, "required_estagiarios": 1, "required_recepcao": 0, "required_servicos_gerais": 0},
    {"name": "Quinta (Turno 1)",  "start_time": "05:00", "required_graduados": 1, "required_estagiarios": 1, "required_recepcao": 1, "required_servicos_gerais": 0},
    {"name": "Quinta (Turno 2)",  "start_time": "11:00", "required_graduados": 1, "required_estagiarios": 1, "required_recepcao": 0, "required_servicos_gerais": 1},
    {"name": "Quinta (Turno 3)",  "start_time": "17:00", "required_graduados": 1, "required_estagiarios": 1, "required_recepcao": 0, "required_servicos_gerais": 0},
    {"name": "Sexta (Turno 1)",   "start_time": "05:00", "required_graduados": 1, "required_estagiarios": 1, "required_recepcao": 1, "required_servicos_gerais": 0},
    {"name": "Sexta (Turno 2)",   "start_time": "11:00", "required_graduados": 1, "required_estagiarios": 1, "required_recepcao": 0, "required_servicos_gerais": 1},
    {"name": "Sexta (Turno 3)",   "start_time": "17:00", "required_graduados": 1, "required_estagiarios": 1, "required_recepcao": 0, "required_servicos_gerais": 0},
    {"name": "Sábado (Turno 1)",  "start_time": "08:00", "required_graduados": 1, "required_estagiarios": 1, "required_recepcao": 1, "required_servicos_gerais": 0},
    {"name": "Sábado (Turno 2)",  "start_time": "11:00", "required_graduados": 1, "required_estagiarios": 1, "required_recepcao": 0, "required_servicos_gerais": 0},
    {"name": "Domingo",           "start_time": "08:00", "required_graduados": 1, "required_estagiarios": 1, "required_recepcao": 0, "required_servicos_gerais": 0},
]


@router.post("/seed")
def seed_database(db: Session = Depends(get_db)):
    db.query(Assignment).delete()
    db.query(Schedule).delete()
    db.query(Collaborator).delete()
    db.commit()

    collabs = []
    for c_data in SEED_COLLABORATORS:
        collab = Collaborator(id=str(_uuid.uuid4()), **c_data)
        db.add(collab)
        collabs.append(collab)
    db.commit()

    collab_bases = [
        CollaboratorBase(id=c.id, name=c.name, role=c.role, block_saturday_1=c.block_saturday_1)
        for c in collabs
    ]
    shift_bases = [ShiftBase(**s) for s in SEED_SHIFTS]

    result = SchedulingService(
        ScheduleRequest(collaborators=collab_bases, shifts=shift_bases, month=6, year=2026)
    ).generate()

    schedule = Schedule(id=str(_uuid.uuid4()), month=6, year=2026, access_token=str(_uuid.uuid4()))
    db.add(schedule)
    db.flush()

    for a in result.assignments:
        db.add(Assignment(
            id=str(_uuid.uuid4()), schedule_id=schedule.id,
            collaborator_id=a.collaborator_id, collaborator_name=a.collaborator_name,
            shift_id=a.shift_id, shift_name=a.shift_name,
            date=a.date, start_time=a.start_time, end_time=a.end_time,
        ))
    db.commit()

    return {
        "message": "Banco populado com sucesso!",
        "collaborators": len(collabs),
        "assignments": len(result.assignments),
        "schedule_id": schedule.id,
        "access_token": schedule.access_token,
    }
