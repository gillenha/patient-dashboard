import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

import { STATUS_LABELS, type PatientStatus } from "../types"

const STYLES: Record<PatientStatus, string> = {
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  inactive: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  discharged: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
}

export function StatusBadge({ status }: { status: PatientStatus }) {
  return (
    <Badge variant="secondary" className={cn("border-transparent", STYLES[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  )
}
