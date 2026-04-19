import { useMemo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/lib/utils'
import {
  DAYS,
  DAYS_SHORT,
  HEADER_HEIGHT_PX,
  SLOT_HEIGHT_PX,
  SLOTS_PER_HOUR,
  TIME_COL_WIDTH_PX,
  TOTAL_SLOTS,
  START_HOUR,
  SLOT_MINUTES,
  slotToTime,
} from '../constants'
import type { ConflictMap, GhostBlock, Professor, Room, ScheduleBlock, Subject, DropCellData } from '../types'
import { ClassBlock } from './ClassBlock'
import { GhostBlockOverlay } from './GhostBlockOverlay'
import { useLimitacionesStore } from '../limitaciones'

export type BlockLayout = {
  column: number
  totalColumns: number
}

export function computeBlockLayouts(blocks: ScheduleBlock[]): Map<string, BlockLayout> {
  const layouts = new Map<string, BlockLayout>()
  if (blocks.length === 0) return layouts

  const sorted = [...blocks].sort((a, b) => a.startSlot - b.startSlot || b.duration - a.duration)

  const groups: ScheduleBlock[][] = []
  for (const block of sorted) {
    let placed = false
    for (const group of groups) {
      const overlaps = group.some(
        (g) => block.startSlot < g.startSlot + g.duration && block.startSlot + block.duration > g.startSlot,
      )
      if (overlaps) {
        group.push(block)
        placed = true
        break
      }
    }
    if (!placed) groups.push([block])
  }

  for (const group of groups) {
    if (group.length === 1) {
      layouts.set(group[0].id, { column: 0, totalColumns: 1 })
      continue
    }

    const allBlocks = [...group].sort((a, b) => a.startSlot - b.startSlot || b.duration - a.duration)
    const columns: ScheduleBlock[][] = []

    for (const block of allBlocks) {
      let placed = false
      for (let c = 0; c < columns.length; c++) {
        const canFit = columns[c].every(
          (existing) =>
            block.startSlot >= existing.startSlot + existing.duration ||
            block.startSlot + block.duration <= existing.startSlot,
        )
        if (canFit) {
          columns[c].push(block)
          layouts.set(block.id, { column: c, totalColumns: 0 })
          placed = true
          break
        }
      }
      if (!placed) {
        columns.push([block])
        layouts.set(block.id, { column: columns.length - 1, totalColumns: 0 })
      }
    }

    for (const block of allBlocks) {
      const layout = layouts.get(block.id)!
      layout.totalColumns = columns.length
    }
  }

  return layouts
}

type Props = {
  blocks: ScheduleBlock[]
  ghostBlocks?: GhostBlock[]
  subjects: Subject[]
  professors: Professor[]
  rooms: Room[]
  conflicts: ConflictMap
  selectedBlockId: string | null
  onSelectBlock: (id: string | null) => void
}

export function WeekGrid({ blocks, ghostBlocks = [], subjects, professors, rooms, conflicts, selectedBlockId, onSelectBlock }: Props) {
  const limitaciones = useLimitacionesStore((s) => s.limitaciones)

  const visibleDays = useMemo(() => {
    if (limitaciones.incluirSabado) return DAYS.map((_, i) => i)
    return DAYS.slice(0, 5).map((_, i) => i)
  }, [limitaciones.incluirSabado])

  const visibleDayNames = useMemo(() => visibleDays.map((i) => DAYS[i]), [visibleDays])
  const visibleDayShort = useMemo(() => visibleDays.map((i) => DAYS_SHORT[i]), [visibleDays])

  const gridRange = useMemo(() => {
    const [hStart, mStart] = limitaciones.horaInicioMin.split(':').map(Number)
    const [hEnd, mEnd] = limitaciones.horaFinMax.split(':').map(Number)
    const startSlot = Math.max(0, Math.floor(((hStart - START_HOUR) * 60 + mStart) / SLOT_MINUTES))
    const endSlot = Math.min(TOTAL_SLOTS, Math.ceil(((hEnd - START_HOUR) * 60 + mEnd) / SLOT_MINUTES))
    return { startSlot, endSlot, totalVisible: endSlot - startSlot }
  }, [limitaciones.horaInicioMin, limitaciones.horaFinMax])

  const byId = useMemo(() => ({
    subject: new Map(subjects.map((s) => [s.id, s])),
    professor: new Map(professors.map((p) => [p.id, p])),
    room: new Map(rooms.map((r) => [r.id, r])),
  }), [subjects, professors, rooms])

  const blocksByDay = useMemo(() => {
    const arr: ScheduleBlock[][] = Array.from({ length: DAYS.length }, () => [])
    for (const b of blocks) if (b.day >= 0 && b.day < DAYS.length) arr[b.day].push(b)
    return arr
  }, [blocks])

  const layoutsByDay = useMemo(() => {
    return blocksByDay.map((dayBlocks) => computeBlockLayouts(dayBlocks))
  }, [blocksByDay])

  const ghostsByDay = useMemo(() => {
    const arr: GhostBlock[][] = Array.from({ length: DAYS.length }, () => [])
    for (const b of ghostBlocks) if (b.day >= 0 && b.day < DAYS.length) arr[b.day].push(b)
    return arr
  }, [ghostBlocks])

  return (
    <div
      className="relative overflow-auto rounded-xl border border-border bg-card"
      onClick={(e) => {
        if (e.currentTarget === e.target) {
          onSelectBlock(null)
        }
      }}
    >
      <div
        className="grid min-w-[720px]"
        style={{ gridTemplateColumns: `${TIME_COL_WIDTH_PX}px repeat(${visibleDays.length}, minmax(120px, 1fr))` }}
      >
        {/* Header */}
        <div
          className="sticky left-0 top-0 z-20 border-b border-r border-border bg-card/95 backdrop-blur"
          style={{ height: HEADER_HEIGHT_PX }}
        />
        {visibleDayNames.map((d, i) => (
          <div
            key={d}
            className="sticky top-0 z-10 border-b border-r border-border bg-card/95 px-3 backdrop-blur last:border-r-0 flex flex-col justify-center"
            style={{ height: HEADER_HEIGHT_PX }}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {visibleDayShort[i]}
            </span>
            <span className="text-xs text-foreground">{d}</span>
          </div>
        ))}

        {/* Time col */}
        <div
          className="sticky left-0 z-10 border-r border-border bg-card/95"
          style={{ height: gridRange.totalVisible * SLOT_HEIGHT_PX }}
        >
          {Array.from({ length: Math.floor(gridRange.totalVisible / SLOTS_PER_HOUR) + 1 }).map((_, hIdx) => {
            const slot = gridRange.startSlot + hIdx * SLOTS_PER_HOUR
            if (slot > gridRange.endSlot) return null
            return (
              <div
                key={slot}
                className="absolute right-1 -translate-y-1/2 pr-2 text-right font-mono text-[10px] text-muted-foreground"
                style={{ top: (slot - gridRange.startSlot) * SLOT_HEIGHT_PX }}
              >
                {slotToTime(slot)}
              </div>
            )
          })}
        </div>

        {/* Day columns */}
        {visibleDays.map((day) => (
          <DayColumn
            key={day}
            day={day}
            blocks={blocksByDay[day]}
            layouts={layoutsByDay[day]}
            ghostBlocks={ghostsByDay[day]}
            subjectsById={byId.subject}
            professorsById={byId.professor}
            roomsById={byId.room}
            conflicts={conflicts}
            selectedBlockId={selectedBlockId}
            onSelectBlock={onSelectBlock}
            gridStartSlot={gridRange.startSlot}
            totalVisibleSlots={gridRange.totalVisible}
          />
        ))}
      </div>
    </div>
  )
}

function DayColumn({
  day,
  blocks,
  layouts,
  ghostBlocks,
  subjectsById,
  professorsById,
  roomsById,
  conflicts,
  selectedBlockId,
  onSelectBlock,
  gridStartSlot,
  totalVisibleSlots,
}: {
  day: number
  blocks: ScheduleBlock[]
  layouts: Map<string, BlockLayout>
  ghostBlocks: GhostBlock[]
  subjectsById: Map<string, Subject>
  professorsById: Map<string, Professor>
  roomsById: Map<string, Room>
  conflicts: ConflictMap
  selectedBlockId: string | null
  onSelectBlock: (id: string | null) => void
  gridStartSlot: number
  totalVisibleSlots: number
}) {
  return (
    <div
      className="relative border-r border-border last:border-r-0"
      style={{ height: totalVisibleSlots * SLOT_HEIGHT_PX }}
    >
      {Array.from({ length: totalVisibleSlots }).map((_, i) => (
        <DroppableCell key={i} day={day} slot={gridStartSlot + i} offsetSlot={i} />
      ))}

      {blocks.map((b) => {
        const subject = subjectsById.get(b.subjectId)
        if (!subject) return null
        const layout = layouts.get(b.id) ?? { column: 0, totalColumns: 1 }
        return (
          <ClassBlock
            key={b.id}
            block={b}
            subject={subject}
            professor={b.professorId ? professorsById.get(b.professorId) ?? null : null}
            room={b.roomId ? roomsById.get(b.roomId) ?? null : null}
            conflicts={conflicts.get(b.id)}
            selected={selectedBlockId === b.id}
            onSelect={() => onSelectBlock(b.id)}
            layout={layout}
            gridStartSlot={gridStartSlot}
          />
        )
      })}

      {ghostBlocks.map((b) => {
        const subject = subjectsById.get(b.subjectId)
        if (!subject) return null
        return <GhostBlockOverlay key={b.id} block={b} subject={subject} />
      })}
    </div>
  )
}

function DroppableCell({ day, slot, offsetSlot }: { day: number; slot: number; offsetSlot: number }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${day}-${slot}`,
    data: { type: 'cell', day, slot } satisfies DropCellData,
  })
  const isHourMark = slot % SLOTS_PER_HOUR === 0
  const halfSlot = Math.floor(SLOTS_PER_HOUR / 2)
  const isHalfHour = SLOTS_PER_HOUR % 2 === 0 && slot % SLOTS_PER_HOUR === halfSlot

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'absolute left-0 right-0 transition-colors',
        isHourMark && 'border-t border-border',
        isHalfHour && 'border-t border-dashed border-border/40',
        isOver && 'bg-status-warning/10'
      )}
      style={{ top: offsetSlot * SLOT_HEIGHT_PX, height: SLOT_HEIGHT_PX }}
    />
  )
}
