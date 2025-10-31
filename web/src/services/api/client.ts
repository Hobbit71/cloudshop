import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios'
import { parseError, handleAuthError, isIdempotentMethod } from './utils'
import { getAccessToken, getRefreshToken, setAccessToken, clearTokens } from './token'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Basic exponential backoff
function sleep(ms: number) { return new Promise((res) => setTimeout(res, ms)) }

/** Create configured Axios instance with interceptors, retry and logging. */
export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000
})

// Request interceptor: auth header + logging
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken()
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  if (import.meta.env.DEV) {
    console.debug('[API] ->', config.method?.toUpperCase(), config.url, config.params || '', config.data || '')
  }
  return config
})

let isRefreshing = false
let pendingQueue: Array<(token: string | null) => void> = []

async function refreshAccessToken(): Promise<string | null> {
  if (isRefreshing) {
    return new Promise((resolve) => pendingQueue.push(resolve))
  }
  isRefreshing = true
  try {
    const refresh = getRefreshToken()
    if (!refresh) throw new Error('No refresh token')
    const res = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken: refresh })
    const newToken = res.data?.accessToken as string
    if (newToken) setAccessToken(newToken)
    pendingQueue.forEach((fn) => fn(newToken))
    pendingQueue = []
    return newToken ?? null
  } catch (err) {
    pendingQueue.forEach((fn) => fn(null))
    pendingQueue = []
    handleAuthError(err)
    clearTokens()
    return null
  } finally {
    isRefreshing = false
  }
}

// Response interceptor: logging, token refresh on 401, error transform, basic retry
api.interceptors.response.use(
  (res) => {
    if (import.meta.env.DEV) console.debug('[API] <-', res.status, res.config.url, res.data)
    return res
  },
  async (error: AxiosError) => {
    const config = error.config as (AxiosRequestConfig & { __retryCount?: number; __isRetry?: boolean })
    const status = error.response?.status

    // Try token refresh once on 401
    if (status === 401 && !config.__isRetry) {
      config.__isRetry = true
      const newToken = await refreshAccessToken()
      if (newToken && config.headers) {
        config.headers.Authorization = `Bearer ${newToken}`
        return api.request(config)
      }
    }

    // Basic retry for idempotent methods on network/5xx
    const shouldRetry = (!status || status >= 500) && isIdempotentMethod(config.method)
    const retries = 2
    config.__retryCount = config.__retryCount ?? 0
    if (shouldRetry && config.__retryCount < retries) {
      config.__retryCount++
      const backoffMs = 300 * Math.pow(2, config.__retryCount)
      await sleep(backoffMs)
      return api.request(config)
    }

    const friendly = parseError(error)
    if (import.meta.env.DEV) console.error('[API] x ', friendly.message, error)
    return Promise.reject(friendly)
  }
)


