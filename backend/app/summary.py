import datetime as dt

from app.models import Patient, PatientNote
from app.schemas import PatientSummary, calculate_age

MAX_NOTES_IN_NARRATIVE = 5
MAX_NOTE_CHARS = 240


def _fmt(d: dt.date | dt.datetime) -> str:
    return f"{d:%b} {d.day}, {d.year}"


def _clip(text: str, limit: int) -> str:
    text = " ".join(text.split())
    if len(text) <= limit:
        return text
    return text[:limit].rsplit(" ", 1)[0].rstrip(".,;:") + "…"


def _narrative(notes: list[PatientNote]) -> str:
    """`notes` is newest first."""
    if not notes:
        return "No clinical notes have been recorded for this patient."

    n = len(notes)
    span = (
        f"on {_fmt(notes[0].noted_at)}"
        if n == 1
        else f"between {_fmt(notes[-1].noted_at)} and {_fmt(notes[0].noted_at)}"
    )
    parts = [f"{n} clinical note{'s' if n != 1 else ''} recorded {span}."]

    recent = list(reversed(notes[:MAX_NOTES_IN_NARRATIVE]))  # oldest first reads as a story
    if n > len(recent):
        parts.append(f"The {len(recent)} most recent are summarized in order:")
    for note in recent:
        text = _clip(note.content, MAX_NOTE_CHARS)
        if text[-1] not in ".!?…":
            text += "."
        parts.append(f"On {_fmt(note.noted_at)}: {text}")
    return " ".join(parts)


def build_summary(patient: Patient, notes: list[PatientNote]) -> PatientSummary:
    return PatientSummary(
        patient_id=patient.id,
        first_name=patient.first_name,
        last_name=patient.last_name,
        age=calculate_age(patient.date_of_birth),
        blood_type=patient.blood_type.value,
        status=patient.status.value,
        conditions=patient.conditions,
        allergies=patient.allergies,
        last_visit=patient.last_visit,
        note_count=len(notes),
        narrative=_narrative(notes),
    )