import { useCallback, useMemo } from "react"
import { useSearchParams } from "react-router"

import { PATIENT_STATUSES, SORT_FIELDS, type PatientListParams, type SortField } from "./types"

export const PAGE_SIZE = 20
const DEFAULT_SORT: SortField = "last_name"

export type ListParams = Required<Omit<PatientListParams, "status">> &
  Pick<PatientListParams, "status">

function parse(sp: URLSearchParams): ListParams {
  const status = sp.get("status")
  const sortBy = sp.get("sort_by")
  const page = Number(sp.get("page"))
  return {
    q: sp.get("q")?.trim() ?? "",
    status: PATIENT_STATUSES.find((s) => s === status),
    sort_by: SORT_FIELDS.find((f) => f === sortBy) ?? DEFAULT_SORT,
    order: sp.get("order") === "desc" ? "desc" : "asc",
    page: Number.isInteger(page) && page > 0 ? page : 1,
    page_size: PAGE_SIZE,
  }
}

function serialize(p: ListParams): URLSearchParams {
  const sp = new URLSearchParams()
  if (p.q) sp.set("q", p.q)
  if (p.status) sp.set("status", p.status)
  if (p.sort_by !== DEFAULT_SORT || p.order !== "asc") {
    sp.set("sort_by", p.sort_by)
    sp.set("order", p.order)
  }
  if (p.page > 1) sp.set("page", String(p.page))
  return sp
}

export function usePatientListParams() {
  const [searchParams, setSearchParams] = useSearchParams()
  const params = useMemo(() => parse(searchParams), [searchParams])

  const update = useCallback(
    (patch: Partial<ListParams>, options?: { replace?: boolean }) => {
      setSearchParams((prev) => serialize({ ...parse(prev), ...patch }), {
        replace: options?.replace ?? false,
      })
    },
    [setSearchParams],
  )

  return { params, update }
}
