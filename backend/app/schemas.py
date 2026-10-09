import datetime as dt
from typing import Annotated

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    StringConstraints,
    ValidationInfo,
    computed_field,
    field_validator,
)

from app.models import BloodType, PatientStatus

MIN_DOB = dt.date(1900, 1, 1)

Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
Label = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]
Address = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=255)]
State = Annotated[
    str, StringConstraints(strip_whitespace=True, to_upper=True, pattern=r"^[A-Za-z]{2}$")
]
PostalCode = Annotated[
    str, StringConstraints(strip_whitespace=True, pattern=r"^\d{5}(-\d{4})?$")
]
Phone = Annotated[
    str, StringConstraints(strip_whitespace=True, pattern=r"^[0-9+()\-.\s]{7,32}$")
]


def calculate_age(dob: dt.date, today: dt.date | None = None) -> int:
    today = today or dt.date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


class PatientCreate(BaseModel):
    """Request body for POST and PUT (PUT is a full replace)."""

    model_config = ConfigDict(extra="forbid")

    first_name: Name
    last_name: Name
    date_of_birth: dt.date
    email: EmailStr
    phone: Phone
    address_line1: Address
    city: Name
    state: State
    postal_code: PostalCode
    blood_type: BloodType
    allergies: list[Label] = Field(default_factory=list, max_length=50)
    conditions: list[Label] = Field(default_factory=list, max_length=50)
    status: PatientStatus = PatientStatus.ACTIVE
    last_visit: dt.date | None = None

    @field_validator("email")
    @classmethod
    def _lower_email(cls, v: str) -> str:
        return v.lower()

    @field_validator("allergies", "conditions")
    @classmethod
    def _dedupe(cls, v: list[str]) -> list[str]:
        seen: dict[str, str] = {}
        for item in v:
            seen.setdefault(item.casefold(), item)
        return list(seen.values())

    @field_validator("date_of_birth")
    @classmethod
    def _dob_range(cls, v: dt.date) -> dt.date:
        if v > dt.date.today():
            raise ValueError("Date of birth cannot be in the future")
        if v < MIN_DOB:
            raise ValueError("Date of birth is too far in the past")
        return v

    @field_validator("last_visit")
    @classmethod
    def _last_visit_range(cls, v: dt.date | None, info: ValidationInfo) -> dt.date | None:
        if v is None:
            return v
        if v > dt.date.today():
            raise ValueError("Last visit cannot be in the future")
        dob = info.data.get("date_of_birth")
        if dob is not None and v < dob:
            raise ValueError("Last visit cannot be before date of birth")
        return v


class _WithAge(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    date_of_birth: dt.date

    @computed_field
    @property
    def age(self) -> int:
        return calculate_age(self.date_of_birth)


class PatientListItem(_WithAge):
    id: int
    first_name: str
    last_name: str
    email: str
    status: PatientStatus
    last_visit: dt.date | None


class PatientRead(_WithAge):
    id: int
    first_name: str
    last_name: str
    email: str
    phone: str
    address_line1: str
    city: str
    state: str
    postal_code: str
    blood_type: BloodType
    allergies: list[str]
    conditions: list[str]
    status: PatientStatus
    last_visit: dt.date | None
    created_at: dt.datetime
    updated_at: dt.datetime


class PatientPage(BaseModel):
    items: list[PatientListItem]
    total: int
    page: int
    page_size: int
    pages: int