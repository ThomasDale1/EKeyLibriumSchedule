import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type PrioridadId =
  | 'desayuno_libre'
  | 'almuerzo_libre'
  | 'salir_temprano'
  | 'menos_huecos'
  | 'salidas_variadas'
  | 'bloques_libres_variados'
  | 'optimizar_costos'
  | 'inscripcion_completa'
  | 'salones_optimos'
  | 'minimizar_cambio_edificio'
  | 'balancear_carga_profesor'
  | 'preferir_manana'
  | 'minimizar_dias_campus'
  | 'max_compacto'

export type PrioridadInfo = {
  id: PrioridadId
  label: string
  description: string
  critical?: boolean
}

export const PRIORIDADES_CATALOG: PrioridadInfo[] = [
  { id: 'inscripcion_completa', label: 'Inscripción completa', description: 'Garantizar que todos los estudiantes puedan inscribir todas sus materias', critical: true },
  { id: 'desayuno_libre', label: 'Bloque desayuno libre', description: 'No asignar clases en horario de desayuno (7:00–8:00)' },
  { id: 'almuerzo_libre', label: 'Bloque almuerzo libre', description: 'No asignar clases en horario de almuerzo (12:00–13:00)' },
  { id: 'salir_temprano', label: 'Salir temprano', description: 'Concentrar bloques al inicio del día' },
  { id: 'menos_huecos', label: 'Menos huecos', description: 'Minimizar tiempos muertos entre clases' },
  { id: 'salidas_variadas', label: 'Salidas variadas', description: 'Variar las horas de salida entre días' },
  { id: 'bloques_libres_variados', label: 'Bloques libres variados', description: 'Distribuir tiempos libres uniformemente' },
  { id: 'optimizar_costos', label: 'Optimizar costos', description: 'Minimizar uso de aulas costosas y horas extras' },
  { id: 'salones_optimos', label: 'Salones óptimos', description: 'Asignar aulas del tipo correcto y capacidad justa' },
  { id: 'minimizar_cambio_edificio', label: 'Minimizar cambio de edificio', description: 'Evitar que profesores y estudiantes cambien de edificio entre clases consecutivas' },
  { id: 'balancear_carga_profesor', label: 'Balancear carga docente', description: 'Distribuir horas de profesores uniformemente entre días' },
  { id: 'preferir_manana', label: 'Preferir mañana', description: 'Concentrar clases en horario matutino (7:00–12:00)' },
  { id: 'minimizar_dias_campus', label: 'Minimizar días en campus', description: 'Reducir el número de días que profesores y estudiantes asisten' },
  { id: 'max_compacto', label: 'Horario compacto', description: 'Eliminar huecos entre bloques para un horario sin tiempos muertos' },
]

export type PrioridadMode = 'stack' | 'weights'

export type PrioridadesState = {
  mode: PrioridadMode
  stack: PrioridadId[]
  weights: Record<PrioridadId, number>
}

type PrioridadesActions = {
  setMode: (mode: PrioridadMode) => void
  setStack: (stack: PrioridadId[]) => void
  moveStackItem: (from: number, to: number) => void
  setWeight: (id: PrioridadId, weight: number) => void
  resetPrioridades: () => void
}

const DEFAULT_STACK: PrioridadId[] = [
  'inscripcion_completa',
  'salir_temprano',
  'menos_huecos',
  'salones_optimos',
  'optimizar_costos',
  'almuerzo_libre',
  'desayuno_libre',
  'balancear_carga_profesor',
  'minimizar_cambio_edificio',
  'preferir_manana',
  'max_compacto',
  'minimizar_dias_campus',
  'salidas_variadas',
  'bloques_libres_variados',
]

const DEFAULT_WEIGHTS: Record<PrioridadId, number> = {
  inscripcion_completa: 0.25,
  salir_temprano: 0.12,
  menos_huecos: 0.12,
  salones_optimos: 0.08,
  optimizar_costos: 0.08,
  almuerzo_libre: 0.05,
  desayuno_libre: 0.05,
  balancear_carga_profesor: 0.05,
  minimizar_cambio_edificio: 0.05,
  preferir_manana: 0.03,
  max_compacto: 0.03,
  minimizar_dias_campus: 0.03,
  salidas_variadas: 0.03,
  bloques_libres_variados: 0.03,
}

export const usePrioridadesStore = create<PrioridadesState & PrioridadesActions>()(
  persist(
    (set) => ({
      mode: 'stack' as PrioridadMode,
      stack: [...DEFAULT_STACK],
      weights: { ...DEFAULT_WEIGHTS },

      setMode: (mode) => set({ mode }),

      setStack: (stack) => set({ stack }),

      moveStackItem: (from, to) =>
        set((s) => {
          const arr = [...s.stack]
          const [item] = arr.splice(from, 1)
          arr.splice(to, 0, item)
          return { stack: arr }
        }),

      setWeight: (id, weight) =>
        set((s) => ({
          weights: { ...s.weights, [id]: Math.max(0, Math.min(1, weight)) },
        })),

      resetPrioridades: () =>
        set({ stack: [...DEFAULT_STACK], weights: { ...DEFAULT_WEIGHTS }, mode: 'stack' }),
    }),
    {
      name: 'ekeylibrium:prioridades:v1',
      storage: createJSONStorage(() => localStorage),
      merge: (persisted, current) => {
        const ps = persisted as Partial<PrioridadesState> | undefined
        const catalogIds = PRIORIDADES_CATALOG.map((p) => p.id)
        const catalogSet = new Set(catalogIds)
        const existingStack = (ps?.stack ?? []).filter((id) => catalogSet.has(id))
        const missing = catalogIds.filter((id) => !existingStack.includes(id))
        const weights = { ...DEFAULT_WEIGHTS }
        if (ps?.weights) {
          for (const [id, w] of Object.entries(ps.weights)) {
            if (catalogSet.has(id as PrioridadId)) weights[id as PrioridadId] = w
          }
        }
        return {
          ...(current as PrioridadesState & PrioridadesActions),
          mode: ps?.mode ?? 'stack',
          stack: [...existingStack, ...missing],
          weights,
        }
      },
    },
  ),
)
