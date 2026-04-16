import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useApi } from '@/lib/api'
import type {
  Aula,
  Carrera,
  DisponibilidadProfesor,
  Estudiante,
  Materia,
  Profesor,
  ProfesorMateria,
  Usuario,
} from '@/lib/types'

// ───────────── AUTH / ME ─────────────
export function useMe() {
  const api = useApi()
  return useQuery<Usuario>({
    queryKey: ['me'],
    queryFn: async () => (await api.get('/api/auth/me')).data,
    retry: false,
  })
}

export function usePromoteToAdmin() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => (await api.post('/api/auth/promote-admin')).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  })
}

// ───────────── Factory para CRUD ─────────────
function makeResource<T>(path: string, key: string) {
  return {
    useList: (params?: Record<string, unknown>) => {
      const api = useApi()
      return useQuery<T[]>({
        queryKey: [key, params ?? {}],
        queryFn: async () => (await api.get(path, { params })).data,
      })
    },
    useCreate: () => {
      const api = useApi()
      const qc = useQueryClient()
      return useMutation({
        mutationFn: async (body: Partial<T>) => (await api.post(path, body)).data,
        onSuccess: () => qc.invalidateQueries({ queryKey: [key] }),
      })
    },
    useUpdate: () => {
      const api = useApi()
      const qc = useQueryClient()
      return useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<T> }) =>
          (await api.put(`${path}/${id}`, data)).data,
        onSuccess: () => qc.invalidateQueries({ queryKey: [key] }),
      })
    },
    useDelete: () => {
      const api = useApi()
      const qc = useQueryClient()
      return useMutation({
        mutationFn: async (id: string) => (await api.delete(`${path}/${id}`)).data,
        onSuccess: () => qc.invalidateQueries({ queryKey: [key] }),
      })
    },
  }
}

export const Carreras = makeResource<Carrera>('/api/carreras', 'carreras')
export const Materias = makeResource<Materia>('/api/materias', 'materias')
export const Profesores = makeResource<Profesor>('/api/profesores', 'profesores')
export const Disponibilidades = makeResource<DisponibilidadProfesor>('/api/disponibilidades', 'disponibilidades')
export const ProfesorMaterias = makeResource<ProfesorMateria>('/api/profesor-materias', 'profesor-materias')
export const Estudiantes = makeResource<Estudiante>('/api/estudiantes', 'estudiantes')
export const Aulas = makeResource<Aula>('/api/aulas', 'aulas')
export const Secciones = makeResource<any>('/api/secciones', 'secciones')
export const Horarios = makeResource<any>('/api/horarios', 'horarios')
export const Inscripciones = makeResource<any>('/api/inscripciones', 'inscripciones')
export const Ciclos = makeResource<any>('/api/ciclos', 'ciclos')
export const Usuarios = makeResource<Usuario>('/api/usuarios', 'usuarios')
