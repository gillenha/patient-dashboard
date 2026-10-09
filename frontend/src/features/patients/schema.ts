import { z } from "zod"

import { todayIso } from "@/lib/format"

import { BLOOD_TYPES, PATIENT_STATUSES } from "./types"
import type { Patient, PatientInput } from "./types"

/**
 * Mirrors `PatientCreate` in backend/app/schemas.py so invalid input is caught
 * before a round trip. The server still validates everything and remains the
 * source of truth; see serverErrors.ts for how its errors come back to the form.
 */

const MIN_DATE_OF_BIRTH = "1900-01-01"
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const PHONE = /^[0-9+()\-.\s]{7,32}$/
const POSTAL_CODE = /^\d{5}(-\d{4})?$/

export const MAX_TAGS = 50
export const MAX_TAG_LENGTH = 100

function requiredText(label: string, max: number) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be ${max} characters or fewer`)
}

/** Date-only fields stay strings end to end: `new Date("YYYY-MM-DD")` parses as UTC and can shift the day. */
function isoDate(label: string) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .regex(ISO_DATE, `Enter ${label.toLowerCase()} as YYYY-MM-DD`)
}

/** Keeps the first spelling of each entry, matching the server's case-insensitive dedupe. */
function dedupe(items: string[]): string[] {
  const seen = new Map<string, string>()
  for (const item of items) {
    const key = item.toLowerCase()
    if (!seen.has(key)) seen.set(key, item)
  }
  return [...seen.values()]
}

function tagList(label: string) {
  return z
    .array(
      z
        .string()
        .trim()
        .min(1, `${label} cannot be blank`)
        .max(MAX_TAG_LENGTH, `Each entry must be ${MAX_TAG_LENGTH} characters or fewer`),
    )
    .max(MAX_TAGS, `Add at most ${MAX_TAGS} ${label.toLowerCase()}`)
    .overwrite(dedupe)
}

export const patientFormSchema = z
  .object({
    first_name: requiredText("First name", 100),
    last_name: requiredText("Last name", 100),
    date_of_birth: isoDate("Date of birth")
      .refine((v) => !ISO_DATE.test(v) || v <= todayIso(), "Date of birth cannot be in the future")
      .refine(
        (v) => !ISO_DATE.test(v) || v >= MIN_DATE_OF_BIRTH,
        "Date of birth must be on or after January 1, 1900",
      ),
    email: z
      .string()
      .trim()
      .min(1, "Email is required")
      .max(255, "Email must be 255 characters or fewer")
      .pipe(z.email("Enter a valid email address")),
    phone: z
      .string()
      .trim()
      .min(1, "Phone number is required")
      .regex(PHONE, "Enter a phone number like (555) 123-4567"),
    address_line1: requiredText("Street address", 255),
    city: requiredText("City", 100),
    state: z
      .string()
      .trim()
      .min(1, "State is required")
      .regex(/^[A-Za-z]{2}$/, "Use the 2-letter state code, like CA"),
    postal_code: z
      .string()
      .trim()
      .min(1, "ZIP code is required")
      .regex(POSTAL_CODE, "Use a 5-digit ZIP, or ZIP+4 like 00901-1234"),
    // The select starts empty, so membership is checked after the "pick one" message.
    blood_type: z
      .string()
      .min(1, "Select a blood type")
      .pipe(z.enum(BLOOD_TYPES, "Select a blood type")),
    status: z.enum(PATIENT_STATUSES, "Select a status"),
    allergies: tagList("Allergies"),
    conditions: tagList("Conditions"),
    last_visit: z
      .string()
      .trim()
      .refine((v) => v === "" || ISO_DATE.test(v), "Enter the last visit as YYYY-MM-DD")
      .refine((v) => v === "" || v <= todayIso(), "Last visit cannot be in the future"),
  })
  .superRefine((values, ctx) => {
    const { last_visit, date_of_birth } = values
    if (!ISO_DATE.test(last_visit) || !ISO_DATE.test(date_of_birth)) return
    if (last_visit < date_of_birth) {
      ctx.addIssue({
        code: "custom",
        path: ["last_visit"],
        message: "Last visit cannot be before the date of birth",
      })
    }
  })

/** What the inputs hold: every field is a string (or string[]) the user can type into. */
export type PatientFormValues = z.input<typeof patientFormSchema>
/** What a successful parse yields: trimmed, deduped and narrowed to the API's unions. */
export type PatientFormOutput = z.output<typeof patientFormSchema>
export type PatientFormField = keyof PatientFormValues

export function isPatientFormField(name: string): name is PatientFormField {
  return Object.hasOwn(patientFormSchema.shape, name)
}

/**
 * Validated form values -> request body. Sends exactly the fields `PatientCreate`
 * accepts: it is `extra="forbid"`, and PUT is a full replace, so server-owned
 * fields (id, age, created_at, updated_at) must never be included.
 * Strings arrive trimmed and tag lists deduped from the schema.
 */
export function toPatientInput(values: PatientFormOutput): PatientInput {
  return {
    first_name: values.first_name,
    last_name: values.last_name,
    date_of_birth: values.date_of_birth,
    email: values.email,
    phone: values.phone,
    address_line1: values.address_line1,
    city: values.city,
    state: values.state.toUpperCase(),
    postal_code: values.postal_code,
    blood_type: values.blood_type,
    allergies: values.allergies,
    conditions: values.conditions,
    status: values.status,
    last_visit: values.last_visit === "" ? null : values.last_visit,
  }
}

export function emptyPatientFormValues(): PatientFormValues {
  return {
    first_name: "",
    last_name: "",
    date_of_birth: "",
    email: "",
    phone: "",
    address_line1: "",
    city: "",
    state: "",
    postal_code: "",
    blood_type: "",
    status: "active",
    allergies: [],
    conditions: [],
    last_visit: "",
  }
}

/** An existing patient -> form values, dropping the server-owned fields. */
export function patientToFormValues(patient: Patient): PatientFormValues {
  return {
    first_name: patient.first_name,
    last_name: patient.last_name,
    date_of_birth: patient.date_of_birth,
    email: patient.email,
    phone: patient.phone,
    address_line1: patient.address_line1,
    city: patient.city,
    postal_code: patient.postal_code,
    state: patient.state,
    blood_type: patient.blood_type,
    status: patient.status,
    allergies: patient.allergies,
    conditions: patient.conditions,
    last_visit: patient.last_visit ?? "",
  }
}
