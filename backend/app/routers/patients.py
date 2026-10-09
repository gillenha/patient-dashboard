import datetime as dt
import math
from enum import Enum
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import Patient, PatientNote, PatientStatus
from app.schemas import (
    PatientCreate,
    PatientListItem,
    PatientPage,
    PatientRead,
    PatientStats,
    PatientSummary,
)
from app.summary import build_summary

router = APIRouter(prefix="/patients", tags=["patients"])

DbDep = Annotated[Session, Depends(get_db)]
PatientId = Annotated[int, Path(ge=1, le=2_147_483_647)]


class SortField(str, Enum):
    last_name = "last_name"
    first_name = "first_name"
    age = "age"
    last_visit = "last_visit"
    status = "status"
    created_at = "created_at"


class SortOrder(str, Enum):
    asc = "asc"
    desc = "desc"


SORT_COLUMNS = {
    SortField.last_name: Patient.last_name,
    SortField.first_name: Patient.first_name,
    SortField.age: Patient.date_of_birth,  # direction inverted below
    SortField.last_visit: Patient.last_visit,
    SortField.status: Patient.status,
    SortField.created_at: Patient.created_at,
}


def _get_or_404(db: Session, patient_id: int) -> Patient:
    patient = db.get(Patient, patient_id)
    if patient is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Patient not found")
    return patient


def _commit(db: Session) -> None:
    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        diag = getattr(e.orig, "diag", None)
        if getattr(diag, "constraint_name", None) == "patients_email_key":
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                detail=[
                    {
                        "loc": ["body", "email"],
                        "msg": "A patient with this email already exists",
                        "type": "conflict",
                    }
                ],
            ) from e
        raise


@router.get("", response_model=PatientPage)
def list_patients(
    db: DbDep,
    q: Annotated[str | None, Query(max_length=100)] = None,
    status_filter: Annotated[PatientStatus | None, Query(alias="status")] = None,
    sort_by: SortField = SortField.last_name,
    order: SortOrder = SortOrder.asc,
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
) -> PatientPage:
    conditions = []
    if status_filter is not None:
        conditions.append(Patient.status == status_filter)
    for token in (q or "").split()[:5]:
        conditions.append(
            or_(
                Patient.first_name.icontains(token, autoescape=True),
                Patient.last_name.icontains(token, autoescape=True),
                Patient.email.icontains(token, autoescape=True),
            )
        )

    total = db.scalar(select(func.count(Patient.id)).where(*conditions)) or 0

    # Ascending age means descending date_of_birth, so XOR the direction.
    descending = (order is SortOrder.desc) != (sort_by is SortField.age)
    column = SORT_COLUMNS[sort_by]
    primary = column.desc() if descending else column.asc()

    rows = db.scalars(
        select(Patient)
        .where(*conditions)
        .order_by(primary.nulls_last(), Patient.last_name, Patient.first_name, Patient.id)
        .limit(page_size)
        .offset((page - 1) * page_size)
    ).all()

    return PatientPage(
        items=[PatientListItem.model_validate(r) for r in rows],
        total=total,
        page=page,
        page_size=page_size,
        pages=math.ceil(total / page_size),
    )


@router.get("/stats", response_model=PatientStats)
def patient_stats(db: DbDep) -> PatientStats:
    counts = {s: 0 for s in PatientStatus}  # zero-fill so every status is always present
    for status_, n in db.execute(
        select(Patient.status, func.count()).group_by(Patient.status)
    ).all():
        counts[status_] = n

    cutoff = dt.date.today() - dt.timedelta(days=30)
    recent = db.scalar(
        select(func.count()).select_from(Patient).where(Patient.last_visit >= cutoff)
    )
    avg_age = db.scalar(select(func.avg(func.extract("year", func.age(Patient.date_of_birth)))))

    return PatientStats(
        total=sum(counts.values()),
        by_status=counts,
        seen_last_30_days=recent or 0,
        average_age=round(float(avg_age), 1) if avg_age is not None else None,
    )


@router.get("/{patient_id}", response_model=PatientRead)
def get_patient(patient_id: PatientId, db: DbDep) -> Patient:
    return _get_or_404(db, patient_id)


@router.get("/{patient_id}/summary", response_model=PatientSummary)
def get_patient_summary(patient_id: PatientId, db: DbDep) -> PatientSummary:
    patient = _get_or_404(db, patient_id)
    notes = db.scalars(
        select(PatientNote)
        .where(PatientNote.patient_id == patient_id)
        .order_by(PatientNote.noted_at.desc(), PatientNote.id.desc())
    ).all()
    return build_summary(patient, list(notes))


@router.post("", response_model=PatientRead, status_code=status.HTTP_201_CREATED)
def create_patient(payload: PatientCreate, db: DbDep) -> Patient:
    patient = Patient(**payload.model_dump())
    db.add(patient)
    _commit(db)
    db.refresh(patient)
    return patient


@router.put("/{patient_id}", response_model=PatientRead)
def update_patient(patient_id: PatientId, payload: PatientCreate, db: DbDep) -> Patient:
    patient = _get_or_404(db, patient_id)
    for field, value in payload.model_dump().items():
        setattr(patient, field, value)
    _commit(db)
    db.refresh(patient)
    return patient


@router.delete("/{patient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_patient(patient_id: PatientId, db: DbDep) -> None:
    patient = _get_or_404(db, patient_id)
    db.delete(patient)
    db.commit()