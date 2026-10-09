import { useId, useState } from "react"
import type { FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/api"

import { useAddNote } from "../queries"

const MAX_LENGTH = 5000
const CLOCK_SKEW_MS = 5 * 60_000 // matches the server's tolerance

type Errors = { content?: string; when?: string }

/** Current local time in the format <input type="datetime-local"> expects. */
function nowLocalInput(): string {
  const d = new Date()
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

function serverMessage(error: unknown, field: string): string | undefined {
  if (!(error instanceof ApiError)) return undefined
  return error.fieldErrors.find((e) => e.loc[e.loc.length - 1] === field)?.msg
}

const fieldClass =
  "border-input bg-background placeholder:text-muted-foreground focus-visible:border-ring " +
  "focus-visible:ring-ring/50 aria-invalid:border-destructive w-full rounded-md border px-3 " +
  "text-sm outline-none focus-visible:ring-[3px]"

export function NoteForm({ patientId }: { patientId: number }) {
  const add = useAddNote(patientId)
  const [content, setContent] = useState("")
  const [when, setWhen] = useState("")
  const [errors, setErrors] = useState<Errors>({})
  const contentId = useId()
  const whenId = useId()

  const serverContent = serverMessage(add.error, "content")
  const serverWhen = serverMessage(add.error, "noted_at")
  const contentError = errors.content ?? serverContent
  const whenError = errors.when ?? serverWhen
  // Network failures, 404s, 5xx: anything that isn't attributable to a field.
  const formError = add.error && !serverContent && !serverWhen ? add.error.message : undefined

  function clearErrors() {
    setErrors({})
    if (add.isError) add.reset()
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    const text = content.trim()
    const next: Errors = {}
    if (!text) next.content = "Note can't be empty."
    else if (text.length > MAX_LENGTH) next.content = `Keep notes under ${MAX_LENGTH} characters.`
    if (when && new Date(when).getTime() > Date.now() + CLOCK_SKEW_MS) {
      next.when = "Time can't be in the future."
    }
    setErrors(next)
    if (next.content || next.when) return

    add.mutate(
      // Local time -> UTC ISO string, so the server never receives an ambiguous timestamp.
      { content: text, noted_at: when ? new Date(when).toISOString() : undefined },
      {
        onSuccess: () => {
          setContent("")
          setWhen("")
        },
      },
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="bg-card space-y-3 rounded-lg border p-4">
      <div className="space-y-1.5">
        <label htmlFor={contentId} className="text-sm font-medium">
          New note
        </label>
        <textarea
          id={contentId}
          value={content}
          onChange={(e) => {
            setContent(e.target.value)
            clearErrors()
          }}
          rows={3}
          className={`${fieldClass} min-h-20 py-2`}
          aria-invalid={contentError ? true : undefined}
          aria-describedby={contentError ? `${contentId}-error` : undefined}
          placeholder="Observations, assessment, plan…"
        />
        <div className="flex justify-between gap-2 text-xs">
          <p
            id={`${contentId}-error`}
            role={contentError ? "alert" : undefined}
            className="text-destructive"
          >
            {contentError}
          </p>
          {content.length > MAX_LENGTH * 0.8 && (
            <span className="text-muted-foreground ml-auto tabular-nums">
              {content.length}/{MAX_LENGTH}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1.5">
          <label htmlFor={whenId} className="text-sm font-medium">
            Date and time <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <input
            id={whenId}
            type="datetime-local"
            value={when}
            max={nowLocalInput()}
            onChange={(e) => {
              setWhen(e.target.value)
              clearErrors()
            }}
            className={`${fieldClass} h-9`}
            aria-invalid={whenError ? true : undefined}
            aria-describedby={whenError ? `${whenId}-error` : undefined}
          />
          <p
            id={`${whenId}-error`}
            role={whenError ? "alert" : undefined}
            className="text-destructive text-xs"
          >
            {whenError}
          </p>
        </div>
        <Button type="submit" disabled={add.isPending}>
          {add.isPending ? "Adding…" : "Add note"}
        </Button>
      </div>

      {formError && (
        <p role="alert" className="text-destructive text-sm">
          {formError}
        </p>
      )}
    </form>
  )
}
