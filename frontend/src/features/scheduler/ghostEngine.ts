import type { GhostBlock, GhostStep, GhostSuggestion, Professor, Room, ScheduleBlock, Subject, GhostAction } from './types'
import type { ValidationItem } from './validation'
import type { Limitaciones } from './limitaciones'
import { DAYS, SLOT_MINUTES, SLOTS_PER_HOUR, START_HOUR, TOTAL_SLOTS } from './constants'

let ghostUid = 9000
const nextGhostId = () => `ghost-${Date.now().toString(36)}${++ghostUid}`
let sugId = 0
const nextSugId = () => `sug-${++sugId}`

function timeToSlot(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return Math.max(0, (h - START_HOUR) * SLOTS_PER_HOUR + Math.floor(m / SLOT_MINUTES))
}

function slotToTimeStr(slot: number): string {
  const totalMinutes = START_HOUR * 60 + slot * SLOT_MINUTES
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function normalizeString(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function buildOccupancyGrid(blocks: ScheduleBlock[]): boolean[][] {
  const grid: boolean[][] = Array.from({ length: 6 }, () => Array(TOTAL_SLOTS).fill(false))
  for (const b of blocks) {
    for (let s = b.startSlot; s < b.startSlot + b.duration && s < TOTAL_SLOTS; s++) {
      if (b.day >= 0 && b.day < 6) grid[b.day][s] = true
    }
  }
  return grid
}

function buildProfOccupancy(blocks: ScheduleBlock[]): Map<string, boolean[][]> {
  const map = new Map<string, boolean[][]>()
  for (const b of blocks) {
    if (!b.professorId) continue
    if (!map.has(b.professorId)) {
      map.set(b.professorId, Array.from({ length: 6 }, () => Array(TOTAL_SLOTS).fill(false)))
    }
    const grid = map.get(b.professorId)!
    for (let s = b.startSlot; s < b.startSlot + b.duration && s < TOTAL_SLOTS; s++) {
      if (b.day >= 0 && b.day < 6) grid[b.day][s] = true
    }
  }
  return map
}

function buildRoomOccupancy(blocks: ScheduleBlock[]): Map<string, boolean[][]> {
  const map = new Map<string, boolean[][]>()
  for (const b of blocks) {
    if (!b.roomId) continue
    if (!map.has(b.roomId)) {
      map.set(b.roomId, Array.from({ length: 6 }, () => Array(TOTAL_SLOTS).fill(false)))
    }
    const grid = map.get(b.roomId)!
    for (let s = b.startSlot; s < b.startSlot + b.duration && s < TOTAL_SLOTS; s++) {
      if (b.day >= 0 && b.day < 6) grid[b.day][s] = true
    }
  }
  return map
}

function findFreeSlot(
  occupancy: boolean[][],
  duration: number,
  limitaciones: Limitaciones,
  excludeDays?: Set<number>,
  preferDay?: number,
): { day: number; startSlot: number } | null {
  const minSlot = timeToSlot(limitaciones.horaInicioMin)
  const maxSlot = Math.min(TOTAL_SLOTS, timeToSlot(limitaciones.horaFinMax)) - duration
  const maxDay = limitaciones.incluirSabado ? 6 : 5

  const days: number[] = []
  if (preferDay != null && preferDay < maxDay && !excludeDays?.has(preferDay)) days.push(preferDay)
  for (let d = 0; d < maxDay; d++) {
    if (d !== preferDay && !excludeDays?.has(d)) days.push(d)
  }

  const lunchStart = (12 - START_HOUR) * SLOTS_PER_HOUR
  const lunchEnd = (13 - START_HOUR) * SLOTS_PER_HOUR
  const bfEnd = (8 - START_HOUR) * SLOTS_PER_HOUR

  for (const day of days) {
    for (let start = minSlot; start <= maxSlot && start >= 0; start++) {
      let free = true
      for (let s = start; s < start + duration; s++) {
        if (occupancy[day]?.[s]) { free = false; break }
      }
      if (free && limitaciones.bloquearAlmuerzo) {
        if (start < lunchEnd && start + duration > lunchStart) free = false
      }
      if (free && limitaciones.bloquearDesayuno) {
        if (start < bfEnd && start + duration > 0) free = false
      }
      if (free) return { day, startSlot: start }
    }
  }
  return null
}

function findAvailableRoom(
  rooms: Room[],
  roomOccupancy: Map<string, boolean[][]>,
  day: number,
  startSlot: number,
  duration: number,
  tipoAula: string,
  minCapacity: number,
): Room | null {
  const candidates = rooms
    .filter((r) => r.tipo === tipoAula && r.capacidad >= minCapacity)
    .sort((a, b) => a.capacidad - b.capacidad)

  for (const room of candidates) {
    const grid = roomOccupancy.get(room.id)
    if (!grid) return room
    let free = true
    for (let s = startSlot; s < startSlot + duration; s++) {
      if (grid[day]?.[s]) { free = false; break }
    }
    if (free) return room
  }
  return null
}

function findAvailableProfessor(
  professors: Professor[],
  blocks: ScheduleBlock[],
  profOccupancy: Map<string, boolean[][]>,
  day: number,
  startSlot: number,
  duration: number,
): Professor | null {
  const weeklyHours = new Map<string, number>()
  for (const b of blocks) {
    if (b.professorId) {
      weeklyHours.set(b.professorId, (weeklyHours.get(b.professorId) ?? 0) + b.duration * SLOT_MINUTES / 60)
    }
  }

  const candidates = professors
    .map((p) => ({ prof: p, remaining: p.maxHorasSemana - (weeklyHours.get(p.id) ?? 0) }))
    .filter((c) => c.remaining > 0)
    .sort((a, b) => b.remaining - a.remaining)

  for (const { prof } of candidates) {
    const grid = profOccupancy.get(prof.id)
    if (!grid) return prof
    let free = true
    for (let s = startSlot; s < startSlot + duration; s++) {
      if (grid[day]?.[s]) { free = false; break }
    }
    if (free) {
      const dailySlots = grid[day]?.filter(Boolean).length ?? 0
      if ((dailySlots + duration) * SLOT_MINUTES / 60 <= prof.maxHorasDia) return prof
    }
  }
  return null
}

function makeGhostBlock(
  base: Partial<ScheduleBlock> & { subjectId: string; day: number; startSlot: number; duration: number },
  action: GhostAction,
  originalBlockId?: string,
): GhostBlock {
  return {
    id: nextGhostId(),
    subjectId: base.subjectId,
    sectionLabel: base.sectionLabel ?? '??',
    professorId: base.professorId ?? null,
    roomId: base.roomId ?? null,
    day: base.day,
    startSlot: base.startSlot,
    duration: base.duration,
    locked: false,
    studentsExpected: base.studentsExpected ?? 25,
    ghost: true,
    action,
    originalBlockId,
  }
}

export function generateGhostSuggestions(
  items: ValidationItem[],
  blocks: ScheduleBlock[],
  subjects: Subject[],
  professors: Professor[],
  rooms: Room[],
  limitaciones: Limitaciones,
): GhostSuggestion[] {
  const suggestions: GhostSuggestion[] = []
  const subjectById = new Map(subjects.map((s) => [s.id, s]))
  const profById = new Map(professors.map((p) => [p.id, p]))
  const roomById = new Map(rooms.map((r) => [r.id, r]))
  const profOccupancy = buildProfOccupancy(blocks)
  const roomOccupancy = buildRoomOccupancy(blocks)
  const globalOccupancy = buildOccupancyGrid(blocks)

  for (const item of items) {
    // --- Capacity exceeded ---
    if (item.category === 'Capacidad excedida' && item.blockIds?.length) {
      for (const blockId of item.blockIds) {
        const block = blocks.find((b) => b.id === blockId)
        if (!block) continue
        const subject = subjectById.get(block.subjectId)
        if (!subject) continue
        const betterRoom = findAvailableRoom(
          rooms, roomOccupancy, block.day, block.startSlot, block.duration,
          subject.tipoAula, block.studentsExpected,
        )
        if (betterRoom) {
          const ghost = makeGhostBlock({ ...block, roomId: betterRoom.id }, 'reassign-room', block.id)
          suggestions.push({
            id: nextSugId(),
            title: `Cambiar aula de ${subject.codigo} §${block.sectionLabel}`,
            description: `El aula actual no tiene capacidad suficiente para ${block.studentsExpected} estudiantes.`,
            severity: item.severity,
            category: item.category,
            steps: [{
              order: 1,
              instruction: `Cambiar aula de ${subject.codigo} §${block.sectionLabel}`,
              detail: `Aula actual: ${block.roomId ? roomById.get(block.roomId)?.codigo ?? '?' : 'ninguna'} (cap. ${block.roomId ? roomById.get(block.roomId)?.capacidad ?? '?' : '?'}) → Nueva: ${betterRoom.codigo} (cap. ${betterRoom.capacidad}, ${betterRoom.tipo}) en edificio ${betterRoom.edificio}. Se necesitan ${block.studentsExpected} cupos.`,
              ghostBlockIds: [ghost.id],
              existingBlockIds: [block.id],
            }],
            ghostBlocks: [ghost],
          })
        }
      }
    }

    // --- Room type mismatch ---
    if (item.category === 'Tipo de aula' && item.blockIds?.length) {
      for (const blockId of item.blockIds) {
        const block = blocks.find((b) => b.id === blockId)
        if (!block) continue
        const subject = subjectById.get(block.subjectId)
        if (!subject) continue
        const correctRoom = findAvailableRoom(
          rooms, roomOccupancy, block.day, block.startSlot, block.duration,
          subject.tipoAula, block.studentsExpected,
        )
        if (correctRoom) {
          const ghost = makeGhostBlock({ ...block, roomId: correctRoom.id }, 'reassign-room', block.id)
          const currentRoom = block.roomId ? roomById.get(block.roomId) : null
          suggestions.push({
            id: nextSugId(),
            title: `Corregir tipo de aula: ${subject.codigo} §${block.sectionLabel}`,
            description: `Requiere ${subject.tipoAula}, actualmente en aula de tipo ${currentRoom?.tipo ?? '?'}.`,
            severity: item.severity,
            category: item.category,
            steps: [{
              order: 1,
              instruction: `Cambiar a aula de tipo ${subject.tipoAula}`,
              detail: `Mover de ${currentRoom?.codigo ?? '?'} (${currentRoom?.tipo ?? '?'}) a ${correctRoom.codigo} (${correctRoom.tipo}, cap. ${correctRoom.capacidad}) en edificio ${correctRoom.edificio}. ${DAYS[block.day]} ${slotToTimeStr(block.startSlot)}–${slotToTimeStr(block.startSlot + block.duration)}.`,
              ghostBlockIds: [ghost.id],
              existingBlockIds: [block.id],
            }],
            ghostBlocks: [ghost],
          })
        }
      }
    }

    // --- Unassigned professor ---
    if (item.category === 'Sin profesor' && item.blockIds?.length) {
      const steps: GhostStep[] = []
      const ghosts: GhostBlock[] = []
      for (const blockId of item.blockIds) {
        const block = blocks.find((b) => b.id === blockId)
        if (!block) continue
        const subject = subjectById.get(block.subjectId)
        if (!subject) continue
        const prof = findAvailableProfessor(professors, blocks, profOccupancy, block.day, block.startSlot, block.duration)
        if (prof) {
          const ghost = makeGhostBlock({ ...block, professorId: prof.id }, 'reassign-professor', block.id)
          ghosts.push(ghost)
          steps.push({
            order: steps.length + 1,
            instruction: `Asignar ${prof.nombre} ${prof.apellido} a ${subject.codigo} §${block.sectionLabel}`,
            detail: `${DAYS[block.day]} ${slotToTimeStr(block.startSlot)}–${slotToTimeStr(block.startSlot + block.duration)}. Prof. ${prof.nombre} ${prof.apellido} (${prof.codigo}) tiene disponibilidad en ese horario y capacidad semanal restante.`,
            ghostBlockIds: [ghost.id],
            existingBlockIds: [block.id],
          })
        }
      }
      if (steps.length > 0) {
        suggestions.push({
          id: nextSugId(),
          title: `Asignar profesores a ${steps.length} bloque(s)`,
          description: `Se sugieren profesores con disponibilidad y capacidad semanal.`,
          severity: item.severity,
          category: item.category,
          steps,
          ghostBlocks: ghosts,
        })
      }
    }

    // --- Unassigned room ---
    if (item.category === 'Sin aula' && item.blockIds?.length) {
      const steps: GhostStep[] = []
      const ghosts: GhostBlock[] = []
      for (const blockId of item.blockIds) {
        const block = blocks.find((b) => b.id === blockId)
        if (!block) continue
        const subject = subjectById.get(block.subjectId)
        if (!subject) continue
        const room = findAvailableRoom(rooms, roomOccupancy, block.day, block.startSlot, block.duration, subject.tipoAula, block.studentsExpected)
        if (room) {
          const ghost = makeGhostBlock({ ...block, roomId: room.id }, 'reassign-room', block.id)
          ghosts.push(ghost)
          steps.push({
            order: steps.length + 1,
            instruction: `Asignar ${room.codigo} a ${subject.codigo} §${block.sectionLabel}`,
            detail: `${DAYS[block.day]} ${slotToTimeStr(block.startSlot)}–${slotToTimeStr(block.startSlot + block.duration)}. Aula ${room.codigo} — ${room.nombre} (${room.tipo}, cap. ${room.capacidad}) en edificio ${room.edificio}.`,
            ghostBlockIds: [ghost.id],
            existingBlockIds: [block.id],
          })
        }
      }
      if (steps.length > 0) {
        suggestions.push({
          id: nextSugId(),
          title: `Asignar aulas a ${steps.length} bloque(s)`,
          description: `Aulas del tipo correcto con capacidad suficiente y disponibilidad.`,
          severity: item.severity,
          category: item.category,
          steps,
          ghostBlocks: ghosts,
        })
      }
    }

    // --- Incomplete hours ---
    if (item.category === 'Horas incompletas' && item.subjectId) {
      const subject = subjectById.get(item.subjectId)
      if (!subject) continue
      const requiredSlots = subject.horasSemanales * (60 / SLOT_MINUTES)
      const existingBlocks = blocks.filter((b) => b.subjectId === subject.id)
      const currentSlots = existingBlocks.reduce((s, b) => s + b.duration, 0)
      const missingSlots = requiredSlots - currentSlots

      if (missingSlots > 0) {
        const steps: GhostStep[] = []
        const ghosts: GhostBlock[] = []
        let remaining = missingSlots
        const sectionCount = existingBlocks.length
        const tempOccupancy = globalOccupancy.map((day) => [...day])
        let attempts = 0

        const allowedDurations = limitaciones.duracionesPermitidas.length > 0
          ? [...limitaciones.duracionesPermitidas].sort((a, b) => b - a)
          : [6, 5, 4, 3, 2]

        while (remaining > 0 && attempts < 10) {
          const dur = allowedDurations.find((d) => d <= remaining)
          if (!dur) break
          const daysWithSubject = new Set([
            ...existingBlocks.map((b) => b.day),
            ...ghosts.map((g) => g.day),
          ])

          let slot = findFreeSlot(tempOccupancy, dur, limitaciones, daysWithSubject)
          if (!slot) slot = findFreeSlot(tempOccupancy, dur, limitaciones)
          if (!slot) break

          const sectionNum = sectionCount + ghosts.length + 1
          const room = findAvailableRoom(rooms, roomOccupancy, slot.day, slot.startSlot, dur, subject.tipoAula, 25)

          const ghost = makeGhostBlock({
            subjectId: subject.id,
            sectionLabel: String(sectionNum).padStart(2, '0'),
            roomId: room?.id ?? null,
            day: slot.day,
            startSlot: slot.startSlot,
            duration: dur,
            studentsExpected: 25,
          }, 'add')
          ghosts.push(ghost)

          for (let s = slot.startSlot; s < slot.startSlot + dur; s++) {
            tempOccupancy[slot.day][s] = true
            if (room) {
              const roomGrid = roomOccupancy.get(room.id)
              if (roomGrid) roomGrid[slot.day][s] = true
            }
          }

          const roomInfo = room ? `en ${room.codigo} (${room.tipo}, cap. ${room.capacidad})` : '(sin aula sugerida)'
          steps.push({
            order: steps.length + 1,
            instruction: `Agregar ${subject.codigo} §${ghost.sectionLabel} el ${DAYS[slot.day]}`,
            detail: `${DAYS[slot.day]} ${slotToTimeStr(slot.startSlot)}–${slotToTimeStr(slot.startSlot + dur)} ${roomInfo}. Duración: ${(dur * SLOT_MINUTES / 60).toFixed(1)}h. Esto aporta ${(dur * SLOT_MINUTES / 60).toFixed(1)}h de las ${(missingSlots * SLOT_MINUTES / 60).toFixed(1)}h faltantes.`,
            ghostBlockIds: [ghost.id],
            existingBlockIds: [],
          })

          remaining -= dur
          attempts++
        }

        if (steps.length > 0) {
          suggestions.push({
            id: nextSugId(),
            title: `Completar horas de ${subject.codigo}`,
            description: `Faltan ${(missingSlots * SLOT_MINUTES / 60).toFixed(1)}h para alcanzar las ${subject.horasSemanales}h semanales requeridas.`,
            severity: item.severity,
            category: item.category,
            steps,
            ghostBlocks: ghosts,
          })
        }
      }
    }

    // --- Professor weekly overload ---
    if (item.category === 'Sobrecarga profesor') {
      const workingBlocks = [...blocks]
      for (const prof of professors) {
        const normalizedMessage = normalizeString(item.message)
        const normalizedProfName = normalizeString(`${prof.nombre} ${prof.apellido}`)
        const professorMatches = item.professorId
          ? item.professorId === prof.id
          : normalizedMessage.includes(normalizedProfName)
        if (!professorMatches) continue
        const profBlocks = workingBlocks.filter((b) => b.professorId === prof.id)
        const weekSlots = profBlocks.reduce((s, b) => s + b.duration, 0)
        const weekHours = (weekSlots * SLOT_MINUTES) / 60
        if (weekHours <= prof.maxHorasSemana) continue

        const excessSlots = weekSlots - prof.maxHorasSemana * (60 / SLOT_MINUTES)
        const steps: GhostStep[] = []
        const ghosts: GhostBlock[] = []

        const sortedBlocks = [...profBlocks].sort((a, b) => {
          if (a.locked !== b.locked) return a.locked ? 1 : -1
          return b.day - a.day || b.startSlot - a.startSlot
        })

        let slotsToReassign = excessSlots
        for (const block of sortedBlocks) {
          if (slotsToReassign <= 0) break
          if (block.locked) continue
          const subject = subjectById.get(block.subjectId)
          if (!subject) continue

          const newProf = findAvailableProfessor(
            professors.filter((p) => p.id !== prof.id),
            workingBlocks, profOccupancy, block.day, block.startSlot, block.duration,
          )
          if (newProf) {
            const ghost = makeGhostBlock({ ...block, professorId: newProf.id }, 'reassign-professor', block.id)
            ghosts.push(ghost)
            steps.push({
              order: steps.length + 1,
              instruction: `Reasignar ${subject.codigo} §${block.sectionLabel} a ${newProf.nombre} ${newProf.apellido}`,
              detail: `${DAYS[block.day]} ${slotToTimeStr(block.startSlot)}–${slotToTimeStr(block.startSlot + block.duration)}. Quitar de ${prof.nombre} ${prof.apellido} (sobrecargado) y asignar a ${newProf.nombre} ${newProf.apellido} (${newProf.codigo}), que tiene ${newProf.maxHorasSemana}h/sem de capacidad.`,
              ghostBlockIds: [ghost.id],
              existingBlockIds: [block.id],
            })
            slotsToReassign -= block.duration
            const grid = profOccupancy.get(newProf.id) ?? Array.from({ length: 6 }, () => Array(TOTAL_SLOTS).fill(false))
            if (!profOccupancy.has(newProf.id)) profOccupancy.set(newProf.id, grid)
            for (let s = block.startSlot; s < block.startSlot + block.duration && s < TOTAL_SLOTS; s++) {
              if (block.day >= 0 && block.day < 6) grid[block.day][s] = true
            }
            workingBlocks.push({ ...block, professorId: newProf.id })
          }
        }

        if (steps.length > 0) {
          suggestions.push({
            id: nextSugId(),
            title: `Aliviar carga de ${prof.nombre} ${prof.apellido}`,
            description: `Excede su límite semanal de ${prof.maxHorasSemana}h por ${(weekHours - prof.maxHorasSemana).toFixed(1)}h. Se sugiere reasignar ${steps.length} bloque(s).`,
            severity: item.severity,
            category: item.category,
            steps,
            ghostBlocks: ghosts,
          })
        }
      }
    }

    // --- Outside allowed hours ---
    if (item.category === 'Fuera de horario' && item.blockIds?.length) {
      const steps: GhostStep[] = []
      const ghosts: GhostBlock[] = []
      for (const blockId of item.blockIds) {
        const block = blocks.find((b) => b.id === blockId)
        if (!block || block.locked) continue
        const subject = subjectById.get(block.subjectId)
        if (!subject) continue
        const slot = findFreeSlot(globalOccupancy, block.duration, limitaciones)
        if (slot) {
          const ghost = makeGhostBlock({ ...block, day: slot.day, startSlot: slot.startSlot }, 'move', block.id)
          ghosts.push(ghost)
          steps.push({
            order: steps.length + 1,
            instruction: `Mover ${subject.codigo} §${block.sectionLabel} a horario permitido`,
            detail: `De ${DAYS[block.day]} ${slotToTimeStr(block.startSlot)}–${slotToTimeStr(block.startSlot + block.duration)} → ${DAYS[slot.day]} ${slotToTimeStr(slot.startSlot)}–${slotToTimeStr(slot.startSlot + block.duration)}.`,
            ghostBlockIds: [ghost.id],
            existingBlockIds: [block.id],
          })
        }
      }
      if (steps.length > 0) {
        suggestions.push({
          id: nextSugId(),
          title: `Mover ${steps.length} bloque(s) a horario permitido`,
          description: `Bloques fuera del rango ${limitaciones.horaInicioMin}–${limitaciones.horaFinMax}.`,
          severity: item.severity,
          category: item.category,
          steps,
          ghostBlocks: ghosts,
        })
      }
    }

    // --- Saturday when disabled ---
    if (item.category === 'Sábado deshabilitado' && item.blockIds?.length) {
      const steps: GhostStep[] = []
      const ghosts: GhostBlock[] = []
      for (const blockId of item.blockIds) {
        const block = blocks.find((b) => b.id === blockId)
        if (!block || block.locked) continue
        const subject = subjectById.get(block.subjectId)
        if (!subject) continue
        const slot = findFreeSlot(globalOccupancy, block.duration, limitaciones, new Set([5]))
        if (slot) {
          const ghost = makeGhostBlock({ ...block, day: slot.day, startSlot: slot.startSlot }, 'move', block.id)
          ghosts.push(ghost)
          steps.push({
            order: steps.length + 1,
            instruction: `Mover ${subject.codigo} §${block.sectionLabel} del Sábado al ${DAYS[slot.day]}`,
            detail: `De Sábado ${slotToTimeStr(block.startSlot)}–${slotToTimeStr(block.startSlot + block.duration)} → ${DAYS[slot.day]} ${slotToTimeStr(slot.startSlot)}–${slotToTimeStr(slot.startSlot + block.duration)}.`,
            ghostBlockIds: [ghost.id],
            existingBlockIds: [block.id],
          })
        }
      }
      if (steps.length > 0) {
        suggestions.push({
          id: nextSugId(),
          title: `Mover ${steps.length} bloque(s) del Sábado`,
          description: `El sábado está deshabilitado en las limitaciones.`,
          severity: item.severity,
          category: item.category,
          steps,
          ghostBlocks: ghosts,
        })
      }
    }

    // --- Disallowed duration ---
    if (item.category === 'Duración no permitida' && item.blockIds?.length) {
      const steps: GhostStep[] = []
      const ghosts: GhostBlock[] = []
      const allowed = limitaciones.duracionesPermitidas.length > 0 ? limitaciones.duracionesPermitidas : [2, 3, 4]
      for (const blockId of item.blockIds) {
        const block = blocks.find((b) => b.id === blockId)
        if (!block || block.locked) continue
        const subject = subjectById.get(block.subjectId)
        if (!subject) continue
        let closest = allowed.reduce((best, d) =>
          Math.abs(d - block.duration) < Math.abs(best - block.duration) ? d : best, allowed[0])

        if (closest > block.duration) {
          const sameDayBlocks = blocks
            .filter((b) => b.day === block.day && b.id !== block.id)
            .sort((a, b) => a.startSlot - b.startSlot)
          const nextBlock = sameDayBlocks.find((b) => b.startSlot > block.startSlot)
          if (nextBlock) {
            const maxDuration = nextBlock.startSlot - block.startSlot
            const feasible = allowed.filter((d) => d <= maxDuration)
            if (feasible.length === 0) continue
            closest = Math.max(...feasible)
          }
        }

        const ghost = makeGhostBlock({ ...block, duration: closest }, 'resize', block.id)
        ghosts.push(ghost)
        steps.push({
          order: steps.length + 1,
          instruction: `Redimensionar ${subject.codigo} §${block.sectionLabel} a ${closest} slots`,
          detail: `Cambiar de ${block.duration} slots (${(block.duration * SLOT_MINUTES / 60).toFixed(1)}h) a ${closest} slots (${(closest * SLOT_MINUTES / 60).toFixed(1)}h). Duraciones permitidas: [${allowed.join(', ')}].`,
          ghostBlockIds: [ghost.id],
          existingBlockIds: [block.id],
        })
      }
      if (steps.length > 0) {
        suggestions.push({
          id: nextSugId(),
          title: `Ajustar duración de ${steps.length} bloque(s)`,
          description: `Duraciones fuera de las permitidas (${limitaciones.duracionesPermitidas.join(', ')} slots).`,
          severity: item.severity,
          category: item.category,
          steps,
          ghostBlocks: ghosts,
        })
      }
    }

    // --- Lunch overlap ---
    if (item.category === 'Almuerzo bloqueado' && item.blockIds?.length) {
      const steps: GhostStep[] = []
      const ghosts: GhostBlock[] = []
      for (const blockId of item.blockIds) {
        const block = blocks.find((b) => b.id === blockId)
        if (!block || block.locked) continue
        const subject = subjectById.get(block.subjectId)
        if (!subject) continue
        const slot = findFreeSlot(globalOccupancy, block.duration, limitaciones, undefined, block.day)
        if (slot) {
          const ghost = makeGhostBlock({ ...block, day: slot.day, startSlot: slot.startSlot }, 'move', block.id)
          ghosts.push(ghost)
          steps.push({
            order: steps.length + 1,
            instruction: `Mover ${subject.codigo} §${block.sectionLabel} fuera del almuerzo`,
            detail: `De ${DAYS[block.day]} ${slotToTimeStr(block.startSlot)}–${slotToTimeStr(block.startSlot + block.duration)} → ${DAYS[slot.day]} ${slotToTimeStr(slot.startSlot)}–${slotToTimeStr(slot.startSlot + block.duration)}. Libera franja 12:00–13:00.`,
            ghostBlockIds: [ghost.id],
            existingBlockIds: [block.id],
          })
        }
      }
      if (steps.length > 0) {
        suggestions.push({
          id: nextSugId(),
          title: `Liberar almuerzo: mover ${steps.length} bloque(s)`,
          description: `Bloques que interfieren con el horario de almuerzo (12:00–13:00).`,
          severity: item.severity,
          category: item.category,
          steps,
          ghostBlocks: ghosts,
        })
      }
    }

    // --- Breakfast overlap ---
    if (item.category === 'Desayuno bloqueado' && item.blockIds?.length) {
      const steps: GhostStep[] = []
      const ghosts: GhostBlock[] = []
      for (const blockId of item.blockIds) {
        const block = blocks.find((b) => b.id === blockId)
        if (!block || block.locked) continue
        const subject = subjectById.get(block.subjectId)
        if (!subject) continue
        const slot = findFreeSlot(globalOccupancy, block.duration, limitaciones, undefined, block.day)
        if (slot) {
          const ghost = makeGhostBlock({ ...block, day: slot.day, startSlot: slot.startSlot }, 'move', block.id)
          ghosts.push(ghost)
          steps.push({
            order: steps.length + 1,
            instruction: `Mover ${subject.codigo} §${block.sectionLabel} después del desayuno`,
            detail: `De ${DAYS[block.day]} ${slotToTimeStr(block.startSlot)}–${slotToTimeStr(block.startSlot + block.duration)} → ${DAYS[slot.day]} ${slotToTimeStr(slot.startSlot)}–${slotToTimeStr(slot.startSlot + block.duration)}. Libera franja 7:00–8:00.`,
            ghostBlockIds: [ghost.id],
            existingBlockIds: [block.id],
          })
        }
      }
      if (steps.length > 0) {
        suggestions.push({
          id: nextSugId(),
          title: `Liberar desayuno: mover ${steps.length} bloque(s)`,
          description: `Bloques que interfieren con el horario de desayuno (7:00–8:00).`,
          severity: item.severity,
          category: item.category,
          steps,
          ghostBlocks: ghosts,
        })
      }
    }

    // --- Consecutive hours exceeded ---
    if (item.category === 'Horas consecutivas' && item.blockIds?.length && item.blockIds.length >= 2) {
      const chainBlocks = item.blockIds
        .map((id) => blocks.find((b) => b.id === id))
        .filter(Boolean) as ScheduleBlock[]

      if (chainBlocks.length >= 2) {
        const lastBlock = chainBlocks[chainBlocks.length - 1]
        const subject = subjectById.get(lastBlock.subjectId)
        if (subject && !lastBlock.locked) {
          const slot = findFreeSlot(globalOccupancy, lastBlock.duration, limitaciones, undefined, (lastBlock.day + 1) % 5)
          if (slot) {
            const ghost = makeGhostBlock({ ...lastBlock, day: slot.day, startSlot: slot.startSlot }, 'move', lastBlock.id)
            suggestions.push({
              id: nextSugId(),
              title: `Romper cadena de horas consecutivas`,
              description: `${chainBlocks.length} bloques consecutivos sin descanso. Se sugiere mover el último bloque.`,
              severity: item.severity,
              category: item.category,
              steps: [{
                order: 1,
                instruction: `Mover ${subject.codigo} §${lastBlock.sectionLabel} para crear descanso`,
                detail: `De ${DAYS[lastBlock.day]} ${slotToTimeStr(lastBlock.startSlot)}–${slotToTimeStr(lastBlock.startSlot + lastBlock.duration)} → ${DAYS[slot.day]} ${slotToTimeStr(slot.startSlot)}–${slotToTimeStr(slot.startSlot + lastBlock.duration)}. Esto rompe la cadena de ${chainBlocks.length} bloques consecutivos.`,
                ghostBlockIds: [ghost.id],
                existingBlockIds: [lastBlock.id],
              }],
              ghostBlocks: [ghost],
            })
          }
        }
      }
    }

    // --- Professor daily overload ---
    if (item.category === 'Sobrecarga diaria') {
      for (const prof of professors) {
        if (!item.message.includes(prof.nombre)) continue
        const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
        const dayIdx = dayNames.findIndex((d) => item.message.includes(d))
        if (dayIdx < 0) continue

        const dayBlocks = blocks.filter((b) => b.professorId === prof.id && b.day === dayIdx)
          .sort((a, b) => b.startSlot - a.startSlot)

        const steps: GhostStep[] = []
        const ghosts: GhostBlock[] = []

        for (const block of dayBlocks) {
          if (block.locked) continue
          const daySlots = dayBlocks.reduce((s, b) => s + b.duration, 0)
          const dayHours = (daySlots * SLOT_MINUTES) / 60
          if (dayHours <= prof.maxHorasDia) break

          const subject = subjectById.get(block.subjectId)
          if (!subject) continue

          const otherDays = new Set([dayIdx])
          const slot = findFreeSlot(globalOccupancy, block.duration, limitaciones, otherDays)
          if (slot) {
            const ghost = makeGhostBlock({ ...block, day: slot.day, startSlot: slot.startSlot }, 'move', block.id)
            ghosts.push(ghost)
            steps.push({
              order: steps.length + 1,
              instruction: `Mover ${subject.codigo} §${block.sectionLabel} del ${DAYS[dayIdx]} al ${DAYS[slot.day]}`,
              detail: `De ${DAYS[dayIdx]} ${slotToTimeStr(block.startSlot)}–${slotToTimeStr(block.startSlot + block.duration)} → ${DAYS[slot.day]} ${slotToTimeStr(slot.startSlot)}–${slotToTimeStr(slot.startSlot + block.duration)}. Reduce carga diaria de ${prof.nombre} ${prof.apellido}.`,
              ghostBlockIds: [ghost.id],
              existingBlockIds: [block.id],
            })
            break
          }
        }

        if (steps.length > 0) {
          suggestions.push({
            id: nextSugId(),
            title: `Aliviar carga diaria de ${prof.nombre} ${prof.apellido}`,
            description: `Excede su límite de ${prof.maxHorasDia}h/día el ${DAYS[dayIdx]}.`,
            severity: item.severity,
            category: item.category,
            steps,
            ghostBlocks: ghosts,
          })
        }
      }
    }
  }

  return suggestions
}
