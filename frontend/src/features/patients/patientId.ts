const MAX_ID = 2_147_483_647 // Postgres integer range, matches the API's path validation

/**
 * Reads a patient id out of a route param. Returns null for anything the API
 * could not possibly accept, so callers can render "not found" without a request.
 */
export function parsePatientId(raw: string | undefined): number | null {
  if (raw === undefined || !/^\d+$/.test(raw)) return null
  const id = Number(raw)
  return id >= 1 && id <= MAX_ID ? id : null
}
