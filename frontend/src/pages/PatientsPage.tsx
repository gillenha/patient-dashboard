import { useEffect, useRef, type ReactNode } from "react"

import { NativeSelect } from "@/components/NativeSelect"
import { Pagination } from "@/components/Pagination"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { PatientCards } from "@/features/patients/components/PatientCards"
import { PatientSearch } from "@/features/patients/components/PatientSearch"
import { PatientTable } from "@/features/patients/components/PatientTable"
import { usePatients } from "@/features/patients/queries"
import {
  PATIENT_STATUSES,
  STATUS_LABELS,
  type SortField,
  type SortOrder,
} from "@/features/patients/types"
import { PAGE_SIZE, usePatientListParams } from "@/features/patients/useListParams"
import { cn } from "@/lib/utils"

const SORT_OPTIONS = [
  { value: "last_name:asc", label: "Name A–Z" },
  { value: "last_name:desc", label: "Name Z–A" },
  { value: "age:asc", label: "Age: youngest first" },
  { value: "age:desc", label: "Age: oldest first" },
  { value: "last_visit:desc", label: "Last visit: newest" },
  { value: "last_visit:asc", label: "Last visit: oldest" },
  { value: "status:asc", label: "Status" },
]

export function PatientsPage() {
  const { params, update } = usePatientListParams()
  const { data, error, isPending, isPlaceholderData, refetch } = usePatients(params)
  const topRef = useRef<HTMLDivElement>(null)

  // Clamp out-of-range pages (e.g. a bookmarked ?page=9 after rows were deleted).
  useEffect(() => {
    if (data && data.pages > 0 && params.page > data.pages) {
      update({ page: data.pages }, { replace: true })
    }
  }, [data, params.page, update])

  const hasFilters = params.q !== "" || params.status !== undefined
  const clearFilters = () => update({ q: "", status: undefined, page: 1 })

  const handleSort = (field: SortField) => {
    if (params.sort_by === field) {
      update({ order: params.order === "asc" ? "desc" : "asc", page: 1 })
    } else {
      update({ sort_by: field, order: field === "last_visit" ? "desc" : "asc", page: 1 })
    }
  }

  const handlePageChange = (page: number) => {
    update({ page })
    // The scroll container is <main>, not the window, so scroll the list header into view.
    topRef.current?.scrollIntoView({ block: "start" })
  }

  let content: ReactNode
  if (isPending) {
    content = <ListSkeleton />
  } else if (!data) {
    content = (
      <ErrorState
        message={error?.message ?? "Something went wrong."}
        onRetry={() => void refetch()}
      />
    )
  } else if (data.items.length === 0) {
    content = <EmptyState filtered={hasFilters} onClear={clearFilters} />
  } else {
    content = (
      <div className={cn("transition-opacity", isPlaceholderData && "opacity-60")}>
        <PatientTable
          items={data.items}
          sortBy={params.sort_by}
          order={params.order}
          onSort={handleSort}
        />
        <PatientCards items={data.items} />
        <Pagination
          page={data.page}
          pages={data.pages}
          total={data.total}
          pageSize={PAGE_SIZE}
          onPageChange={handlePageChange}
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div ref={topRef} className="flex items-baseline justify-between gap-3">
        <h1 className="text-2xl font-semibold">Patients</h1>
        {data && (
          <p className="text-muted-foreground text-sm tabular-nums">
            {data.total} {data.total === 1 ? "patient" : "patients"}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <PatientSearch
          value={params.q}
          onSearch={(q) => update({ q, page: 1 }, { replace: true })}
        />
        <NativeSelect
          aria-label="Filter by status"
          value={params.status ?? ""}
          onChange={(e) =>
            update({
              status: PATIENT_STATUSES.find((s) => s === e.target.value),
              page: 1,
            })
          }
        >
          <option value="">All statuses</option>
          {PATIENT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          className="md:hidden"
          aria-label="Sort by"
          value={`${params.sort_by}:${params.order}`}
          onChange={(e) => {
            const [sort_by, order] = e.target.value.split(":") as [SortField, SortOrder]
            update({ sort_by, order, page: 1 })
          }}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </NativeSelect>
      </div>

      {content}
    </div>
  )
}

function ListSkeleton() {
  return (
    <div role="status" aria-label="Loading patients" className="space-y-2">
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  )
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="border-destructive/30 bg-destructive/5 flex flex-col items-start gap-3 rounded-lg border p-6"
    >
      <p className="font-medium">Couldn't load patients</p>
      <p className="text-muted-foreground text-sm">{message}</p>
      <Button variant="outline" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}

function EmptyState({ filtered, onClear }: { filtered: boolean; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed p-10 text-center">
      <p className="font-medium">
        {filtered ? "No patients match your filters" : "No patients yet"}
      </p>
      {filtered && (
        <Button variant="outline" onClick={onClear}>
          Clear filters
        </Button>
      )}
    </div>
  )
}
