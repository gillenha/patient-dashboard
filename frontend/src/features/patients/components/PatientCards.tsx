import { Link } from "react-router"

import { formatDate } from "@/lib/format"

import type { PatientListItem } from "../types"
import { StatusBadge } from "./StatusBadge"

export function PatientCards({ items }: { items: PatientListItem[] }) {
  return (
    <ul className="space-y-2 md:hidden">
      {items.map((p) => (
        <li key={p.id}>
          <Link
            to={`/patients/${p.id}`}
            className="bg-card hover:bg-muted/50 focus-visible:ring-ring/50 block rounded-lg border p-4 transition-colors focus-visible:ring-[3px] focus-visible:outline-none"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {p.last_name}, {p.first_name}
                </p>
                <p className="text-muted-foreground truncate text-sm">{p.email}</p>
              </div>
              <StatusBadge status={p.status} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div>
                <dt className="text-muted-foreground">Age</dt>
                <dd className="tabular-nums">{p.age}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Last visit</dt>
                <dd>{formatDate(p.last_visit)}</dd>
              </div>
            </dl>
          </Link>
        </li>
      ))}
    </ul>
  )
}
