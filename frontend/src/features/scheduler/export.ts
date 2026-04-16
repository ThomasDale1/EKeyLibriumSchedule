import type { Professor, Room, ScheduleBlock, Subject } from './types'
import type { Schedule } from './store'
import { DAYS, slotToTime } from './constants'

export function exportScheduleAsJSON(schedule: Schedule, subjects: Subject[], professors: Professor[], rooms: Room[]): string {
  const subjectById = new Map(subjects.map((s) => [s.id, s]))
  const professorById = new Map(professors.map((p) => [p.id, p]))
  const roomById = new Map(rooms.map((r) => [r.id, r]))

  return JSON.stringify(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      schedule: {
        id: schedule.id,
        name: schedule.name,
        createdAt: schedule.createdAt,
        updatedAt: schedule.updatedAt,
        notes: schedule.notes,
        blocks: schedule.blocks.map((b) => ({
          ...b,
          _subject: subjectById.get(b.subjectId)?.codigo ?? null,
          _professor: b.professorId
            ? `${professorById.get(b.professorId)?.nombre ?? ''} ${professorById.get(b.professorId)?.apellido ?? ''}`.trim()
            : null,
          _room: b.roomId ? roomById.get(b.roomId)?.codigo ?? null : null,
          _day: DAYS[b.day],
          _startTime: slotToTime(b.startSlot),
          _endTime: slotToTime(b.startSlot + b.duration),
        })),
      },
    },
    null,
    2
  )
}

const ICS_DAYS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']

function icsEscape(s: string) {
  return s.replace(/[,;\\]/g, (m) => `\\${m}`).replace(/\n/g, '\\n')
}

function nextMondayInUTC(): Date {
  const now = new Date()
  const day = now.getUTCDay()
  const daysUntilMonday = (8 - day) % 7 || 7
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilMonday, 0, 0, 0))
  return monday
}

function formatIcsDateLocal(d: Date, hour: number, minute: number): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}${m}${day}T${String(hour).padStart(2, '0')}${String(minute).padStart(2, '0')}00`
}

export function exportScheduleAsICS(
  schedule: Schedule,
  subjects: Subject[],
  professors: Professor[],
  rooms: Room[],
  weeksCount = 16
): string {
  const subjectById = new Map(subjects.map((s) => [s.id, s]))
  const professorById = new Map(professors.map((p) => [p.id, p]))
  const roomById = new Map(rooms.map((r) => [r.id, r]))

  const monday = nextMondayInUTC()
  const lines: string[] = []
  lines.push('BEGIN:VCALENDAR')
  lines.push('VERSION:2.0')
  lines.push('PRODID:-//EKeyLibrium//Scheduler//ES')
  lines.push('CALSCALE:GREGORIAN')

  for (const b of schedule.blocks) {
    const subject = subjectById.get(b.subjectId)
    if (!subject) continue
    const professor = b.professorId ? professorById.get(b.professorId) : null
    const room = b.roomId ? roomById.get(b.roomId) : null

    const dayDate = new Date(monday.getTime() + b.day * 24 * 60 * 60 * 1000)
    const [startH, startM] = slotToTime(b.startSlot).split(':').map(Number)
    const [endH, endM] = slotToTime(b.startSlot + b.duration).split(':').map(Number)
    const dtStart = formatIcsDateLocal(dayDate, startH, startM)
    const dtEnd = formatIcsDateLocal(dayDate, endH, endM)

    const summary = icsEscape(`${subject.codigo} §${b.sectionLabel} — ${subject.nombre}`)
    const descParts: string[] = []
    if (professor) descParts.push(`Profesor: ${professor.nombre} ${professor.apellido}`)
    if (room) descParts.push(`Aula: ${room.codigo}`)
    descParts.push(`Estudiantes esperados: ${b.studentsExpected}`)
    const description = icsEscape(descParts.join('\n'))

    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${b.id}@ekeylibrium`)
    lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]|\.\d+/g, '').slice(0, 15) + 'Z'}`)
    lines.push(`DTSTART:${dtStart}`)
    lines.push(`DTEND:${dtEnd}`)
    lines.push(`RRULE:FREQ=WEEKLY;BYDAY=${ICS_DAYS[b.day]};COUNT=${weeksCount}`)
    lines.push(`SUMMARY:${summary}`)
    if (description) lines.push(`DESCRIPTION:${description}`)
    if (room) lines.push(`LOCATION:${icsEscape(room.nombre)}`)
    lines.push('END:VEVENT')
  }

  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9\-_.]/gi, '_').replace(/_+/g, '_').toLowerCase()
}
