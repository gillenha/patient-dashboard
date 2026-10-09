const formatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
})

/** Formats a "YYYY-MM-DD" string as a local date (new Date("YYYY-MM-DD") parses as UTC and can show the previous day). */
export function formatDate(iso: string | null): string {
  if (!iso) return "—"
  const [y, m, d] = iso.split("-").map(Number)
  if (!y || !m || !d) return iso
  return formatter.format(new Date(y, m - 1, d))
}

/** Today as a local "YYYY-MM-DD" string. Built from local parts; toISOString() would shift to UTC. */
export function todayIso(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${now.getFullYear()}-${month}-${day}`
}

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
})

/** Formats a full ISO timestamp (with timezone) in the viewer's locale. */
export function formatDateTime(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? iso : dateTimeFormatter.format(date)
}
