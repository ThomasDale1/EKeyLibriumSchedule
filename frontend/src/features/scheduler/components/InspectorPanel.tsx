import { Lock, Unlock, Copy, Trash2, AlertTriangle, X, Clock, Users, MapPin, User as UserIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DAYS, slotToTime, slotsToLabel } from '../constants'
import type { Conflict, Professor, Room, ScheduleBlock, Subject } from '../types'
import { COLOR_STYLES } from '../colors'

type Props = {
  block: ScheduleBlock | null
  subject: Subject | null
  professors: Professor[]
  rooms: Room[]
  conflicts: Conflict[] | undefined
  onClose: () => void
  onUpdate: (patch: Partial<ScheduleBlock>) => void
  onToggleLock: () => void
  onDuplicate: () => void
  onDelete: () => void
}

export function InspectorPanel({
  block,
  subject,
  professors,
  rooms,
  conflicts,
  onClose,
  onUpdate,
  onToggleLock,
  onDuplicate,
  onDelete,
}: Props) {
  if (!block || !subject) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <div className="mb-3 rounded-full bg-muted p-3">
          <UserIcon className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium text-foreground">Sin selección</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Selecciona un bloque del calendario para editar sus detalles
        </p>
      </div>
    )
  }

  const color = COLOR_STYLES[subject.color] ?? { bg: 'bg-muted/50', text: 'text-foreground' }
  const hasCritical = conflicts?.some((c) =>
    ['time-overlap', 'professor-busy', 'room-busy'].includes(c.kind)
  )

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className={cn('border-b border-border p-4', color.bg)}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={cn('font-mono text-[11px] font-semibold', color.text)}>
                {subject.codigo}
              </span>
              <span className="rounded bg-black/20 px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
                §{block.sectionLabel}
              </span>
              {block.locked && <Lock className="h-3 w-3 text-muted-foreground" />}
            </div>
            <h3 className="mt-1 truncate text-base font-semibold text-foreground">{subject.nombre}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-background/50 hover:text-foreground"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-3 text-xs text-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3 text-muted-foreground" />
            {DAYS[block.day]} · {slotToTime(block.startSlot)}–{slotToTime(block.startSlot + block.duration)}
          </span>
          <span className="text-muted-foreground">{slotsToLabel(block.duration)}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="rounded bg-black/15 px-1.5 py-0.5 text-[10px] text-foreground">
            {subject.creditos} créditos
          </span>
          <span className="rounded bg-black/15 px-1.5 py-0.5 text-[10px] text-foreground">
            {subject.horasSemanales}h/sem
          </span>
          <span className="rounded bg-black/15 px-1.5 py-0.5 text-[10px] text-foreground">
            Ciclo {subject.ciclo}
          </span>
          <span className="rounded bg-black/15 px-1.5 py-0.5 text-[10px] text-foreground">
            {subject.tipoAula}
          </span>
        </div>
      </div>

      {conflicts && conflicts.length > 0 && (
        <div
          className={cn(
            'border-b border-border px-4 py-2.5',
            hasCritical ? 'bg-status-critical/10' : 'bg-status-warning/10'
          )}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle
              className={cn('h-3.5 w-3.5', hasCritical ? 'text-status-critical' : 'text-status-warning')}
            />
            <span className={cn('text-[11px] font-semibold uppercase tracking-wider', hasCritical ? 'text-status-critical' : 'text-status-warning')}>
              {conflicts.length} {conflicts.length === 1 ? 'conflicto' : 'conflictos'}
            </span>
          </div>
          <ul className="mt-1.5 space-y-0.5 text-[11px] text-foreground">
            {conflicts.map((c, i) => (
              <li key={i}>• {c.message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <Field label="Profesor" icon={UserIcon}>
          <select
            disabled={block.locked}
            value={block.professorId ?? ''}
            onChange={(e) => onUpdate({ professorId: e.target.value || null })}
            className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm focus:border-status-warning/50 focus:outline-none disabled:opacity-50"
          >
            <option value="">— Sin asignar —</option>
            {professors.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} {p.apellido} ({p.codigo})
              </option>
            ))}
          </select>
        </Field>

        <Field label="Aula" icon={MapPin}>
          <select
            disabled={block.locked}
            value={block.roomId ?? ''}
            onChange={(e) => onUpdate({ roomId: e.target.value || null })}
            className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm focus:border-status-warning/50 focus:outline-none disabled:opacity-50"
          >
            <option value="">— Sin asignar —</option>
            {rooms
              .filter((r) => r.capacidad >= block.studentsExpected && r.tipo === subject.tipoAula)
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.codigo} — {r.nombre} (cap. {r.capacidad})
                </option>
              ))}
            {rooms.filter((r) => r.capacidad < block.studentsExpected || r.tipo !== subject.tipoAula).length > 0 && (
              <optgroup label="No recomendadas">
                {rooms
                  .filter((r) => r.capacidad < block.studentsExpected || r.tipo !== subject.tipoAula)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.codigo} — {r.nombre} (cap. {r.capacidad}, {r.tipo})
                    </option>
                  ))}
              </optgroup>
            )}
          </select>
        </Field>

        <Field label="Sección" icon={Users}>
          <input
            disabled={block.locked}
            value={block.sectionLabel}
            onChange={(e) => onUpdate({ sectionLabel: e.target.value })}
            className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm focus:border-status-warning/50 focus:outline-none disabled:opacity-50"
          />
        </Field>

        <Field label="Estudiantes esperados" icon={Users}>
          <input
            type="number"
            min={1}
            disabled={block.locked}
            value={block.studentsExpected}
            onFocus={(e) => e.target.select()}
            onChange={(e) => onUpdate({ studentsExpected: Math.max(1, parseInt(e.target.value) || 1) })}
            className="h-9 w-full rounded-md border border-border bg-background px-2 text-sm focus:border-status-warning/50 focus:outline-none disabled:opacity-50"
          />
        </Field>

        <Field label="Duración (slots de 30min)" icon={Clock}>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={20}
              disabled={block.locked}
              value={block.duration}
              onFocus={(e) => e.target.select()}
              onChange={(e) => onUpdate({ duration: Math.min(20, Math.max(1, parseInt(e.target.value) || 1)) })}
              className="h-9 w-20 rounded-md border border-border bg-background px-2 text-sm focus:border-status-warning/50 focus:outline-none disabled:opacity-50"
            />
            <span className="text-xs text-muted-foreground">= {slotsToLabel(block.duration)}</span>
          </div>
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-border bg-muted/20 p-3">
        <ActionBtn onClick={onToggleLock} icon={block.locked ? Unlock : Lock} label={block.locked ? 'Desbloquear' : 'Bloquear'} />
        <ActionBtn onClick={onDuplicate} icon={Copy} label="Duplicar" />
        <ActionBtn onClick={onDelete} icon={Trash2} label="Eliminar" destructive />
      </div>
    </div>
  )
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </label>
      {children}
    </div>
  )
}

function ActionBtn({
  onClick,
  icon: Icon,
  label,
  destructive,
}: {
  onClick: () => void
  icon: React.ComponentType<{ className?: string }>
  label: string
  destructive?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-1 rounded-md border border-border bg-card px-2 py-2 text-[10px] font-medium transition-colors',
        destructive
          ? 'hover:border-status-critical/50 hover:bg-status-critical/10 hover:text-status-critical'
          : 'hover:border-status-warning/50 hover:bg-status-warning/10 hover:text-status-warning'
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}
