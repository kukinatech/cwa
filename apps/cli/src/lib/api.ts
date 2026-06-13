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
      switch (res.status) {
        case 401:
          throw new Error("Não autorizado")
        case 500:
          throw new Error(`Erro no servidor, tenta novamente`)
        default:
          throw new Error(`Erro Inesperado, tenta novamente`)
      }
    }
    return await res.json()
  } catch (error: any) {
    throw new Error(error.message)
  }
}