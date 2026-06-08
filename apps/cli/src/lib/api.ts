import { readConfig, getApiUrl } from './config'
import { z } from 'zod'
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const config = readConfig()
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> ?? {}),
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json'
    }

    if (config?.token) {
      headers['Authorization'] = `Bearer ${config.token}`
    }

    const res = await fetch(`${getApiUrl()}${path}`, { ...options, headers })

    if (!res.ok) {
      const responseError = await res.json()
      if (responseError.error?.name === 'ZodError') {
        throw new Error(responseError.error?.message)
      }
      throw new Error(`HTTP ${res.status}`)
    }
    return res.json()

  } catch (error: any) {
    throw new Error(`API request failed: ${error.message}`)
  }
}