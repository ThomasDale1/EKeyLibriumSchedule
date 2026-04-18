import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { Professor, Room, ScheduleBlock, Subject } from './types'
import { DEFAULT_DURATION_SLOTS, MIN_DURATION_SLOTS, TOTAL_SLOTS } from './constants'

let uidCounter = 1000
const nextId = (prefix = 'b') => `${prefix}${Date.now().toString(36)}${++uidCounter}`

export type Schedule = {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  blocks: ScheduleBlock[]
  notes: string
}

type State = {
  schedules: Schedule[]
  activeScheduleId: string
  subjects: Subject[]
  professors: Professor[]
  rooms: Room[]
  selectedBlockId: string | null
  cicloFilter: number | null
}

type Actions = {
  selectBlock: (id: string | null) => void
  moveBlock: (id: string, day: number, startSlot: number) => void
  resizeBlock: (id: string, duration: number) => void
  addBlockFromSubject: (subjectId: string, day: number, startSlot: number) => void
  duplicateBlock: (id: string, day: number, startSlot: number) => void
  addBlocksRaw: (blocks: ScheduleBlock[]) => void
  updateBlock: (id: string, patch: Partial<ScheduleBlock>) => void
  toggleLock: (id: string) => void
  removeBlock: (id: string) => void
  setCicloFilter: (ciclo: number | null) => void

  setSubjects: (subjects: Subject[]) => void
  setProfessors: (professors: Professor[]) => void
  setRooms: (rooms: Room[]) => void

  // Schedule management
  createSchedule: (name?: string, copyFromId?: string) => string
  renameSchedule: (id: string, name: string) => void
  deleteSchedule: (id: string) => void
  setActiveSchedule: (id: string) => void
  setScheduleNotes: (id: string, notes: string) => void
}

const DEFAULT_SCHEDULE_ID = 'sched-default'

function makeDefaultSchedule(): Schedule {
  return {
    id: DEFAULT_SCHEDULE_ID,
    name: 'v1 · Plan inicial',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    blocks: [],
    notes: '',
  }
}

const STORAGE_KEY = 'ekeylibrium:scheduler:v1'

export const useScheduleStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      subjects: [],
      professors: [],
      rooms: [],
      schedules: [makeDefaultSchedule()],
      activeScheduleId: DEFAULT_SCHEDULE_ID,
      selectedBlockId: null,
      cicloFilter: null,

      selectBlock: (id) => set({ selectedBlockId: id }),

      moveBlock: (id, day, startSlot) =>
        set((state) =>
          mutateActiveBlocks(state, (blocks) =>
            blocks.map((b) => {
              if (b.id !== id || b.locked) return b
              return { ...b, day: clampDay(day), startSlot: clampStart(startSlot, b.duration) }
            })
          )
        ),

      resizeBlock: (id, duration) =>
        set((state) =>
          mutateActiveBlocks(state, (blocks) =>
            blocks.map((b) => {
              if (b.id !== id || b.locked) return b
              const maxDur = TOTAL_SLOTS - b.startSlot
              const next = Math.max(MIN_DURATION_SLOTS, Math.min(maxDur, duration))
              return { ...b, duration: next }
            })
          )
        ),

      addBlockFromSubject: (subjectId, day, startSlot) =>
        set((state) => {
          const subject = state.subjects.find((s) => s.id === subjectId)
          if (!subject) return state
          const duration = DEFAULT_DURATION_SLOTS
          const active = state.schedules.find((s) => s.id === state.activeScheduleId)
          const sectionCount = active?.blocks.filter((b) => b.subjectId === subjectId).length ?? 0
          const block: ScheduleBlock = {
            id: nextId('b'),
            subjectId,
            sectionLabel: String(sectionCount + 1).padStart(2, '0'),
            professorId: null,
            roomId: null,
            day: clampDay(day),
            startSlot: clampStart(startSlot, duration),
            duration,
            locked: false,
            studentsExpected: 25,
          }
          return {
            ...mutateActiveBlocks(state, (blocks) => [...blocks, block]),
            selectedBlockId: block.id,
          }
        }),

      duplicateBlock: (id, day, startSlot) =>
        set((state) => {
          const active = state.schedules.find((s) => s.id === state.activeScheduleId)
          const src = active?.blocks.find((b) => b.id === id)
          if (!src) return state
          const copy: ScheduleBlock = {
            ...src,
            id: nextId('b'),
            day: clampDay(day),
            startSlot: clampStart(startSlot, src.duration),
            locked: false,
          }
          return {
            ...mutateActiveBlocks(state, (blocks) => [...blocks, copy]),
            selectedBlockId: copy.id,
          }
        }),

      addBlocksRaw: (newBlocks) =>
        set((state) => mutateActiveBlocks(state, (blocks) => [...blocks, ...newBlocks])),

      updateBlock: (id, patch) =>
        set((state) =>
          mutateActiveBlocks(state, (blocks) =>
            blocks.map((b) => {
              if (b.id !== id) return b
              if (b.locked) {
                const { day: _d, startSlot: _s, duration: _dur, ...safe } = patch
                return { ...b, ...safe }
              }
              return { ...b, ...patch }
            })
          )
        ),

      toggleLock: (id) =>
        set((state) =>
          mutateActiveBlocks(state, (blocks) =>
            blocks.map((b) => (b.id === id ? { ...b, locked: !b.locked } : b))
          )
        ),

      removeBlock: (id) =>
        set((state) => ({
          ...mutateActiveBlocks(state, (blocks) => blocks.filter((b) => b.id !== id)),
          selectedBlockId: state.selectedBlockId === id ? null : state.selectedBlockId,
        })),

      setCicloFilter: (ciclo) => set({ cicloFilter: ciclo }),

      setSubjects: (subjects) => set({ subjects }),
      setProfessors: (professors) => set({ professors }),
      setRooms: (rooms) => set({ rooms }),

      createSchedule: (name, copyFromId) => {
        const id = nextId('local_')
        set((state) => {
          const source = copyFromId
            ? state.schedules.find((s) => s.id === copyFromId)
            : state.schedules.find((s) => s.id === state.activeScheduleId)
          const blocks = source
            ? source.blocks.map((b) => ({ ...b, id: nextId('b'), locked: false }))
            : []
          const defaultName = name ?? `v${state.schedules.length + 1} · Nueva versión`
          const schedule: Schedule = {
            id,
            name: defaultName,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            blocks,
            notes: '',
          }
          return {
            schedules: [...state.schedules, schedule],
            activeScheduleId: id,
            selectedBlockId: null,
          }
        })
        return id
      },

      renameSchedule: (id, name) =>
        set((state) => ({
          schedules: state.schedules.map((s) =>
            s.id === id ? { ...s, name, updatedAt: Date.now() } : s
          ),
        })),

      deleteSchedule: (id) => {
        const state = get()
        if (state.schedules.length <= 1) return
        set((prev) => {
          const remaining = prev.schedules.filter((s) => s.id !== id)
          const nextActive = prev.activeScheduleId === id ? remaining[0].id : prev.activeScheduleId
          return {
            schedules: remaining,
            activeScheduleId: nextActive,
            selectedBlockId: null,
          }
        })
      },

      setActiveSchedule: (id) =>
        set((state) => {
          if (!state.schedules.some((s) => s.id === id)) return state
          return { activeScheduleId: id, selectedBlockId: null }
        }),

      setScheduleNotes: (id, notes) =>
        set((state) => ({
          schedules: state.schedules.map((s) =>
            s.id === id ? { ...s, notes, updatedAt: Date.now() } : s
          ),
        })),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      migrate: (state, version) => {
        if (version === 0 || !state) {
          return {
            schedules: [makeDefaultSchedule()],
            activeScheduleId: DEFAULT_SCHEDULE_ID,
            cicloFilter: null,
          } as unknown as State & Actions
        }
        // Validate schedules array is not empty
        const schedules = (state as any).schedules ?? []
        if (schedules.length === 0) {
          return {
            ...state,
            schedules: [makeDefaultSchedule()],
            activeScheduleId: DEFAULT_SCHEDULE_ID,
          } as unknown as State & Actions
        }
        // Validate activeScheduleId exists in schedules
        const activeId = (state as any).activeScheduleId
        if (!schedules.some((s: Schedule) => s.id === activeId)) {
          return {
            ...state,
            activeScheduleId: schedules[0].id,
          } as unknown as State & Actions
        }
        return state as unknown as State & Actions
      },
      partialize: (s) => ({
        schedules: s.schedules,
        activeScheduleId: s.activeScheduleId,
        cicloFilter: s.cicloFilter,
      }),
    }
  )
)

// ── Selectors ───────────────────────────────────────────────────────

export function selectActiveSchedule(s: State): Schedule {
  const found = s.schedules.find((sch) => sch.id === s.activeScheduleId)
  if (found) return found
  if (s.schedules.length > 0) return s.schedules[0]
  return makeDefaultSchedule()
}

export function useActiveSchedule(): Schedule {
  return useScheduleStore((s) => {
    const found = s.schedules.find((sch) => sch.id === s.activeScheduleId)
    if (found) return found
    if (s.schedules.length > 0) return s.schedules[0]
    return makeDefaultSchedule()
  })
}

// ── Helpers ─────────────────────────────────────────────────────────

function mutateActiveBlocks(state: State, fn: (blocks: ScheduleBlock[]) => ScheduleBlock[]): Partial<State> {
  const schedules = state.schedules.map((sch) => {
    if (sch.id !== state.activeScheduleId) return sch
    return { ...sch, blocks: fn(sch.blocks), updatedAt: Date.now() }
  })
  return { schedules }
}

function clampDay(day: number) {
  return Math.max(0, Math.min(5, day))
}
function clampStart(start: number, duration: number) {
  return Math.max(0, Math.min(TOTAL_SLOTS - duration, start))
}
