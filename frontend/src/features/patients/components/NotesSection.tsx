import { Trash2 } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDateTime } from "@/lib/format"

import { useDeleteNote, usePatientNotes } from "../queries"
import type { Note } from "../types"
import { ErrorState } from "./ErrorState"
import { NoteForm } from "./NoteForm"

const BACKDATE_THRESHOLD_MS = 60 * 60_000

export function NotesSection({ patientId }: { patientId: number }) {
  const { data, error, isPending, refetch } = usePatientNotes(patientId)

  let list
  if (isPending) {
    list = (
      <div role="status" aria-label="Loading notes" className="space-y-3">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    )
  } else if (!data) {
    list = (
      <ErrorState
        title="Couldn't load notes"
        message={error?.message ?? "Something went wrong."}
        onRetry={() => void refetch()}
      />
    )
  } else if (data.length === 0) {
    list = (
      <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-sm">
        No notes yet. Add the first one above.
      </p>
    )
  } else {
    list = (
      <ul className="space-y-3">
        {data.map((note) => (
          <NoteItem key={note.id} note={note} patientId={patientId} />
        ))}
      </ul>
    )
  }

  return (
    <section aria-labelledby="notes-heading" className="space-y-4">
      <h2 id="notes-heading" className="text-lg font-semibold">
        Clinical notes
        {data && (
          <span className="text-muted-foreground ml-2 text-sm font-normal">({data.length})</span>
        )}
      </h2>
      <NoteForm patientId={patientId} />
      {list}
    </section>
  )
}

function NoteItem({ note, patientId }: { note: Note; patientId: number }) {
  const remove = useDeleteNote(patientId)
  const [confirming, setConfirming] = useState(false)

  // Show when it was recorded only if it differs meaningfully from when it happened.
  const backdated =
    new Date(note.created_at).getTime() - new Date(note.noted_at).getTime() > BACKDATE_THRESHOLD_MS

  return (
    <li className="bg-card rounded-lg border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="text-muted-foreground text-xs">
          <time dateTime={note.noted_at}>{formatDateTime(note.noted_at)}</time>
          {backdated && <span> · recorded {formatDateTime(note.created_at)}</span>}
        </div>

        {confirming ? (
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              disabled={remove.isPending}
              onClick={() => remove.mutate(note.id)}
            >
              {remove.isPending ? "Deleting…" : "Confirm delete"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={remove.isPending}
              onClick={() => {
                setConfirming(false)
                remove.reset()
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Delete note from ${formatDateTime(note.noted_at)}`}
            onClick={() => setConfirming(true)}
          >
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>

      <p className="mt-2 text-sm break-words whitespace-pre-wrap">{note.content}</p>

      {remove.isError && (
        <p role="alert" className="text-destructive mt-2 text-sm">
          {remove.error.message}
        </p>
      )}
    </li>
  )
}
