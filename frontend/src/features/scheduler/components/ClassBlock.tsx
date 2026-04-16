import { Lock, AlertTriangle, GripVertical } from 'lucide-react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { SLOT_HEIGHT_PX, slotToTime, slotsToLabel } from '../constants'
import { COLOR_STYLES } from '../colors'
import { severity } from '../conflicts'
import type { BlockDragData, Conflict, Professor, Room, ScheduleBlock, Subject } from '../types'
import { useScheduleStore } from '../store'

type Props = {
  block: ScheduleBlock
  subject: Subject
  professor: Professor | null
  room: Room | null
  conflicts: Conflict[] | undefined
  selected: boolean
  onSelect: () => void
}

export function ClassBlock({ block, subject, professor, room, conflicts, selected, onSelect }: Props) {
  const resizeBlock = useScheduleStore((s) => s.resizeBlock)
  const [resizing, setResizing] = useState(false)
  const [hoverPreview, setHoverPreview] = useState<number | null>(null)
  const [altKey, setAltKey] = useState(false)
  const startRef = useRef({ y: 0, duration: block.duration })

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `block-${block.id}`,
    disabled: block.locked || resizing,
    data: { type: 'block', blockId: block.id, altKey } satisfies BlockDragData,
  })

  const colorStyle = COLOR_STYLES[subject.color]
  const sev = severity(conflicts)
  const displayDuration = hoverPreview ?? block.duration
  const height = displayDuration * SLOT_HEIGHT_PX - 4

  function startResize(e: React.PointerEvent) {
    if (block.locked) return
    e.stopPropagation()
    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    startRef.current = { y: e.clientY, duration: block.duration }
    setResizing(true)
  }

  useEffect(() => {
    if (!resizing) return
    function onMove(e: PointerEvent) {
      const deltaY = e.clientY - startRef.current.y
      const deltaSlots = Math.round(deltaY / SLOT_HEIGHT_PX)
      const next = Math.max(1, startRef.current.duration + deltaSlots)
      setHoverPreview(next)
    }
    function onUp() {
      if (hoverPreview != null) resizeBlock(block.id, hoverPreview)
      setResizing(false)
      setHoverPreview(null)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [resizing, hoverPreview, block.id, resizeBlock])

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        top: block.startSlot * SLOT_HEIGHT_PX + 2,
        height,
        opacity: isDragging ? 0.5 : 1,
        zIndex: selected ? 30 : isDragging ? 40 : 10,
      }}
      className={cn(
        'group absolute left-1 right-1 rounded-md border text-left transition-shadow',
        colorStyle.bg,
        colorStyle.border,
        sev === 'critical' && 'ring-2 ring-status-critical/70 border-status-critical',
        sev === 'warning' && 'ring-1 ring-status-warning/50',
        selected && 'shadow-[0_0_0_2px_var(--color-ring)]',
        isDragging ? 'cursor-grabbing shadow-dark-xl' : 'cursor-grab hover:shadow-dark-lg'
      )}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
      onFocus={(e) => {
        e.stopPropagation()
        if (!selected) onSelect()
      }}
      onMouseDown={(e) => {
        setAltKey(e.altKey)
      }}
      onKeyDown={(e) => {
        setAltKey(e.altKey)
      }}
      aria-label={`${subject.codigo} sección ${block.sectionLabel}, ${slotToTime(block.startSlot)} a ${slotToTime(block.startSlot + block.duration)}${block.locked ? ', bloqueado' : ''}${sev !== 'none' ? `, ${conflicts?.length ?? 0} conflictos` : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="flex h-full flex-col justify-between p-1.5 pointer-events-none">
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <span className={cn('font-mono text-[10px] font-semibold tracking-wide', colorStyle.text)}>
              {subject.codigo}
            </span>
            <span className="text-[10px] text-muted-foreground">·{block.sectionLabel}</span>
            {block.locked && <Lock className="ml-auto h-3 w-3 text-muted-foreground" />}
            {sev === 'critical' && !block.locked && (
              <AlertTriangle className="ml-auto h-3 w-3 text-status-critical" />
            )}
          </div>
          {displayDuration >= 2 && (
            <p className="mt-0.5 truncate text-[11px] font-medium text-foreground">{subject.nombre}</p>
          )}
          {displayDuration >= 3 && professor && professor.apellido && professor.apellido.length > 0 && (
            <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
              {professor.nombre} {professor.apellido[0]}.
            </p>
          )}
          {displayDuration >= 3 && professor && (!professor.apellido || professor.apellido.length === 0) && (
            <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
              {professor.nombre}
            </p>
          )}
        </div>
        {displayDuration >= 2 && (
          <div className="flex items-center justify-between text-[9px] text-muted-foreground">
            <span>{room?.codigo ?? 'Sin aula'}</span>
            <span>{slotsToLabel(displayDuration)}</span>
          </div>
        )}
      </div>

      {!block.locked && (
        <div
          onPointerDown={startResize}
          className={cn(
            'absolute bottom-0 left-0 right-0 h-1.5 cursor-ns-resize',
            'opacity-0 group-hover:opacity-100 transition-opacity',
            'flex items-center justify-center',
            colorStyle.solid,
            'rounded-b-md'
          )}
          style={{ opacity: resizing ? 1 : undefined }}
        >
          <GripVertical className="h-2 w-2 text-white/70 rotate-90" />
        </div>
      )}

      {/* Hover tooltip */}
      {sev !== 'none' && conflicts && conflicts.length > 0 && (
        <div className="pointer-events-none absolute left-full top-0 z-50 ml-2 hidden w-56 rounded-lg border border-status-critical/50 bg-card p-2 shadow-dark-xl group-hover:block">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-status-critical">
            {conflicts.length} {conflicts.length === 1 ? 'conflicto' : 'conflictos'}
          </p>
          {conflicts.slice(0, 3).map((c, i) => (
            <p key={i} className="text-[11px] text-foreground leading-snug">
              • {c.message}
            </p>
          ))}
          <p className="mt-1 text-[10px] text-muted-foreground">
            {slotToTime(block.startSlot)} – {slotToTime(block.startSlot + block.duration)}
          </p>
        </div>
      )}
    </div>
  )
}
