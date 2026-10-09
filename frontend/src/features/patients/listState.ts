export type ListLinkState = { listSearch: string }

/** Safely reads the list query string that list rows pass via router state. */
export function readListSearch(state: unknown): string {
  if (typeof state === "object" && state !== null && "listSearch" in state) {
    const { listSearch } = state
    if (typeof listSearch === "string" && listSearch.startsWith("?")) return listSearch
  }
  return ""
}
