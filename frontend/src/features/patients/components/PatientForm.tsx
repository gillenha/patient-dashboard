import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import type { ReactNode } from "react"
import { Controller, useForm } from "react-hook-form"
import { Link } from "react-router"
import type { To } from "react-router"

import { NativeSelect } from "@/components/NativeSelect"
import { Button, buttonVariants } from "@/components/ui/button"
import { ApiError } from "@/lib/api"
import { todayIso } from "@/lib/format"
import { cn } from "@/lib/utils"

import type { ListLinkState } from "../listState"
import { patientFormSchema, toPatientInput } from "../schema"
import type { PatientFormField, PatientFormOutput, PatientFormValues } from "../schema"
import { applyServerErrors } from "../serverErrors"
import { BLOOD_TYPES, PATIENT_STATUSES, STATUS_LABELS } from "../types"
import type { PatientInput } from "../types"
import { TagInput } from "./TagInput"

const fieldClass =
  "border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring " +
  "focus-visible:ring-ring/50 aria-invalid:border-destructive w-full rounded-md border px-3 " +
  "text-sm outline-none focus-visible:ring-[3px]"

const inputClass = `${fieldClass} h-9`

type FieldAria = {
  id: string
  required?: true
  "aria-invalid"?: true
  "aria-describedby"?: string
}

type FieldProps = {
  name: PatientFormField
  label: string
  error?: string
  optional?: boolean
  className?: string
  children: (aria: FieldAria) => ReactNode
}

/** Label, control and error message wired together for one form field. */
function Field({ name, label, error, optional, className, children }: FieldProps) {
  const id = `patient-${name}`
  const errorId = `${id}-error`
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {optional ? (
          <span className="text-muted-foreground font-normal"> (optional)</span>
        ) : (
          <span className="text-destructive" aria-hidden="true">
            {" *"}
          </span>
        )}
      </label>
      {children({
        id,
        required: optional ? undefined : true,
        "aria-invalid": error === undefined ? undefined : true,
        "aria-describedby": error === undefined ? undefined : errorId,
      })}
      <p
        id={errorId}
        role={error === undefined ? undefined : "alert"}
        className="text-destructive text-xs"
      >
        {error}
      </p>
    </div>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="bg-card space-y-4 rounded-lg border p-5">
      <h2 id={id} className="text-muted-foreground text-sm font-semibold tracking-wide uppercase">
        {title}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  )
}

type Props = {
  defaultValues: PatientFormValues
  submitLabel: string
  cancelTo: To
  cancelState?: ListLinkState
  /** Rejects with an ApiError or NetworkError; the form maps it back onto the fields. */
  onSave: (input: PatientInput) => Promise<unknown>
}

export function PatientForm({ defaultValues, submitLabel, cancelTo, cancelState, onSave }: Props) {
  const form = useForm<PatientFormValues, unknown, PatientFormOutput>({
    defaultValues,
    resolver: zodResolver(patientFormSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
  })
  const { errors, isSubmitting } = form.formState
  // Everything the server reported that no single field can own.
  const [banner, setBanner] = useState<{ message: string; missing: boolean } | null>(null)
  const today = todayIso()

  const submit = form.handleSubmit(async (values) => {
    setBanner(null)
    try {
      await onSave(toPatientInput(values))
    } catch (error) {
      // The form keeps its values, so a retry costs the user nothing.
      const message = applyServerErrors(error, form)
      setBanner(
        message === undefined
          ? null
          : { message, missing: error instanceof ApiError && error.status === 404 },
      )
    }
  })

  return (
    <form
      noValidate
      onSubmit={(event) => void submit(event)}
      className="space-y-4"
      aria-busy={isSubmitting || undefined}
    >
      <Section id="personal-information" title="Personal information">
        <Field name="first_name" label="First name" error={errors.first_name?.message}>
          {(aria) => (
            <input
              {...aria}
              {...form.register("first_name")}
              autoComplete="given-name"
              className={inputClass}
            />
          )}
        </Field>

        <Field name="last_name" label="Last name" error={errors.last_name?.message}>
          {(aria) => (
            <input
              {...aria}
              {...form.register("last_name")}
              autoComplete="family-name"
              className={inputClass}
            />
          )}
        </Field>

        <Field name="date_of_birth" label="Date of birth" error={errors.date_of_birth?.message}>
          {(aria) => (
            <input
              {...aria}
              {...form.register("date_of_birth")}
              type="date"
              max={today}
              min="1900-01-01"
              autoComplete="bday"
              className={inputClass}
            />
          )}
        </Field>

        <Field name="email" label="Email" error={errors.email?.message}>
          {(aria) => (
            <input
              {...aria}
              {...form.register("email")}
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              className={inputClass}
            />
          )}
        </Field>

        <Field name="phone" label="Phone" error={errors.phone?.message}>
          {(aria) => (
            <input
              {...aria}
              {...form.register("phone")}
              type="tel"
              autoComplete="tel"
              placeholder="(555) 123-4567"
              className={inputClass}
            />
          )}
        </Field>
      </Section>

      <Section id="address" title="Address">
        <Field
          name="address_line1"
          label="Street address"
          error={errors.address_line1?.message}
          className="sm:col-span-2"
        >
          {(aria) => (
            <input
              {...aria}
              {...form.register("address_line1")}
              autoComplete="street-address"
              className={inputClass}
            />
          )}
        </Field>

        <Field name="city" label="City" error={errors.city?.message}>
          {(aria) => (
            <input
              {...aria}
              {...form.register("city")}
              autoComplete="address-level2"
              className={inputClass}
            />
          )}
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field name="state" label="State" error={errors.state?.message}>
            {(aria) => (
              <input
                {...aria}
                {...form.register("state")}
                // Two-letter codes are stored uppercase, so normalize as the user leaves the field.
                onBlur={() =>
                  form.setValue("state", form.getValues("state").trim().toUpperCase(), {
                    shouldValidate: true,
                    shouldTouch: true,
                  })
                }
                maxLength={2}
                autoCapitalize="characters"
                autoComplete="address-level1"
                placeholder="CA"
                className={`${inputClass} uppercase`}
              />
            )}
          </Field>

          <Field name="postal_code" label="ZIP code" error={errors.postal_code?.message}>
            {(aria) => (
              <input
                {...aria}
                {...form.register("postal_code")}
                inputMode="numeric"
                autoComplete="postal-code"
                placeholder="94110"
                className={inputClass}
              />
            )}
          </Field>
        </div>
      </Section>

      <Section id="medical-information" title="Medical information">
        <Field name="blood_type" label="Blood type" error={errors.blood_type?.message}>
          {(aria) => (
            <NativeSelect {...aria} {...form.register("blood_type")} className="w-full">
              <option value="">Select a blood type…</option>
              {BLOOD_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </NativeSelect>
          )}
        </Field>

        <Field name="status" label="Status" error={errors.status?.message}>
          {(aria) => (
            <NativeSelect {...aria} {...form.register("status")} className="w-full">
              {PATIENT_STATUSES.map((value) => (
                <option key={value} value={value}>
                  {STATUS_LABELS[value]}
                </option>
              ))}
            </NativeSelect>
          )}
        </Field>

        <Field
          name="allergies"
          label="Allergies"
          error={errors.allergies?.message}
          optional
          className="sm:col-span-2"
        >
          {(aria) => (
            <Controller
              control={form.control}
              name="allergies"
              render={({ field }) => (
                <TagInput
                  id={aria.id}
                  aria-invalid={aria["aria-invalid"]}
                  aria-describedby={aria["aria-describedby"]}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  inputRef={field.ref}
                  itemLabel="allergies"
                  placeholder="Penicillin, latex… (press Enter after each)"
                />
              )}
            />
          )}
        </Field>

        <Field
          name="conditions"
          label="Conditions"
          error={errors.conditions?.message}
          optional
          className="sm:col-span-2"
        >
          {(aria) => (
            <Controller
              control={form.control}
              name="conditions"
              render={({ field }) => (
                <TagInput
                  id={aria.id}
                  aria-invalid={aria["aria-invalid"]}
                  aria-describedby={aria["aria-describedby"]}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  inputRef={field.ref}
                  itemLabel="conditions"
                  placeholder="Asthma, hypertension… (press Enter after each)"
                />
              )}
            />
          )}
        </Field>

        <Field name="last_visit" label="Last visit" error={errors.last_visit?.message} optional>
          {(aria) => (
            <input
              {...aria}
              {...form.register("last_visit")}
              type="date"
              max={today}
              className={inputClass}
            />
          )}
        </Field>
      </Section>

      {banner && (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/5 space-y-2 rounded-lg border p-4"
        >
          <p className="text-sm">{banner.message}</p>
          {banner.missing && (
            <Link
              to={{ pathname: "/patients", search: cancelState?.listSearch }}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              Back to patients
            </Link>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : submitLabel}
        </Button>
        <Link
          to={cancelTo}
          state={cancelState}
          className={cn(buttonVariants({ variant: "ghost" }))}
        >
          Cancel
        </Link>
        <p className="text-muted-foreground ml-auto text-xs">* Required</p>
      </div>
    </form>
  )
}
