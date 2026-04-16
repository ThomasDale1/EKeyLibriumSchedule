import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useApi } from '@/lib/api'
import type { PlanHorario } from '@/lib/types'
import type { ScheduleBlock } from './types'
import type { Schedule } from './store'

const PLANS_KEY = 'planes-horario'
const API_PATH = '/api/planes-horario'

export function usePlanList(enabled = true) {
  const api = useApi()
  return useQuery<PlanHorario[]>({
    queryKey: [PLANS_KEY],
    queryFn: async () => (await api.get(API_PATH)).data,
    enabled,
    staleTime: 30_000,
  })
}

export function usePlanById(id: string | null) {
  const api = useApi()
  return useQuery<PlanHorario>({
    queryKey: [PLANS_KEY, id],
    queryFn: async () => (await api.get(`${API_PATH}/${id}`)).data,
    enabled: !!id,
  })
}

export function useCreatePlan() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { nombre: string; bloques: ScheduleBlock[]; notas?: string; cicloId?: string }) =>
      (await api.post(API_PATH, body)).data as PlanHorario,
    onSuccess: () => qc.invalidateQueries({ queryKey: [PLANS_KEY] }),
  })
}

export function useUpdatePlan() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PlanHorario & { bloques: ScheduleBlock[] }> }) =>
      (await api.put(`${API_PATH}/${id}`, data)).data as PlanHorario,
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [PLANS_KEY] })
      qc.invalidateQueries({ queryKey: [PLANS_KEY, vars.id] })
    },
  })
}

export function useDeletePlan() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`${API_PATH}/${id}`)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [PLANS_KEY] }),
  })
}

export function useDuplicatePlan() {
  const api = useApi()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, nombre }: { id: string; nombre?: string }) =>
      (await api.post(`${API_PATH}/${id}/duplicate`, { nombre })).data as PlanHorario,
    onSuccess: () => qc.invalidateQueries({ queryKey: [PLANS_KEY] }),
  })
}

// ── Converters: zustand Schedule ↔ API PlanHorario ──

export function planToSchedule(plan: PlanHorario): Schedule {
  return {
    id: plan.id,
    name: plan.nombre,
    createdAt: new Date(plan.creadoEn).getTime(),
    updatedAt: new Date(plan.actualizadoEn).getTime(),
    blocks: (plan.bloques as ScheduleBlock[]) ?? [],
    notes: plan.notas ?? '',
  }
}

export function scheduleToPlanBody(schedule: Schedule) {
  return {
    nombre: schedule.name,
    bloques: schedule.blocks,
    notas: schedule.notes || null,
  }
}
