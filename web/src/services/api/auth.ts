import { api } from './client'
import { z } from 'zod'
import { setAccessToken, setRefreshToken, clearTokens } from './token'

export const credentialsSchema = z.object({ email: z.string().email(), password: z.string().min(8) })
export type Credentials = z.infer<typeof credentialsSchema>

export type Me = { id: string; email: string; name?: string }

/** Login with email/password */
export async function login(input: Credentials): Promise<Me> {
  const body = credentialsSchema.parse(input)
  const res = await api.post('/auth/login', body)
  if (res.data?.accessToken) setAccessToken(res.data.accessToken)
  if (res.data?.refreshToken) setRefreshToken(res.data.refreshToken)
  return res.data.user as Me
}

/** Register a new user */
export async function register(input: Credentials & { name?: string }): Promise<Me> {
  const body = credentialsSchema.extend({ name: z.string().optional() }).parse(input)
  const res = await api.post('/auth/register', body)
  return res.data.user as Me
}

/** Logout current user */
export async function logout(): Promise<void> {
  await api.post('/auth/logout')
  clearTokens()
}

/** Current user */
export async function me(): Promise<Me> {
  const res = await api.get('/me')
  return res.data as Me
}


