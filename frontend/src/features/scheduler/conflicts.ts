import type { Conflict, ConflictMap, Room, ScheduleBlock, Subject } from './types'

function overlap(a: ScheduleBlock, b: ScheduleBlock): boolean {
  if (a.day !== b.day) return false
  return a.startSlot < b.startSlot + b.duration && b.startSlot < a.startSlot + a.duration
}

export function detectConflicts(
  blocks: ScheduleBlock[],
  subjects: Subject[],
  rooms: Room[]
): ConflictMap {
  const map: ConflictMap = new Map()
  const add = (id: string, c: Conflict) => {
    const existing = map.get(id) ?? []
    existing.push(c)
    map.set(id, existing)
  }

  const subjectById = new Map(subjects.map((s) => [s.id, s]))
  const roomById = new Map(rooms.map((r) => [r.id, r]))

  for (const block of blocks) {
    const subject = subjectById.get(block.subjectId)
    const room = block.roomId ? roomById.get(block.roomId) : null

    if (subject && room && subject.tipoAula !== room.tipo) {
      add(block.id, {
        kind: 'room-type-mismatch',
        message: `${subject.codigo} requiere ${subject.tipoAula}, pero ${room.codigo} es ${room.tipo}`,
      })
    }
    if (room && block.studentsExpected > room.capacidad) {
      add(block.id, {
        kind: 'capacity-exceeded',
        message: `${block.studentsExpected} estudiantes exceden la capacidad de ${room.codigo} (${room.capacidad})`,
      })
    }
  }

  for (let i = 0; i < blocks.length; i++) {
    for (let j = i + 1; j < blocks.length; j++) {
      const a = blocks[i]
      const b = blocks[j]
      if (!overlap(a, b)) continue

      add(a.id, { kind: 'time-overlap', message: `Choque con otro bloque en el mismo horario`, otherBlockId: b.id })
      add(b.id, { kind: 'time-overlap', message: `Choque con otro bloque en el mismo horario`, otherBlockId: a.id })

      if (a.professorId && a.professorId === b.professorId) {
        add(a.id, { kind: 'professor-busy', message: 'Profesor asignado a otro bloque al mismo tiempo', otherBlockId: b.id })
        add(b.id, { kind: 'professor-busy', message: 'Profesor asignado a otro bloque al mismo tiempo', otherBlockId: a.id })
      }
      if (a.roomId && a.roomId === b.roomId) {
        add(a.id, { kind: 'room-busy', message: 'Aula ocupada por otro bloque al mismo tiempo', otherBlockId: b.id })
        add(b.id, { kind: 'room-busy', message: 'Aula ocupada por otro bloque al mismo tiempo', otherBlockId: a.id })
      }
    }
  }

  return map
}

export function severity(conflicts: Conflict[] | undefined): 'none' | 'warning' | 'critical' {
  if (!conflicts || conflicts.length === 0) return 'none'
  const hard: Conflict['kind'][] = ['time-overlap', 'professor-busy', 'room-busy']
  return conflicts.some((c) => hard.includes(c.kind)) ? 'critical' : 'warning'
}
