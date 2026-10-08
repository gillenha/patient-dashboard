import datetime as dt
import enum

from sqlalchemy import CheckConstraint, Date, DateTime, Enum, String, Text, func, text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class PatientStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    DISCHARGED = "discharged"


class BloodType(str, enum.Enum):
    A_POS = "A+"
    A_NEG = "A-"
    B_POS = "B+"
    B_NEG = "B-"
    AB_POS = "AB+"
    AB_NEG = "AB-"
    O_POS = "O+"
    O_NEG = "O-"


def _values(e: type[enum.Enum]) -> list[str]:
    return [m.value for m in e]


class Patient(Base):
    __tablename__ = "patients"
    __table_args__ = (
        CheckConstraint(
            "blood_type IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')",
            name="ck_patients_blood_type",
        ),
        CheckConstraint(
            "status IN ('active','inactive','discharged')",
            name="ck_patients_status",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    first_name: Mapped[str] = mapped_column(String(100))
    last_name: Mapped[str] = mapped_column(String(100), index=True)
    date_of_birth: Mapped[dt.date] = mapped_column(Date)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    phone: Mapped[str] = mapped_column(String(32))
    address_line1: Mapped[str] = mapped_column(String(255))
    city: Mapped[str] = mapped_column(String(100))
    state: Mapped[str] = mapped_column(String(2))
    postal_code: Mapped[str] = mapped_column(String(10))
    blood_type: Mapped[BloodType] = mapped_column(
        Enum(
            BloodType,
            native_enum=False,
            length=3,
            create_constraint=False,
            values_callable=_values,
        )
    )
    allergies: Mapped[list[str]] = mapped_column(
        ARRAY(Text), default=list, server_default=text("'{}'")
    )
    conditions: Mapped[list[str]] = mapped_column(
        ARRAY(Text), default=list, server_default=text("'{}'")
    )
    status: Mapped[PatientStatus] = mapped_column(
        Enum(
            PatientStatus,
            native_enum=False,
            length=16,
            create_constraint=False,
            values_callable=_values,
        ),
        default=PatientStatus.ACTIVE,
        index=True,
    )
    last_visit: Mapped[dt.date | None] = mapped_column(Date, index=True)
    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[dt.datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )