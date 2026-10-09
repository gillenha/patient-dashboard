export type FieldError = {
  loc: (string | number)[]
  msg: string
  type: string
}

export class ApiError extends Error {
  status: number
  fieldErrors: FieldError[]

  constructor(status: number, message: string, fieldErrors: FieldError[] = []) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

export class NetworkError extends Error {
  constructor() {
    super("Unable to reach the server. Check your connection and try again.")
    this.name = "NetworkError"
  }
}

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) || "/api"

type Params = Record<string, string | number | boolean | null | undefined>

function buildUrl(path: string, params?: Params): string {
  const url = `${BASE_URL}${path}`
  if (!params) return url
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") qs.set(key, String(value))
  }
  const query = qs.toString()
  return query ? `${url}?${query}` : url
}

function isFieldError(value: unknown): value is FieldError {
  return typeof value === "object" && value !== null && "loc" in value && "msg" in value
}

async function toApiError(response: Response): Promise<ApiError> {
  let detail: unknown
  try {
    detail = ((await response.json()) as { detail?: unknown }).detail
  } catch {
    // Non-JSON body (e.g. a proxy 502): fall through to the generic message.
  }
  if (typeof detail === "string") return new ApiError(response.status, detail)
  if (Array.isArray(detail)) {
    const fieldErrors = detail.filter(isFieldError).map((e) => ({
      ...e,
      msg: e.msg.replace(/^Value error, /, ""),
    }))
    return new ApiError(response.status, fieldErrors[0]?.msg ?? "Validation failed", fieldErrors)
  }
  return new ApiError(
    response.status,
    response.status >= 500
      ? "Server error. Please try again."
      : `Request failed (${response.status})`,
  )
}

type RequestOptions = {
  method?: string
  params?: Params
  body?: unknown
  signal?: AbortSignal
}

export async function request<T>(
  path: string,
  { method = "GET", params, body, signal }: RequestOptions = {},
): Promise<T> {
  let response: Response
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      signal,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch (error) {
    // Aborts come from TanStack Query cancelling stale requests; let them through.
    if (error instanceof DOMException && error.name === "AbortError") throw error
    throw new NetworkError()
  }

  if (!response.ok) throw await toApiError(response)
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

/** Never retry 4xx; retry network errors and 5xx up to twice. */
export function shouldRetry(failureCount: number, error: Error): boolean {
  if (error instanceof ApiError && error.status < 500) return false
  return failureCount < 2
}
