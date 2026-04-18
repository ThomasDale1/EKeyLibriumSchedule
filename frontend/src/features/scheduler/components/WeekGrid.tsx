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
  slotToTime,
} from '../constants'
import type { ConflictMap, GhostBlock, Professor, Room, ScheduleBlock, Subject, DropCellData } from '../types'
import { ClassBlock } from './ClassBlock'
import { GhostBlockOverlay } from './GhostBlockOverlay'

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
        style={{ gridTemplateColumns: `${TIME_COL_WIDTH_PX}px repeat(${DAYS.length}, minmax(120px, 1fr))` }}
      >
        {/* Header */}
        <div
          className="sticky left-0 top-0 z-20 border-b border-r border-border bg-card/95 backdrop-blur"
          style={{ height: HEADER_HEIGHT_PX }}
        />
        {DAYS.map((d, i) => (
          <div
            key={d}
            className="sticky top-0 z-10 border-b border-r border-border bg-card/95 px-3 backdrop-blur last:border-r-0 flex flex-col justify-center"
            style={{ height: HEADER_HEIGHT_PX }}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {DAYS_SHORT[i]}
            </span>
            <span className="text-xs text-foreground">{d}</span>
          </div>
        ))}

        {/* Time col */}
        <div
          className="sticky left-0 z-10 border-r border-border bg-card/95"
          style={{ height: TOTAL_SLOTS * SLOT_HEIGHT_PX }}
        >
          {Array.from({ length: Math.floor(TOTAL_SLOTS / SLOTS_PER_HOUR) + 1 }).map((_, hIdx) => {
            const slot = hIdx * SLOTS_PER_HOUR
            if (slot > TOTAL_SLOTS) return null
            return (
              <div
                key={slot}
                className="absolute right-1 -translate-y-1/2 pr-2 text-right font-mono text-[10px] text-muted-foreground"
                style={{ top: slot * SLOT_HEIGHT_PX }}
              >
                {slotToTime(slot)}
              </div>
            )
          })}
        </div>

        {/* Day columns */}
        {DAYS.map((_, day) => (
          <DayColumn
            key={day}
            day={day}
            blocks={blocksByDay[day]}
            ghostBlocks={ghostsByDay[day]}
            subjectsById={byId.subject}
            professorsById={byId.professor}
            roomsById={byId.room}
            conflicts={conflicts}
            selectedBlockId={selectedBlockId}
            onSelectBlock={onSelectBlock}
          />
        ))}
      </div>
    </div>
  )
}

function DayColumn({
  day,
  blocks,
  ghostBlocks,
  subjectsById,
  professorsById,
  roomsById,
  conflicts,
  selectedBlockId,
  onSelectBlock,
}: {
  day: number
  blocks: ScheduleBlock[]
  ghostBlocks: GhostBlock[]
  subjectsById: Map<string, Subject>
  professorsById: Map<string, Professor>
  roomsById: Map<string, Room>
  conflicts: ConflictMap
  selectedBlockId: string | null
  onSelectBlock: (id: string | null) => void
}) {
  return (
    <div
      className="relative border-r border-border last:border-r-0"
      style={{ height: TOTAL_SLOTS * SLOT_HEIGHT_PX }}
    >
      {Array.from({ length: TOTAL_SLOTS }).map((_, slot) => (
        <DroppableCell key={slot} day={day} slot={slot} />
      ))}

      {blocks.map((b) => {
        const subject = subjectsById.get(b.subjectId)
        if (!subject) return null
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

function DroppableCell({ day, slot }: { day: number; slot: number }) {
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
      style={{ top: slot * SLOT_HEIGHT_PX, height: SLOT_HEIGHT_PX }}
    />
  )
}
