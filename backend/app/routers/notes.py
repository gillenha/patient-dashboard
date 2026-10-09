import datetime as dt
from typing import Annotated

from fastapi import APIRouter, HTTPException, Path, status
from sqlalchemy import select

from app.models import Patient, PatientNote
from app.routers.patients import DbDep, PatientId
from app.schemas import NoteCreate, NoteRead

router = APIRouter(prefix="/patients/{patient_id}/notes", tags=["notes"])

NoteId = Annotated[int, Path(ge=1, le=2_147_483_647)]


def _require_patient(db: DbDep, patient_id: int) -> None:
    if db.get(Patient, patient_id) is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Patient not found")


@router.get("", response_model=list[NoteRead])
def list_notes(patient_id: PatientId, db: DbDep) -> list[PatientNote]:
    _require_patient(db, patient_id)
    return list(
        db.scalars(
            select(PatientNote)
            .where(PatientNote.patient_id == patient_id)
            .order_by(PatientNote.noted_at.desc(), PatientNote.id.desc())
        )
    )


@router.post("", response_model=NoteRead, status_code=status.HTTP_201_CREATED)
def create_note(patient_id: PatientId, payload: NoteCreate, db: DbDep) -> PatientNote:
    _require_patient(db, patient_id)
    note = PatientNote(
        patient_id=patient_id,
        content=payload.content,
        noted_at=payload.noted_at or dt.datetime.now(dt.timezone.utc),
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.delete("/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_note(patient_id: PatientId, note_id: NoteId, db: DbDep) -> None:
    # Scoped to the patient so /patients/1/notes/<note of patient 2> is a 404.
    note = db.scalar(
        select(PatientNote).where(PatientNote.id == note_id, PatientNote.patient_id == patient_id)
    )
    if note is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Note not found")
    db.delete(note)
    db.commit()