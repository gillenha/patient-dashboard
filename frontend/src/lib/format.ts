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
