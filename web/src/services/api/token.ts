const ACCESS_KEY = 'cloudshop.accessToken'
const REFRESH_KEY = 'cloudshop.refreshToken'

export function getAccessToken(): string | null { return localStorage.getItem(ACCESS_KEY) }
export function setAccessToken(token: string) { localStorage.setItem(ACCESS_KEY, token) }
export function getRefreshToken(): string | null { return localStorage.getItem(REFRESH_KEY) }
export function setRefreshToken(token: string) { localStorage.setItem(REFRESH_KEY, token) }
export function clearTokens() { localStorage.removeItem(ACCESS_KEY); localStorage.removeItem(REFRESH_KEY) }


