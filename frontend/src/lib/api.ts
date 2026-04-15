import axios, { type AxiosInstance } from 'axios'
import { useAuth } from '@clerk/clerk-react'
import { useMemo } from 'react'

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

// Crea un axios client autenticado. El token se resuelve por petición, así siempre está fresco.
export function useApi(): AxiosInstance {
  const { getToken } = useAuth()

  return useMemo(() => {
    const client = axios.create({
      baseURL: API_URL,
      headers: { 'Content-Type': 'application/json' },
    })

    client.interceptors.request.use(async (config) => {
      const token = await getToken()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

    return client
  }, [getToken])
}
