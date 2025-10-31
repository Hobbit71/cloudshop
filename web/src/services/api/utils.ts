import type { AxiosError, Method } from 'axios'

export type ApiError = { message: string; code?: string; status?: number; details?: unknown }

/** Build query string from object, ignoring undefined/null */
export function buildQueryString(params: Record<string, unknown>): string {
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return
    sp.append(k, String(v))
  })
  const qs = sp.toString()
  return qs ? `?${qs}` : ''
}

/** Convert a plain object into FormData (for file uploads, nested keys dotted) */
export function buildFormData(payload: Record<string, any>): FormData {
  const fd = new FormData()
  const append = (key: string, value: any) => {
    if (value === undefined || value === null) return
    if (value instanceof Blob || value instanceof File) fd.append(key, value)
    else if (Array.isArray(value)) value.forEach((v, i) => append(`${key}[${i}]`, v))
    else if (typeof value === 'object') Object.entries(value).forEach(([k, v]) => append(`${key}.${k}`, v))
    else fd.append(key, String(value))
  }
  Object.entries(payload).forEach(([k, v]) => append(k, v))
  return fd
}

/** Narrow AxiosError into a standard-friendly error */
export function parseError(error: unknown): ApiError {
  const ax = error as AxiosError<any>
  if (ax && ax.isAxiosError) {
    const status = ax.response?.status
    const code = ax.code || ax.response?.data?.code
    const message = ax.response?.data?.message || ax.message || 'Request failed'
    return { message, code, status, details: ax.response?.data }
  }
  if (error instanceof Error) return { message: error.message }
  return { message: 'Unknown error' }
}

/** Handle authentication errors globally (e.g., redirect to login) */
export function handleAuthError(error: unknown) {
  const err = parseError(error)
  if (err.status === 401) {
    // Placeholder: route to login page or show modal
    // window.location.assign('/login')
  }
}

export function isIdempotentMethod(method?: Method) {
  const m = (method || 'get').toString().toUpperCase()
  return m === 'GET' || m === 'HEAD' || m === 'OPTIONS'
}


