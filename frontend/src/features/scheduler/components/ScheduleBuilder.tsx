import { useMemo, useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { AlertTriangle, CheckCircle2, Keyboard, Trash2 } from 'lucide-react'
import { useScheduleStore, useActiveSchedule } from '../store'
import { detectConflicts } from '../conflicts'
import { useKeyboardShortcuts } from '../useKeyboardShortcuts'
import { useScheduleSync } from '../useScheduleSync'
import { WeekGrid } from './WeekGrid'
import { SubjectPalette } from './SubjectPalette'
import { InspectorPanel } from './InspectorPanel'
import { VersionBar } from './VersionBar'
import { AutoSectionsDialog } from './AutoSectionsDialog'
import type { BlockDragData, DragData, DropCellData, PaletteDragData, ScheduleBlock } from '../types'
import { COLOR_STYLES } from '../colors'
import { cn } from '@/lib/utils'
import { slotToTime } from '../constants'

export function ScheduleBuilder() {
  const subjects = useScheduleStore((s) => s.subjects)
  const professors = useScheduleStore((s) => s.professors)
  const rooms = useScheduleStore((s) => s.rooms)
  const activeSchedule = useActiveSchedule()
  const selectedBlockId = useScheduleStore((s) => s.selectedBlockId)
  const cicloFilter = useScheduleStore((s) => s.cicloFilter)
  const selectBlock = useScheduleStore((s) => s.selectBlock)
  const moveBlock = useScheduleStore((s) => s.moveBlock)
  const addBlockFromSubject = useScheduleStore((s) => s.addBlockFromSubject)
  const duplicateBlock = useScheduleStore((s) => s.duplicateBlock)
  const updateBlock = useScheduleStore((s) => s.updateBlock)
  const toggleLock = useScheduleStore((s) => s.toggleLock)
  const removeBlock = useScheduleStore((s) => s.removeBlock)
  const setCicloFilter = useScheduleStore((s) => s.setCicloFilter)

  const blocks = activeSchedule.blocks

  const { status: syncStatus, saveNow, deletePlan, lastSaved } = useScheduleSync()

  const [activeDrag, setActiveDrag] = useState<DragData | null>(null)
  const [autoSectionsOpen, setAutoSectionsOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)

  useKeyboardShortcuts()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor)
  )

  const conflicts = useMemo(() => detectConflicts(blocks, subjects, rooms), [blocks, subjects, rooms])

  const sectionCounts = useMemo(() => {
    const m = new Map<string, number>()
    for (const b of blocks) m.set(b.subjectId, (m.get(b.subjectId) ?? 0) + 1)
    return m
  }, [blocks])

  const selected = blocks.find((b) => b.id === selectedBlockId) ?? null
  const selectedSubject = selected ? subjects.find((s) => s.id === selected.subjectId) ?? null : null
  const selectedConflicts = selectedBlockId ? conflicts.get(selectedBlockId) : undefined

  const onDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as DragData | undefined
    if (data) setActiveDrag(data)
  }, [])

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDrag(null)
      const { active, over } = event
      const data = active.data.current as DragData | undefined
      if (!data) return

      if (over?.id === 'trash-zone') {
        if (data.type === 'block') removeBlock(data.blockId)
        return
      }

      if (!over) return
      const cell = over.data.current as DropCellData | undefined
      if (!cell || cell.type !== 'cell') return

      if (data.type === 'palette') {
        addBlockFromSubject(data.subjectId, cell.day, cell.slot)
        return
      }

      if (data.type === 'block') {
        const block = blocks.find((b) => b.id === data.blockId)
        if (!block || block.locked) return
        const alt = (event.activatorEvent as MouseEvent | undefined)?.altKey ?? data.altKey
        if (alt) {
          duplicateBlock(block.id, cell.day, cell.slot)
        } else {
          moveBlock(block.id, cell.day, cell.slot)
        }
      }
    },
    [addBlockFromSubject, blocks, duplicateBlock, moveBlock, removeBlock]
  )

  const totalConflicts = conflicts.size
  const totalHours = blocks.reduce((sum, b) => sum + b.duration, 0) / 2

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveDrag(null)}
    >
      <div className="space-y-3">
        <VersionBar
          onOpenAutoSections={() => setAutoSectionsOpen(true)}
          syncStatus={syncStatus}
          onSaveNow={saveNow}
          onDeletePlan={deletePlan}
          lastSaved={lastSaved}
        />

        <div className="flex flex-wrap items-center gap-2">
          <StatChip>
            <span className="text-muted-foreground">Bloques</span>
            <span className="font-semibold text-foreground">{blocks.length}</span>
          </StatChip>
          <StatChip>
            <span className="text-muted-foreground">Horas/sem</span>
            <span className="font-semibold text-foreground">{totalHours.toFixed(1)}h</span>
          </StatChip>
          {totalConflicts > 0 ? (
            <StatChip tone="critical">
              <AlertTriangle className="h-3 w-3" />
              <span>
                {totalConflicts} {totalConflicts === 1 ? 'bloque en conflicto' : 'bloques en conflicto'}
              </span>
            </StatChip>
          ) : (
            <StatChip tone="success">
              <CheckCircle2 className="h-3 w-3" />
              <span>Sin conflictos</span>
            </StatChip>
          )}
          <div className="ml-auto flex items-center gap-2">
            <TrashDropZone active={activeDrag?.type === 'block'} />
            <button
              onClick={() => setShortcutsOpen(!shortcutsOpen)}
              className="flex h-7 items-center gap-1 rounded-md border border-border bg-card px-2 text-[10px] text-muted-foreground hover:border-status-warning/50 hover:text-foreground"
              title="Atajos de teclado"
              aria-label="Mostrar atajos de teclado"
            >
              <Keyboard className="h-3 w-3" />
              <span className="hidden sm:inline">Atajos</span>
            </button>
          </div>
        </div>

        {shortcutsOpen && <ShortcutsPanel onClose={() => setShortcutsOpen(false)} />}

        <div className="grid gap-4 lg:grid-cols-[260px_1fr_320px]">
          <div className="h-[720px]">
            <SubjectPalette
              subjects={subjects}
              cicloFilter={cicloFilter}
              onCicloFilterChange={setCicloFilter}
              sectionCounts={sectionCounts}
            />
          </div>

          <div className="h-[720px] overflow-hidden print:h-auto print:overflow-visible" data-print-target>
            <WeekGrid
              blocks={blocks}
              subjects={subjects}
              professors={professors}
              rooms={rooms}
              conflicts={conflicts}
              selectedBlockId={selectedBlockId}
              onSelectBlock={selectBlock}
            />
          </div>

          <div className="h-[720px] print:hidden">
            <InspectorPanel
              block={selected}
              subject={selectedSubject}
              professors={professors}
              rooms={rooms}
              conflicts={selectedConflicts}
              onClose={() => selectBlock(null)}
              onUpdate={(patch) => selected && updateBlock(selected.id, patch)}
              onToggleLock={() => selected && toggleLock(selected.id)}
              onDuplicate={() =>
                selected && duplicateBlock(selected.id, selected.day, Math.min(selected.startSlot + selected.duration, 28 - selected.duration))
              }
              onDelete={() => selected && removeBlock(selected.id)}
            />
          </div>
        </div>
      </div>

      <AutoSectionsDialog open={autoSectionsOpen} onClose={() => setAutoSectionsOpen(false)} />

      <DragOverlay dropAnimation={null}>
        {activeDrag && <DragPreview drag={activeDrag} />}
      </DragOverlay>
    </DndContext>
  )
}

function ShortcutsPanel({ onClose }: { onClose: () => void }) {
  const shortcuts = [
    { keys: ['Tab'], action: 'Navegar entre bloques' },
    { keys: ['Space'], action: 'Levantar bloque (y mover con flechas)' },
    { keys: ['←', '→'], action: 'Mover bloque entre días' },
    { keys: ['↑', '↓'], action: 'Mover bloque por slots (30min)' },
    { keys: ['Shift', '↑↓'], action: 'Redimensionar duración' },
    { keys: ['D'], action: 'Duplicar seleccionado' },
    { keys: ['L'], action: 'Bloquear / desbloquear' },
    { keys: ['Del'], action: 'Eliminar bloque' },
    { keys: ['Esc'], action: 'Deseleccionar' },
  ]
  return (
    <div className="rounded-lg border border-border bg-card/80 p-3 text-xs">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-semibold text-foreground">Atajos de teclado</span>
        <button onClick={onClose} className="text-[10px] text-muted-foreground hover:text-foreground">
          Ocultar
        </button>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 md:grid-cols-3">
        {shortcuts.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex gap-0.5">
              {s.keys.map((k, ki) => (
                <kbd
                  key={ki}
                  className="min-w-[1.5rem] rounded border border-border bg-background px-1 text-center font-mono text-[10px] text-foreground"
                >
                  {k}
                </kbd>
              ))}
            </div>
            <span className="text-[11px] text-muted-foreground">{s.action}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DragPreview({ drag }: { drag: DragData }) {
  const subjects = useScheduleStore((s) => s.subjects)
  const activeSchedule = useActiveSchedule()

  let subject: (typeof subjects)[number] | undefined
  let block: ScheduleBlock | undefined
  if (drag.type === 'palette') {
    subject = subjects.find((s) => s.id === (drag as PaletteDragData).subjectId)
  } else {
    block = activeSchedule.blocks.find((b) => b.id === (drag as BlockDragData).blockId)
    if (block) subject = subjects.find((s) => s.id === block!.subjectId)
  }
  if (!subject) return null

  const color = COLOR_STYLES[subject.color]
  return (
    <div
      className={cn(
        'rounded-md border px-2 py-1.5 shadow-dark-xl',
        color.bg,
        color.border,
        'backdrop-blur'
      )}
      style={{ width: 180 }}
    >
      <div className="flex items-center gap-1">
        <span className={cn('font-mono text-[10px] font-semibold', color.text)}>{subject.codigo}</span>
        {block && <span className="text-[10px] text-muted-foreground">·{block.sectionLabel}</span>}
      </div>
      <p className="mt-0.5 truncate text-[11px] font-medium text-foreground">{subject.nombre}</p>
      {block && (
        <p className="mt-0.5 text-[9px] text-muted-foreground">
          {slotToTime(block.startSlot)}–{slotToTime(block.startSlot + block.duration)}
        </p>
      )}
    </div>
  )
}

function TrashDropZone({ active }: { active: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'trash-zone' })
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-[11px] font-medium transition-all',
        active
          ? isOver
            ? 'border-status-critical bg-status-critical text-white scale-105'
            : 'border-status-critical/50 bg-status-critical/10 text-status-critical'
          : 'border-border bg-muted/30 text-muted-foreground opacity-50'
      )}
    >
      <Trash2 className="h-3.5 w-3.5" />
      {active ? 'Soltar para eliminar' : 'Papelera'}
    </div>
  )
}

function StatChip({
  children,
  tone = 'muted',
}: {
  children: React.ReactNode
  tone?: 'muted' | 'success' | 'critical'
}) {
  const map = {
    muted: 'border-border bg-muted/40 text-foreground',
    success: 'border-status-success/40 bg-status-success/10 text-status-success',
    critical: 'border-status-critical/40 bg-status-critical/10 text-status-critical',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px]',
        map[tone]
      )}
    >
      {children}
    </span>
  )
}
