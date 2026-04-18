import type { Professor, Room, ScheduleBlock, Subject } from './types'
import type { Limitaciones } from './limitaciones'
import { DAYS, SLOT_MINUTES, SLOTS_PER_HOUR, START_HOUR, TOTAL_SLOTS } from './constants'

export type ValidationSeverity = 'critical' | 'high' | 'medium' | 'low'

export type ValidationItem = {
  severity: ValidationSeverity
  category: string
  message: string
  detail: string
  action?: string
  blockIds?: string[]
  subjectId?: string
}

function timeToSlot(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return Math.max(0, (h - START_HOUR) * SLOTS_PER_HOUR + Math.floor(m / SLOT_MINUTES))
}

export function validateSchedule(
  blocks: ScheduleBlock[],
  subjects: Subject[],
  professors: Professor[],
  rooms: Room[],
  limitaciones?: Limitaciones,
): ValidationItem[] {
  const items: ValidationItem[] = []

  const subjectById = new Map(subjects.map((s) => [s.id, s]))
  const profById = new Map(professors.map((p) => [p.id, p]))
  const roomById = new Map(rooms.map((r) => [r.id, r]))

  // --- Hours per subject validation ---
  const hoursBySubject = new Map<string, { totalSlots: number; blockIds: string[] }>()
  for (const b of blocks) {
    const entry = hoursBySubject.get(b.subjectId) ?? { totalSlots: 0, blockIds: [] }
    entry.totalSlots += b.duration
    entry.blockIds.push(b.id)
    hoursBySubject.set(b.subjectId, entry)
  }

  for (const subject of subjects) {
    const entry = hoursBySubject.get(subject.id)
    const requiredSlots = subject.horasSemanales * (60 / SLOT_MINUTES)
    const actualSlots = entry?.totalSlots ?? 0
    const requiredHours = subject.horasSemanales
    const actualHours = (actualSlots * SLOT_MINUTES) / 60

    if (actualSlots === 0 && blocks.length > 0) continue

    if (actualSlots > 0 && actualSlots < requiredSlots) {
      items.push({
        severity: 'high',
        category: 'Horas incompletas',
        message: `${subject.codigo} tiene ${actualHours}h de ${requiredHours}h semanales`,
        detail: `Faltan ${(requiredHours - actualHours).toFixed(1)}h para completar las horas requeridas.`,
        action: `Agrega ${requiredSlots - actualSlots} slots (${((requiredSlots - actualSlots) * SLOT_MINUTES / 60).toFixed(1)}h) más de ${subject.codigo}`,
        blockIds: entry?.blockIds,
        subjectId: subject.id,
      })
    }

    if (actualSlots > requiredSlots) {
      items.push({
        severity: 'medium',
        category: 'Exceso de horas',
        message: `${subject.codigo} excede sus horas: ${actualHours}h de ${requiredHours}h`,
        detail: `Hay ${(actualHours - requiredHours).toFixed(1)}h de más asignadas.`,
        action: `Reduce ${actualSlots - requiredSlots} slots de ${subject.codigo}`,
        blockIds: entry?.blockIds,
        subjectId: subject.id,
      })
    }
  }

  // --- Professor overload validation ---
  const profDaySlots = new Map<string, Map<number, number>>()
  const profWeekSlots = new Map<string, number>()

  for (const b of blocks) {
    if (!b.professorId) continue
    const dayMap = profDaySlots.get(b.professorId) ?? new Map<number, number>()
    dayMap.set(b.day, (dayMap.get(b.day) ?? 0) + b.duration)
    profDaySlots.set(b.professorId, dayMap)
    profWeekSlots.set(b.professorId, (profWeekSlots.get(b.professorId) ?? 0) + b.duration)
  }

  for (const [profId, weekSlots] of profWeekSlots) {
    const prof = profById.get(profId)
    if (!prof) continue
    const weekHours = (weekSlots * SLOT_MINUTES) / 60
    if (weekHours > prof.maxHorasSemana) {
      items.push({
        severity: 'critical',
        category: 'Sobrecarga profesor',
        message: `${prof.nombre} ${prof.apellido} tiene ${weekHours}h/sem (máx: ${prof.maxHorasSemana}h)`,
        detail: `Excede por ${(weekHours - prof.maxHorasSemana).toFixed(1)}h su límite semanal.`,
        action: `Reasigna ${((weekHours - prof.maxHorasSemana) * 60 / SLOT_MINUTES).toFixed(0)} slots a otro profesor`,
      })
    }

    const dayMap = profDaySlots.get(profId)
    if (dayMap) {
      for (const [day, daySlots] of dayMap) {
        const dayHours = (daySlots * SLOT_MINUTES) / 60
        if (dayHours > prof.maxHorasDia) {
          const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
          items.push({
            severity: 'high',
            category: 'Sobrecarga diaria',
            message: `${prof.nombre} ${prof.apellido}: ${dayHours}h el ${dayNames[day]} (máx: ${prof.maxHorasDia}h/día)`,
            detail: `Excede su límite diario.`,
            action: `Mueve bloques del ${dayNames[day]} a otro día`,
          })
        }
      }
    }
  }

  // --- Unassigned blocks ---
  const unassignedProf = blocks.filter((b) => !b.professorId)
  if (unassignedProf.length > 0) {
    items.push({
      severity: 'medium',
      category: 'Sin profesor',
      message: `${unassignedProf.length} bloque(s) sin profesor asignado`,
      detail: `Bloques: ${unassignedProf.map((b) => subjectById.get(b.subjectId)?.codigo ?? b.id).join(', ')}`,
      action: 'Asigna un profesor a cada bloque',
      blockIds: unassignedProf.map((b) => b.id),
    })
  }

  const unassignedRoom = blocks.filter((b) => !b.roomId)
  if (unassignedRoom.length > 0) {
    items.push({
      severity: 'medium',
      category: 'Sin aula',
      message: `${unassignedRoom.length} bloque(s) sin aula asignada`,
      detail: `Bloques: ${unassignedRoom.map((b) => subjectById.get(b.subjectId)?.codigo ?? b.id).join(', ')}`,
      action: 'Asigna un aula a cada bloque',
      blockIds: unassignedRoom.map((b) => b.id),
    })
  }

  // --- Capacity checks ---
  for (const b of blocks) {
    if (!b.roomId) continue
    const room = roomById.get(b.roomId)
    if (!room) continue
    if (b.studentsExpected > room.capacidad) {
      const subject = subjectById.get(b.subjectId)
      items.push({
        severity: 'high',
        category: 'Capacidad excedida',
        message: `${subject?.codigo ?? 'Bloque'} §${b.sectionLabel}: ${b.studentsExpected} est. en ${room.codigo} (cap. ${room.capacidad})`,
        detail: `Sobran ${b.studentsExpected - room.capacidad} estudiantes.`,
        action: `Mueve a un aula con capacidad >= ${b.studentsExpected} o divide la sección`,
        blockIds: [b.id],
      })
    }
  }

  // --- Room type mismatch ---
  for (const b of blocks) {
    if (!b.roomId) continue
    const subject = subjectById.get(b.subjectId)
    const room = roomById.get(b.roomId)
    if (!subject || !room) continue
    if (subject.tipoAula !== room.tipo) {
      items.push({
        severity: 'high',
        category: 'Tipo de aula',
        message: `${subject.codigo} requiere ${subject.tipoAula}, pero ${room.codigo} es ${room.tipo}`,
        detail: `La materia necesita un aula de tipo ${subject.tipoAula}.`,
        action: `Cambia el aula a una de tipo ${subject.tipoAula}`,
        blockIds: [b.id],
      })
    }
  }

  // --- Professor utilization insights ---
  const assignedProfs = new Set(blocks.filter((b) => b.professorId).map((b) => b.professorId!))
  const unusedProfs = professors.filter((p) => !assignedProfs.has(p.id))
  if (unusedProfs.length > 0 && blocks.length > 0) {
    items.push({
      severity: 'low',
      category: 'Profesor sin asignar',
      message: `${unusedProfs.length} profesor(es) no tienen bloques: ${unusedProfs.map((p) => `${p.nombre} ${p.apellido}`).join(', ')}`,
      detail: 'Profesores disponibles que podrían ayudar con la carga.',
      action: 'Considera asignarles bloques para balancear la carga',
    })
  }

  // --- Room utilization insights ---
  const assignedRooms = new Set(blocks.filter((b) => b.roomId).map((b) => b.roomId!))
  const unusedRooms = rooms.filter((r) => !assignedRooms.has(r.id))
  if (unusedRooms.length > 0 && blocks.length > 0 && rooms.length > 3) {
    items.push({
      severity: 'low',
      category: 'Aulas subutilizadas',
      message: `${unusedRooms.length} aula(s) sin uso: ${unusedRooms.map((r) => r.codigo).join(', ')}`,
      detail: 'Aulas disponibles que podrían reducir conflictos.',
    })
  }

  // --- Limitaciones-based checks ---
  if (limitaciones) {
    const minSlot = timeToSlot(limitaciones.horaInicioMin)
    const maxSlot = timeToSlot(limitaciones.horaFinMax)

    // Blocks outside allowed hours
    const outsideHours = blocks.filter((b) => {
      const end = b.startSlot + b.duration
      return b.startSlot < minSlot || end > maxSlot
    })
    if (outsideHours.length > 0) {
      items.push({
        severity: 'high',
        category: 'Fuera de horario',
        message: `${outsideHours.length} bloque(s) fuera del rango ${limitaciones.horaInicioMin}–${limitaciones.horaFinMax}`,
        detail: `Bloques: ${outsideHours.map((b) => subjectById.get(b.subjectId)?.codigo ?? b.id).join(', ')}`,
        action: 'Mueve los bloques al rango de horario permitido',
        blockIds: outsideHours.map((b) => b.id),
      })
    }

    // Saturday blocks when disabled
    if (!limitaciones.incluirSabado) {
      const satBlocks = blocks.filter((b) => b.day === 5)
      if (satBlocks.length > 0) {
        items.push({
          severity: 'high',
          category: 'Sábado deshabilitado',
          message: `${satBlocks.length} bloque(s) programados en Sábado (deshabilitado)`,
          detail: `Bloques: ${satBlocks.map((b) => subjectById.get(b.subjectId)?.codigo ?? b.id).join(', ')}`,
          action: 'Mueve los bloques a un día de lunes a viernes',
          blockIds: satBlocks.map((b) => b.id),
        })
      }
    }

    // Disallowed durations
    if (limitaciones.duracionesPermitidas.length > 0) {
      const badDuration = blocks.filter((b) => !limitaciones.duracionesPermitidas.includes(b.duration))
      if (badDuration.length > 0) {
        items.push({
          severity: 'medium',
          category: 'Duración no permitida',
          message: `${badDuration.length} bloque(s) con duración no permitida`,
          detail: `Permitidas: [${limitaciones.duracionesPermitidas.join(', ')}] slots. Encontradas: ${[...new Set(badDuration.map((b) => b.duration))].join(', ')}.`,
          action: `Ajusta la duración a una de: ${limitaciones.duracionesPermitidas.join(', ')} slots`,
          blockIds: badDuration.map((b) => b.id),
        })
      }
    }

    // Lunch overlap
    if (limitaciones.bloquearAlmuerzo) {
      const lunchStart = (12 - START_HOUR) * SLOTS_PER_HOUR
      const lunchEnd = (13 - START_HOUR) * SLOTS_PER_HOUR
      const lunchBlocks = blocks.filter((b) => b.startSlot < lunchEnd && b.startSlot + b.duration > lunchStart)
      if (lunchBlocks.length > 0) {
        items.push({
          severity: 'medium',
          category: 'Almuerzo bloqueado',
          message: `${lunchBlocks.length} bloque(s) interfieren con horario de almuerzo (12:00–13:00)`,
          detail: `Bloques: ${lunchBlocks.map((b) => `${subjectById.get(b.subjectId)?.codigo ?? b.id} (${DAYS[b.day]})`).join(', ')}`,
          action: 'Mueve los bloques fuera del horario de almuerzo',
          blockIds: lunchBlocks.map((b) => b.id),
        })
      }
    }

    // Breakfast overlap
    if (limitaciones.bloquearDesayuno) {
      const bfEnd = (8 - START_HOUR) * SLOTS_PER_HOUR
      const bfBlocks = blocks.filter((b) => b.startSlot < bfEnd)
      if (bfBlocks.length > 0) {
        items.push({
          severity: 'medium',
          category: 'Desayuno bloqueado',
          message: `${bfBlocks.length} bloque(s) interfieren con horario de desayuno (7:00–8:00)`,
          detail: `Bloques: ${bfBlocks.map((b) => `${subjectById.get(b.subjectId)?.codigo ?? b.id} (${DAYS[b.day]})`).join(', ')}`,
          action: 'Mueve los bloques después de las 8:00',
          blockIds: bfBlocks.map((b) => b.id),
        })
      }
    }

    // Max consecutive hours per professor
    if (limitaciones.maxHorasConsecutivas != null) {
      const maxSlots = limitaciones.maxHorasConsecutivas * SLOTS_PER_HOUR
      const profDayBlocks = new Map<string, Map<number, ScheduleBlock[]>>()
      for (const b of blocks) {
        if (!b.professorId) continue
        if (!profDayBlocks.has(b.professorId)) profDayBlocks.set(b.professorId, new Map())
        const dayMap = profDayBlocks.get(b.professorId)!
        if (!dayMap.has(b.day)) dayMap.set(b.day, [])
        dayMap.get(b.day)!.push(b)
      }
      for (const [profId, dayMap] of profDayBlocks) {
        const prof = profById.get(profId)
        if (!prof) continue
        for (const [day, dayBlocks] of dayMap) {
          const sorted = [...dayBlocks].sort((a, b) => a.startSlot - b.startSlot)
          let consecutiveSlots = 0
          let chainBlocks: ScheduleBlock[] = []
          let prevEnd = -1
          for (const b of sorted) {
            const gap = b.startSlot - prevEnd
            if (prevEnd >= 0 && gap <= (limitaciones.descansoMinSlots || 0)) {
              consecutiveSlots += b.duration + gap
              chainBlocks.push(b)
            } else {
              consecutiveSlots = b.duration
              chainBlocks = [b]
            }
            prevEnd = b.startSlot + b.duration
            if (consecutiveSlots > maxSlots) {
              items.push({
                severity: 'medium',
                category: 'Horas consecutivas',
                message: `${prof.nombre} ${prof.apellido}: ${(consecutiveSlots * SLOT_MINUTES / 60).toFixed(1)}h consecutivas el ${DAYS[day]} (máx: ${limitaciones.maxHorasConsecutivas}h)`,
                detail: `Cadena de ${chainBlocks.length} bloques sin descanso suficiente.`,
                action: 'Inserta un descanso moviendo un bloque a otro horario',
                blockIds: chainBlocks.map((b) => b.id),
              })
              break
            }
          }
        }
      }
    }

    // Max blocks per day per subject
    if (limitaciones.maxBloquesPorDiaPorMateria != null) {
      const subjectDayCounts = new Map<string, Map<number, string[]>>()
      for (const b of blocks) {
        const key = b.subjectId
        if (!subjectDayCounts.has(key)) subjectDayCounts.set(key, new Map())
        const dayMap = subjectDayCounts.get(key)!
        if (!dayMap.has(b.day)) dayMap.set(b.day, [])
        dayMap.get(b.day)!.push(b.id)
      }
      for (const [subjectId, dayMap] of subjectDayCounts) {
        const subject = subjectById.get(subjectId)
        for (const [day, blockIds] of dayMap) {
          if (blockIds.length > limitaciones.maxBloquesPorDiaPorMateria!) {
            items.push({
              severity: 'medium',
              category: 'Exceso bloques/día',
              message: `${subject?.codigo ?? subjectId}: ${blockIds.length} bloques el ${DAYS[day]} (máx: ${limitaciones.maxBloquesPorDiaPorMateria}/día)`,
              detail: `Distribuye los bloques en diferentes días.`,
              action: `Mueve ${blockIds.length - limitaciones.maxBloquesPorDiaPorMateria!} bloque(s) a otro día`,
              blockIds,
              subjectId,
            })
          }
        }
      }
    }
  }

  items.sort((a, b) => {
    const order: Record<ValidationSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3 }
    return order[a.severity] - order[b.severity]
  })

  return items
}
