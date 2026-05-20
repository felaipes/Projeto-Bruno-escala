import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.models import Collaborator
from app.schemas.schemas import CollaboratorCreate, CollaboratorResponse

router = APIRouter(prefix="/api/collaborators", tags=["collaborators"])


@router.get("/", response_model=List[CollaboratorResponse])
def list_collaborators(db: Session = Depends(get_db)):
    return db.query(Collaborator).order_by(Collaborator.created_at).all()


@router.post("/", response_model=CollaboratorResponse, status_code=201)
def create_collaborator(data: CollaboratorCreate, db: Session = Depends(get_db)):
    collab = Collaborator(id=str(uuid.uuid4()), **data.model_dump())
    db.add(collab)
    db.commit()
    db.refresh(collab)
    return collab


@router.put("/{collab_id}", response_model=CollaboratorResponse)
def update_collaborator(collab_id: str, data: CollaboratorCreate, db: Session = Depends(get_db)):
    collab = db.query(Collaborator).filter(Collaborator.id == collab_id).first()
    if not collab:
        raise HTTPException(status_code=404, detail="Colaborador não encontrado")
    for key, value in data.model_dump().items():
        setattr(collab, key, value)
    db.commit()
    db.refresh(collab)
    return collab


@router.delete("/{collab_id}", status_code=204)
def delete_collaborator(collab_id: str, db: Session = Depends(get_db)):
    collab = db.query(Collaborator).filter(Collaborator.id == collab_id).first()
    if not collab:
        raise HTTPException(status_code=404, detail="Colaborador não encontrado")
    db.delete(collab)
    db.commit()
