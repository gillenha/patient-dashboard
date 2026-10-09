import type { UseFormReturn } from "react-hook-form"

import { ApiError } from "@/lib/api"
import type { FieldError } from "@/lib/api"

import { isPatientFormField, type PatientFormField } from "./schema"
import type { PatientFormOutput, PatientFormValues } from "./schema"

type FormHandle = Pick<
  UseFormReturn<PatientFormValues, unknown, PatientFormOutput>,
  "setError" | "setFocus"
>

/**
 * Field name for a server error location: the first string after "body", so
 * ["body", "email"] and ["body", "allergies", 3] both map to one form field.
 * Anything else (an unknown field, a query/path error) is not attributable.
 */
function fieldFromLoc(loc: FieldError["loc"]): PatientFormField | undefined {
  const bodyIndex = loc.indexOf("body")
  if (bodyIndex === -1) return undefined
  for (const part of loc.slice(bodyIndex + 1)) {
    if (typeof part === "string") return isPatientFormField(part) ? part : undefined
  }
  return undefined
}

/**
 * Applies a failed save to the form and returns the message for the form-level
 * banner, or undefined when every error landed on a field.
 *
 * 422 validation errors and the 409 duplicate email share one body shape, so both
 * come through here. Network failures, 404s and 5xx have no field to blame and
 * become the banner message. The user's input is never touched.
 */
export function applyServerErrors(error: unknown, form: FormHandle): string | undefined {
  if (!(error instanceof ApiError) || error.fieldErrors.length === 0) {
    if (error instanceof Error) return error.message
    return "Something went wrong while saving. Please try again."
  }

  const unmapped: string[] = []
  let firstField: PatientFormField | undefined

  for (const fieldError of error.fieldErrors) {
    const field = fieldFromLoc(fieldError.loc)
    if (field === undefined) {
      unmapped.push(fieldError.msg)
      continue
    }
    // type: "server" so the error is distinguishable from a client rule; RHF clears
    // it as soon as the user edits the field (reValidateMode "onChange").
    form.setError(field, { type: "server", message: fieldError.msg })
    firstField ??= field
  }

  if (firstField !== undefined) form.setFocus(firstField)
  return unmapped.length > 0 ? unmapped.join(" ") : undefined
}
