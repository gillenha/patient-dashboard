import { Link } from "react-router"
import { cn } from "@/lib/utils"
import { ErrorState } from "@/features/patients/components/ErrorState"
import { StatusBreakdown } from "@/features/patients/components/StatusBreakdown"
import { usePatientStats } from "@/features/patients/queries"

function StatTile({ label, value, to }: { label: string; value: string | number; to?: string }) {
  const body = (
    <>
      <div className="text-muted-foreground text-sm">{label}</div>
      <div className="mt-1 text-3xl font-semibold tabular-nums">{value}</div>
    </>
  )
  const cls = "bg-card rounded-lg border p-4"
  return to ? (
    <Link to={to} className={cn(cls, "hover:bg-muted block")}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  )
}

export function DashboardPage() {
  const { data, isPending, isError, error, refetch } = usePatientStats()

  return (
    <div className="space-y-6 p-4 md:p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      {isPending && <div className="bg-muted h-48 animate-pulse rounded-lg" aria-busy="true" />}

      {isError && <ErrorState message={error.message} onRetry={() => void refetch()} />}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatTile label="Total patients" value={data.total} to="/patients" />
            <StatTile label="Seen in last 30 days" value={data.seen_last_30_days} />
            <StatTile
              label="Average age"
              value={data.average_age === null ? "—" : data.average_age}
            />
          </div>
          <section className="bg-card rounded-lg border p-4">
            <h2 className="mb-4 text-sm font-medium">Patients by status</h2>
            <StatusBreakdown counts={data.by_status} total={data.total} />
          </section>
        </>
      )}
    </div>
  )
}
