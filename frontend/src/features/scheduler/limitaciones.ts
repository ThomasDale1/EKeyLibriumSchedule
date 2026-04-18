import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type NotaGlobal = {
  id: string
  text: string
}

export type Limitaciones = {
  incluirSabado: boolean
  horaInicioMin: string
  horaFinMax: string
  parqueoMax: number

  usarSalones: boolean
  usarProfesores: boolean

  apartarAtrasados: boolean
  apartarDiscapacitados: boolean

  dividirSeccionesEspeciales: boolean

  obedecerNotasMateria: boolean
  respetarBloquesLock: boolean

  duracionesPermitidas: number[]

  maxSeccionesPorMateria: number | null

  maxHorasConsecutivas: number | null
  descansoMinSlots: number
  bloquearAlmuerzo: boolean
  bloquearDesayuno: boolean
  maxBloquesPorDiaPorMateria: number | null

  notasGlobales: NotaGlobal[]
}

const DEFAULT_LIMITACIONES: Limitaciones = {
  incluirSabado: false,
  horaInicioMin: '07:00',
  horaFinMax: '21:00',
  parqueoMax: 0,

  usarSalones: true,
  usarProfesores: true,

  apartarAtrasados: false,
  apartarDiscapacitados: false,

  dividirSeccionesEspeciales: false,

  obedecerNotasMateria: true,
  respetarBloquesLock: true,

  duracionesPermitidas: [2, 3, 4, 5, 6],

  maxSeccionesPorMateria: null,

  maxHorasConsecutivas: null,
  descansoMinSlots: 0,
  bloquearAlmuerzo: false,
  bloquearDesayuno: false,
  maxBloquesPorDiaPorMateria: null,

  notasGlobales: [],
}

type LimitacionesStore = {
  limitaciones: Limitaciones
  setLimitaciones: (patch: Partial<Limitaciones>) => void
  resetLimitaciones: () => void
  addNota: (nota: string) => void
  removeNota: (id: string) => void
}

export const useLimitacionesStore = create<LimitacionesStore>()(
  persist(
    (set) => ({
      limitaciones: { ...DEFAULT_LIMITACIONES },
      setLimitaciones: (patch) =>
        set((s) => ({ limitaciones: { ...s.limitaciones, ...patch } })),
      resetLimitaciones: () =>
        set({ limitaciones: { ...DEFAULT_LIMITACIONES } }),
      addNota: (nota) =>
        set((s) => ({
          limitaciones: {
            ...s.limitaciones,
            notasGlobales: [
              ...s.limitaciones.notasGlobales,
              {
                id: typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
                  ? crypto.randomUUID()
                  : `n-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
                text: nota,
              },
            ],
          },
        })),
      removeNota: (id) =>
        set((s) => ({
          limitaciones: {
            ...s.limitaciones,
            notasGlobales: s.limitaciones.notasGlobales.filter((nota) => nota.id !== id),
          },
        })),
    }),
    {
      name: 'ekeylibrium:limitaciones:v1',
      storage: createJSONStorage(() => localStorage),
      merge: (persisted, current) => {
        const ps = persisted as Partial<LimitacionesStore> | undefined
        const persistedLimitaciones = (ps?.limitaciones ?? {}) as Partial<Limitaciones>
        const persistedNotas = Array.isArray(persistedLimitaciones.notasGlobales)
          ? persistedLimitaciones.notasGlobales.map((nota) =>
              typeof nota === 'string'
                ? {
                    id:
                      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
                        ? crypto.randomUUID()
                        : `n-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
                    text: nota,
                  }
                : nota
            )
          : []
        return {
          ...current,
          limitaciones: {
            ...DEFAULT_LIMITACIONES,
            ...persistedLimitaciones,
            notasGlobales: persistedNotas,
          },
        } as LimitacionesStore
      },
    },
  ),
)
