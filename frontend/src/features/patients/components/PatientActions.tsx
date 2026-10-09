import { Pencil, Trash2 } from "lucide-react"
import { useState } from "react"
import { Link, useLocation } from "react-router"

import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { readListSearch } from "../listState"
import { useDeletePatient } from "../queries"
import type { Patient } from "../types"

/** Edit and delete for one patient. Delete asks for confirmation inline and never navigates on failure. */
export function PatientActions({ patient }: { patient: Patient }) {
  const remove = useDeletePatient(patient.id)
  const [confirming, setConfirming] = useState(false)
  const listSearch = readListSearch(useLocation().state)

  return (
    <div className="w-full space-y-2 sm:w-auto">
      {confirming ? (
        <div className="border-destructive/30 bg-destructive/5 flex flex-wrap items-center gap-3 rounded-lg border p-3">
          <p className="text-sm">
            Delete {patient.first_name} {patient.last_name}? Their clinical notes are deleted too.
            This cannot be undone.
          </p>
          <div className="ml-auto flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              disabled={remove.isPending}
              onClick={() => remove.mutate()}
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
        </div>
      ) : (
        <div className="flex gap-2 sm:justify-end">
          <Link
            to={`/patients/${patient.id}/edit`}
            state={{ listSearch }}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Pencil className="size-3.5" />
            Edit
          </Link>
          <Button variant="destructive" size="sm" onClick={() => setConfirming(true)}>
            <Trash2 className="size-3.5" />
            Delete
          </Button>
        </div>
      )}

      {remove.isError && (
        <p role="alert" className="text-destructive text-sm">
          {remove.error.message}
        </p>
      )}
    </div>
  )
}
