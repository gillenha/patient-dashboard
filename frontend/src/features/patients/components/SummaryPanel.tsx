import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

import { usePatientSummary } from "../queries"
import { STATUS_LABELS } from "../types"
import { ErrorState } from "./ErrorState"

function TagList({
  label,
  items,
  empty,
  alert,
}: {
  label: string
  items: string[]
  empty: string
  alert?: boolean
}) {
  return (
    <div>
      <dt className="text-muted-foreground text-xs font-medium uppercase">{label}</dt>
      <dd className="mt-1.5 flex flex-wrap gap-1.5">
        {items.length === 0 ? (
          <span className="text-muted-foreground text-sm">{empty}</span>
        ) : (
          items.map((item) => (
            <Badge
              key={item}
              variant="secondary"
              className={cn(alert && "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200")}
            >
              {item}
            </Badge>
          ))
        )}
      </dd>
    </div>
  )
}

export function SummaryPanel({ patientId }: { patientId: number }) {
  const { data, error, isPending, isFetching, refetch } = usePatientSummary(patientId)

  let body
  if (isPending) {
    body = (
      <div role="status" aria-label="Loading summary" className="space-y-3">
        <Skeleton className="h-5 w-72 max-w-full" />
        <Skeleton className="h-16" />
      </div>
    )
  } else if (!data) {
    body = (
      <ErrorState
        title="Couldn't load summary"
        message={error?.message ?? "Something went wrong."}
        onRetry={() => void refetch()}
      />
    )
  } else {
    body = (
      <div className="space-y-4">
        <p className="text-sm font-medium">
          {data.first_name} {data.last_name} · {data.age} years old · Blood type {data.blood_type} ·{" "}
          {STATUS_LABELS[data.status]}
          {data.last_visit && (
            <span className="text-muted-foreground font-normal">
              {" "}
              · Last visit {formatDate(data.last_visit)}
            </span>
          )}
        </p>
        <dl className="grid gap-4 sm:grid-cols-2">
          <TagList label="Conditions" items={data.conditions} empty="None recorded" />
          <TagList label="Allergies" items={data.allergies} empty="No known allergies" alert />
        </dl>
        <p className="text-sm leading-relaxed">{data.narrative}</p>
      </div>
    )
  }

  return (
    <section aria-labelledby="summary-heading" className="bg-card space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 id="summary-heading" className="text-lg font-semibold">
          Summary
        </h2>
        <span className="text-muted-foreground text-xs" aria-live="polite">
          {data && isFetching ? "Updating…" : "Generated from profile and notes"}
        </span>
      </div>
      {body}
    </section>
  )
}
