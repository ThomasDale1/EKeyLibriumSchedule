import type { Room, ScheduleBlock, Subject } from './types'
import { DEFAULT_DURATION_SLOTS, TOTAL_SLOTS } from './constants'

let uidCounter = 5000
const nextId = () => `ab${Date.now().toString(36)}${++uidCounter}`

export type AutoSectionInput = {
  subjectId: string
  demand: number
}

export type AutoSectionResult = {
  subjectId: string
  sectionCount: number
  perSection: number
  distribution: number[]
  reason: string
}

export function suggestSectionCount(demand: number, targetCapacity: number): number {
  if (demand <= 0) return 0
  return Math.max(1, Math.ceil(demand / Math.max(1, targetCapacity)))
}

export function balancedDistribution(total: number, sections: number): number[] {
  if (sections <= 0) return []
  const base = Math.floor(total / sections)
  const remainder = total % sections
  return Array.from({ length: sections }, (_, i) => base + (i < remainder ? 1 : 0))
}

export function planAutoSections(
  inputs: AutoSectionInput[],
  subjects: Subject[],
  rooms: Room[],
  existingBlocks: ScheduleBlock[]
): AutoSectionResult[] {
  const subjectById = new Map(subjects.map((s) => [s.id, s]))

  return inputs.map((input) => {
    const subject = subjectById.get(input.subjectId)
    if (!subject || input.demand <= 0) {
      return { subjectId: input.subjectId, sectionCount: 0, perSection: 0, distribution: [], reason: 'Sin demanda' }
    }

    const eligibleRooms = rooms.filter((r) => r.tipo === subject.tipoAula)
    const avgCap = eligibleRooms.length > 0
      ? Math.round(eligibleRooms.reduce((s, r) => s + r.capacidad, 0) / eligibleRooms.length)
      : 30

    const sectionCount = suggestSectionCount(input.demand, avgCap)
    const distribution = balancedDistribution(input.demand, sectionCount)
    const perSection = Math.ceil(input.demand / sectionCount)
    const existing = existingBlocks.filter((b) => b.subjectId === input.subjectId).length

    return {
      subjectId: input.subjectId,
      sectionCount,
      perSection,
      distribution,
      reason: existing > 0
        ? `Cap. prom. ${avgCap} · ${existing} sección(es) ya existen · Dist: [${distribution.join(', ')}]`
        : `Cap. prom. ${avgCap} · Dist: [${distribution.join(', ')}]`,
    }
  })
}

const DAYS_PER_WEEK = 6

export function generateAutoSectionBlocks(
  results: AutoSectionResult[],
  existingBlocks: ScheduleBlock[]
): ScheduleBlock[] {
  const newBlocks: ScheduleBlock[] = []

  for (const r of results) {
    if (r.sectionCount === 0) continue
    const existing = existingBlocks.filter((b) => b.subjectId === r.subjectId).length

    for (let i = 0; i < r.sectionCount; i++) {
      const sectionNum = existing + i + 1
      const dayIdx = i % DAYS_PER_WEEK
      const maxSlotsPerDay = Math.floor(TOTAL_SLOTS / DEFAULT_DURATION_SLOTS)
      const slotIndex = Math.floor(i / DAYS_PER_WEEK) % maxSlotsPerDay
      const startSlot = Math.min(TOTAL_SLOTS - DEFAULT_DURATION_SLOTS, slotIndex * DEFAULT_DURATION_SLOTS)
      newBlocks.push({
        id: nextId(),
        subjectId: r.subjectId,
        sectionLabel: String(sectionNum).padStart(2, '0'),
        professorId: null,
        roomId: null,
        day: dayIdx,
        startSlot,
        duration: DEFAULT_DURATION_SLOTS,
        locked: false,
        studentsExpected: r.distribution[i] ?? r.perSection,
      })
    }
  }
  return newBlocks
}
