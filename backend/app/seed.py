import datetime as dt

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import BloodType, Patient, PatientNote, PatientStatus

FIELDS = (
    "first_name", "last_name", "dob", "email", "phone", "address_line1",
    "city", "state", "postal_code", "blood", "allergies", "conditions", "status", "last_visit",
)

ROWS = [
    ("Maria", "Gonzalez", "1958-03-14", "maria.gonzalez@example.com", "(787) 555-0101", "214 Calle Luna", "San Juan", "PR", "00901", "A+", ["Penicillin"], ["Type 2 diabetes", "Hypertension"], "active", "2026-09-22"),
    ("James", "Whitaker", "1971-11-02", "james.whitaker@example.com", "(212) 555-0102", "88 Maple Ave", "Brooklyn", "NY", "11201", "O+", [], ["Asthma"], "active", "2026-10-01"),
    ("Aisha", "Rahman", "1989-07-21", "aisha.rahman@example.com", "(312) 555-0103", "1450 N Lake Shore Dr", "Chicago", "IL", "60610", "B+", ["Latex", "Shellfish"], ["Migraine"], "active", "2026-09-30"),
    ("Robert", "Chen", "1949-01-30", "robert.chen@example.com", "(415) 555-0104", "730 Pine St", "San Francisco", "CA", "94108", "AB-", ["Sulfa drugs"], ["Atrial fibrillation", "Chronic kidney disease stage 3"], "active", "2026-09-15"),
    ("Linda", "Kowalski", "1966-05-09", "linda.kowalski@example.com", "(617) 555-0105", "52 Beacon St", "Boston", "MA", "02108", "A-", [], ["Hypothyroidism"], "active", "2026-08-27"),
    ("Carlos", "Ramirez", "1994-12-17", "carlos.ramirez@example.com", "(305) 555-0106", "901 Brickell Ave", "Miami", "FL", "33131", "O-", ["Ibuprofen"], [], "active", "2026-10-05"),
    ("Priya", "Patel", "1982-09-03", "priya.patel@example.com", "(713) 555-0107", "3300 Main St", "Houston", "TX", "77002", "B-", [], ["Gestational diabetes (resolved)"], "inactive", "2026-03-12"),
    ("Thomas", "Okafor", "1955-06-25", "thomas.okafor@example.com", "(404) 555-0108", "19 Peachtree Pl", "Atlanta", "GA", "30309", "O+", ["Aspirin"], ["Coronary artery disease", "Hyperlipidemia"], "active", "2026-09-08"),
    ("Emily", "Nguyen", "2001-02-11", "emily.nguyen@example.com", "(206) 555-0109", "415 Pike St", "Seattle", "WA", "98101", "A+", ["Peanuts"], ["Anxiety disorder"], "active", "2026-09-18"),
    ("David", "Sullivan", "1943-10-28", "david.sullivan@example.com", "(602) 555-0110", "77 E Roosevelt St", "Phoenix", "AZ", "85004", "AB+", ["Codeine", "Iodine contrast"], ["COPD", "Heart failure"], "active", "2026-10-03"),
    ("Sofia", "Martinez", "1976-04-06", "sofia.martinez@example.com", "(787) 555-0111", "9 Ave Ponce de Leon", "San Juan", "PR", "00907", "O+", [], ["Rheumatoid arthritis"], "active", "2026-09-02"),
    ("Michael", "Brooks", "1963-08-19", "michael.brooks@example.com", "(303) 555-0112", "1200 17th St", "Denver", "CO", "80202", "A+", [], ["Sleep apnea", "Obesity"], "inactive", "2025-11-20"),
    ("Hannah", "Lindqvist", "1992-01-23", "hannah.lindqvist@example.com", "(612) 555-0113", "640 Nicollet Mall", "Minneapolis", "MN", "55402", "B+", ["Amoxicillin"], [], "discharged", "2026-06-14"),
    ("Omar", "Haddad", "1980-03-31", "omar.haddad@example.com", "(313) 555-0114", "2100 Woodward Ave", "Detroit", "MI", "48201", "O-", [], ["Type 1 diabetes"], "active", "2026-09-25"),
    ("Grace", "Thompson", "1938-12-05", "grace.thompson@example.com", "(215) 555-0115", "31 Walnut St", "Philadelphia", "PA", "19106", "A-", ["Warfarin"], ["Osteoporosis", "Mild cognitive impairment"], "active", "2026-10-06"),
    ("Daniel", "Kim", "1987-07-14", "daniel.kim@example.com", "(213) 555-0116", "555 S Flower St", "Los Angeles", "CA", "90071", "AB+", [], ["Crohn's disease"], "active", "2026-08-19"),
    ("Valerie", "Dupont", "1973-02-27", "valerie.dupont@example.com", "(504) 555-0117", "812 Royal St", "New Orleans", "LA", "70116", "B+", ["Sulfa drugs", "Bee stings"], ["Fibromyalgia"], "active", "2026-09-11"),
    ("Anthony", "Russo", "1960-09-09", "anthony.russo@example.com", "(718) 555-0118", "145 Court St", "Brooklyn", "NY", "11201", "O+", [], ["Hypertension", "Gout"], "inactive", "2026-01-30"),
    ("Naomi", "Washington", "1998-05-18", "naomi.washington@example.com", "(202) 555-0119", "1600 U St NW", "Washington", "DC", "20009", "A+", ["Tree nuts"], ["Iron-deficiency anemia"], "active", "2026-09-29"),
    ("Luis", "Torres", "1985-11-12", "luis.torres@example.com", "(787) 555-0120", "47 Calle Cruz", "Ponce", "PR", "00730", "O+", [], [], "discharged", "2026-07-07"),
]


def seed(db: Session) -> None:
    if db.scalar(select(func.count(Patient.id))):
        return  # idempotent: only seed an empty table
    for row in ROWS:
        d = dict(zip(FIELDS, row, strict=True))
        db.add(
            Patient(
                first_name=d["first_name"],
                last_name=d["last_name"],
                date_of_birth=dt.date.fromisoformat(d["dob"]),
                email=d["email"],
                phone=d["phone"],
                address_line1=d["address_line1"],
                city=d["city"],
                state=d["state"],
                postal_code=d["postal_code"],
                blood_type=BloodType(d["blood"]),
                allergies=d["allergies"],
                conditions=d["conditions"],
                status=PatientStatus(d["status"]),
                last_visit=dt.date.fromisoformat(d["last_visit"]),
            )
        )
    db.commit()


# email -> [(days_ago, text)]. Patients not listed get no notes, so the empty state is testable.
NOTES_BY_EMAIL = {
    "maria.gonzalez@example.com": [
        (120, "Quarterly diabetes review. Diet adjustments discussed. Blood pressure borderline."),
        (60, "Blood pressure rechecked after medication adjustment. Reports good adherence."),
        (14, "Routine follow-up. Glucose log reviewed, no hypoglycemic episodes. Foot exam normal."),
    ],
    "james.whitaker@example.com": [
        (90, "Asthma control assessment. Occasional nighttime symptoms. Inhaler technique reviewed."),
        (21, "Follow-up. Symptoms improved on current regimen. Peak flow within expected range."),
    ],
    "robert.chen@example.com": [
        (75, "Atrial fibrillation follow-up. Heart rate controlled. Renal function stable."),
        (20, "Nephrology labs reviewed. Kidney function unchanged from prior. Sodium and fluid guidance given."),
    ],
    "carlos.ramirez@example.com": [
        (5, "Annual physical. No acute concerns. Ibuprofen intolerance on file; acetaminophen advised for pain."),
    ],
    "david.sullivan@example.com": [
        (30, "COPD exacerbation visit. Treated, symptoms resolved. Pulmonary rehab discussed."),
        (6, "Post-exacerbation follow-up. Oxygen saturation stable at rest. Heart failure symptoms unchanged."),
    ],
}


def seed_notes(db: Session) -> None:
    if db.scalar(select(func.count(PatientNote.id))):
        return  # idempotent: only seed when there are no notes
    now = dt.datetime.now(dt.timezone.utc)
    ids_by_email = {p.email: p.id for p in db.scalars(select(Patient))}
    for email, notes in NOTES_BY_EMAIL.items():
        patient_id = ids_by_email.get(email)
        if patient_id is None:
            continue
        for days_ago, text in notes:
            db.add(
                PatientNote(
                    patient_id=patient_id,
                    content=text,
                    noted_at=now - dt.timedelta(days=days_ago),
                )
            )
    db.commit()