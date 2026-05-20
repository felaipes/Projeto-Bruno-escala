import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Integer, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


def _uuid():
    return str(uuid.uuid4())


class Collaborator(Base):
    __tablename__ = "collaborators"

    id = Column(String, primary_key=True, default=_uuid)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # graduado | estagiario | recepcao | servicos_gerais
    block_saturday_1 = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class Shift(Base):
    __tablename__ = "shifts"

    id = Column(String, primary_key=True, default=_uuid)
    name = Column(String, nullable=False)
    start_time = Column(String, nullable=False)  # "HH:MM"
    required_graduados = Column(Integer, default=0)
    required_estagiarios = Column(Integer, default=0)
    required_recepcao = Column(Integer, default=0)
    required_servicos_gerais = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)


class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(String, primary_key=True, default=_uuid)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    access_token = Column(String, unique=True, default=_uuid)
    created_at = Column(DateTime, default=datetime.utcnow)

    assignments = relationship("Assignment", back_populates="schedule", cascade="all, delete-orphan")


class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(String, primary_key=True, default=_uuid)
    schedule_id = Column(String, ForeignKey("schedules.id"), nullable=False)
    collaborator_id = Column(String, nullable=False)
    collaborator_name = Column(String, nullable=False)
    shift_id = Column(String, nullable=False)
    shift_name = Column(String, nullable=False)
    date = Column(String, nullable=False)   # "YYYY-MM-DD"
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)

    schedule = relationship("Schedule", back_populates="assignments")
