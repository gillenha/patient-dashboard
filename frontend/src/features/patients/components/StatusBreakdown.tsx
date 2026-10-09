import { Link } from "react-router"

import { cn } from "@/lib/utils"

import { PATIENT_STATUSES, STATUS_LABELS } from "../types"
import type { PatientStatus } from "../types"

const SWATCH: Record<PatientStatus, string> = {
  active: "bg-emerald-500",
  inactive: "bg-amber-500",
  discharged: "bg-slate-400",
}

type Props = { counts: Record<PatientStatus, number>; total: number }

export function StatusBreakdown({ counts, total }: Props) {
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0)
  const summary = PATIENT_STATUSES.map((s) => `${STATUS_LABELS[s]} ${counts[s]}`).join(", ")

  return (
    <div>
      <div className="flex h-3 gap-0.5" role="img" aria-label={`Patients by status: ${summary}`}>
        {PATIENT_STATUSES.filter((s) => counts[s] > 0).map((s) => (
          <div
            key={s}
            title={`${STATUS_LABELS[s]}: ${counts[s]} (${pct(counts[s])}%)`}
            className={cn("first:rounded-l-full last:rounded-r-full", SWATCH[s])}
            style={{ flex: `${counts[s]} 1 0%` }}
          />
        ))}
      </div>
      <ul className="mt-4 grid gap-2 sm:grid-cols-3">
        {PATIENT_STATUSES.map((s) => (
          <li key={s}>
            <Link
              to={`/patients?status=${s}`}
              className="hover:bg-muted flex items-center gap-2 rounded-md px-2 py-1.5 text-sm"
            >
              <span className={cn("size-2.5 shrink-0 rounded-full", SWATCH[s])} aria-hidden />
              <span>{STATUS_LABELS[s]}</span>
              <span className="ml-auto font-medium tabular-nums">{counts[s]}</span>
              <span className="text-muted-foreground w-10 text-right tabular-nums">
                {pct(counts[s])}%
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
