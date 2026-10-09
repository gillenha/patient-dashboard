import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { Link } from "react-router"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

import type { PatientListItem, SortField, SortOrder } from "../types"
import { StatusBadge } from "./StatusBadge"

type SortableHeadProps = {
  label: string
  field: SortField
  sortBy: SortField
  order: SortOrder
  onSort: (field: SortField) => void
}

function SortableHead({ label, field, sortBy, order, onSort }: SortableHeadProps) {
  const active = sortBy === field
  const Icon = !active ? ArrowUpDown : order === "asc" ? ArrowUp : ArrowDown
  return (
    <TableHead aria-sort={active ? (order === "asc" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className="hover:text-foreground focus-visible:ring-ring/50 -ml-1 inline-flex items-center gap-1 rounded px-1 py-0.5 focus-visible:ring-[3px] focus-visible:outline-none"
      >
        {label}
        <Icon className={cn("size-3.5", !active && "opacity-40")} />
      </button>
    </TableHead>
  )
}

type Props = {
  items: PatientListItem[]
  sortBy: SortField
  order: SortOrder
  onSort: (field: SortField) => void
}

export function PatientTable({ items, sortBy, order, onSort }: Props) {
  const head = { sortBy, order, onSort }
  return (
    <div className="hidden rounded-lg border md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHead label="Name" field="last_name" {...head} />
            <SortableHead label="Age" field="age" {...head} />
            <SortableHead label="Last visit" field="last_visit" {...head} />
            <SortableHead label="Status" field="status" {...head} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((p) => (
            <TableRow key={p.id}>
              <TableCell>
                <Link to={`/patients/${p.id}`} className="font-medium hover:underline">
                  {p.last_name}, {p.first_name}
                </Link>
                <div className="text-muted-foreground text-xs">{p.email}</div>
              </TableCell>
              <TableCell className="tabular-nums">{p.age}</TableCell>
              <TableCell>{formatDate(p.last_visit)}</TableCell>
              <TableCell>
                <StatusBadge status={p.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
