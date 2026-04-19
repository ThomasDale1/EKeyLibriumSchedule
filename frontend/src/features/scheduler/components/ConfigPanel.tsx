import { useId, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  Plus,
  RotateCcw,
  Settings2,
  Sliders,
  StickyNote,
  Trash2,
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '@/lib/utils'
import { useLimitacionesStore } from '../limitaciones'
import {
  usePrioridadesStore,
  PRIORIDADES_CATALOG,
} from '../prioridades'

export function ConfigPanel() {
  const [tab, setTab] = useState<'limitaciones' | 'prioridades'>('limitaciones')

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex border-b border-border">
        <TabBtn active={tab === 'limitaciones'} onClick={() => setTab('limitaciones')} icon={Settings2}>
          Limitantes
        </TabBtn>
        <TabBtn active={tab === 'prioridades'} onClick={() => setTab('prioridades')} icon={Sliders}>
          Prioridades
        </TabBtn>
      </div>
      <div className="flex-1 overflow-y-auto">
        {tab === 'limitaciones' ? <LimitacionesTab /> : <PrioridadesTab />}
      </div>
    </div>
  )
}

function TabBtn({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: typeof Settings2
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-1 items-center justify-center gap-1.5 px-3 py-2.5 text-[11px] font-semibold transition-colors',
        active
          ? 'border-b-2 border-status-warning text-status-warning'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  )
}

// ── Limitaciones Tab ──

function LimitacionesTab() {
  const { limitaciones, setLimitaciones, resetLimitaciones, addNota, removeNota } =
    useLimitacionesStore()
  const [newNota, setNewNota] = useState('')

  return (
    <div className="space-y-4 p-3">
      <Section title="Horario">
        <Toggle
          label="Incluir sábado"
          checked={limitaciones.incluirSabado}
          onChange={(v) => setLimitaciones({ incluirSabado: v })}
        />
        <Row label="Hora inicio mín.">
          <input
            type="time"
            value={limitaciones.horaInicioMin}
            onChange={(e) => setLimitaciones({ horaInicioMin: e.target.value })}
            className="h-7 rounded-md border border-border bg-background px-2 text-xs"
          />
        </Row>
        <Row label="Hora fin máx.">
          <input
            type="time"
            value={limitaciones.horaFinMax}
            onChange={(e) => setLimitaciones({ horaFinMax: e.target.value })}
            className="h-7 rounded-md border border-border bg-background px-2 text-xs"
          />
        </Row>
      </Section>

      <Section title="Recursos">
        <Toggle
          label="Validar salones"
          checked={limitaciones.usarSalones}
          onChange={(v) => setLimitaciones({ usarSalones: v })}
        />
        <Toggle
          label="Validar profesores"
          checked={limitaciones.usarProfesores}
          onChange={(v) => setLimitaciones({ usarProfesores: v })}
        />
        <Row label="Parqueo máximo">
          <input
            type="number"
            min={0}
            value={limitaciones.parqueoMax ?? ''}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setLimitaciones({ parqueoMax: Math.max(0, +e.target.value) })}
            className="h-7 w-16 rounded-md border border-border bg-background px-2 text-right text-xs"
          />
        </Row>
      </Section>

      <Section title="Restricciones de tiempo">
        <Toggle
          label="Bloquear almuerzo (12–13h)"
          checked={limitaciones.bloquearAlmuerzo}
          onChange={(v) => setLimitaciones({ bloquearAlmuerzo: v })}
        />
        <Toggle
          label="Bloquear desayuno (7–8h)"
          checked={limitaciones.bloquearDesayuno}
          onChange={(v) => setLimitaciones({ bloquearDesayuno: v })}
        />
        <Row label="Máx horas consecutivas">
          <input
            type="number"
            min={0}
            placeholder="Sin límite"
            value={limitaciones.maxHorasConsecutivas ?? ''}
            onFocus={(e) => e.target.select()}
            onChange={(e) =>
              setLimitaciones({
                maxHorasConsecutivas: e.target.value ? Math.max(1, +e.target.value) : null,
              })
            }
            className="h-7 w-16 rounded-md border border-border bg-background px-2 text-right text-xs"
          />
        </Row>
        <Row label="Descanso mín (slots)">
          <input
            type="number"
            min={0}
            value={limitaciones.descansoMinSlots ?? ''}
            onFocus={(e) => e.target.select()}
            onChange={(e) => setLimitaciones({ descansoMinSlots: Math.max(0, +e.target.value) })}
            className="h-7 w-16 rounded-md border border-border bg-background px-2 text-right text-xs"
          />
        </Row>
        <Row label="Máx bloques/día/materia">
          <input
            type="number"
            min={0}
            placeholder="Sin límite"
            value={limitaciones.maxBloquesPorDiaPorMateria ?? ''}
            onFocus={(e) => e.target.select()}
            onChange={(e) =>
              setLimitaciones({
                maxBloquesPorDiaPorMateria: e.target.value ? Math.max(1, +e.target.value) : null,
              })
            }
            className="h-7 w-16 rounded-md border border-border bg-background px-2 text-right text-xs"
          />
        </Row>
      </Section>

      <Section title="Secciones">
        <Toggle
          label="Apartar atrasados"
          checked={limitaciones.apartarAtrasados}
          onChange={(v) => setLimitaciones({ apartarAtrasados: v })}
        />
        <Toggle
          label="Apartar discapacitados"
          checked={limitaciones.apartarDiscapacitados}
          onChange={(v) => setLimitaciones({ apartarDiscapacitados: v })}
        />
        <Toggle
          label="Dividir secciones especiales"
          checked={limitaciones.dividirSeccionesEspeciales}
          onChange={(v) => setLimitaciones({ dividirSeccionesEspeciales: v })}
        />
        <Row label="Máx secciones/materia">
          <input
            type="number"
            min={0}
            placeholder="Sin límite"
            value={limitaciones.maxSeccionesPorMateria ?? ''}
            onFocus={(e) => e.target.select()}
            onChange={(e) =>
              setLimitaciones({
                maxSeccionesPorMateria: e.target.value ? Math.max(1, +e.target.value) : null,
              })
            }
            className="h-7 w-20 rounded-md border border-border bg-background px-2 text-right text-xs"
          />
        </Row>
      </Section>

      <Section title="Reglas">
        <Toggle
          label="Obedecer notas de materia"
          checked={limitaciones.obedecerNotasMateria}
          onChange={(v) => setLimitaciones({ obedecerNotasMateria: v })}
        />
        <Toggle
          label="Respetar bloques bloqueados"
          checked={limitaciones.respetarBloquesLock}
          onChange={(v) => setLimitaciones({ respetarBloquesLock: v })}
        />
      </Section>

      <Section title="Duraciones permitidas (slots)">
        <div className="flex flex-wrap gap-1">
          {[1, 2, 3, 4, 5, 6, 8, 10].map((d) => {
            const active = limitaciones.duracionesPermitidas.includes(d)
            return (
              <button
                key={d}
                onClick={() =>
                  setLimitaciones({
                    duracionesPermitidas: active
                      ? limitaciones.duracionesPermitidas.filter((x) => x !== d)
                      : [...limitaciones.duracionesPermitidas, d].sort((a, b) => a - b),
                  })
                }
                className={cn(
                  'rounded-md border px-2 py-0.5 text-[10px] font-medium transition-colors',
                  active
                    ? 'border-status-warning bg-status-warning/10 text-status-warning'
                    : 'border-border bg-muted text-muted-foreground hover:text-foreground',
                )}
              >
                {d}
              </button>
            )
          })}
        </div>
      </Section>

      <Section title="Notas globales" icon={StickyNote}>
        {limitaciones.notasGlobales.map((nota) => (
          <div
            key={nota.id}
            className="flex items-start gap-2 rounded-md border border-border bg-muted/20 p-2 text-[11px] text-foreground"
          >
            <span className="flex-1">{nota.text}</span>
            <button
              onClick={() => removeNota(nota.id)}
              className="shrink-0 text-muted-foreground hover:text-status-critical"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        ))}
        <div className="flex gap-1.5">
          <input
            value={newNota}
            onChange={(e) => setNewNota(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newNota.trim()) {
                addNota(newNota.trim())
                setNewNota('')
              }
            }}
            placeholder="Ej: Viernes 2pm-3pm libre..."
            className="h-7 flex-1 rounded-md border border-border bg-background px-2 text-xs focus:border-status-warning/50 focus:outline-none"
          />
          <button
            onClick={() => {
              if (newNota.trim()) {
                addNota(newNota.trim())
                setNewNota('')
              }
            }}
            className="flex h-7 items-center gap-1 rounded-md border border-border bg-card px-2 text-[10px] hover:bg-muted"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </Section>

      <button
        onClick={resetLimitaciones}
        className="flex w-full items-center justify-center gap-1.5 rounded-md border border-border bg-card py-2 text-[11px] text-muted-foreground hover:text-foreground"
      >
        <RotateCcw className="h-3 w-3" />
        Restaurar valores por defecto
      </button>
    </div>
  )
}

// ── Prioridades Tab ──

function PrioridadesTab() {
  const { mode, stack, weights, setMode, moveStackItem, setWeight, resetPrioridades, setStack } =
    usePrioridadesStore()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const totalWeight = Object.values(weights).reduce((s, w) => s + w, 0)

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = stack.indexOf(active.id)
      const newIndex = stack.indexOf(over.id)
      if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
        setStack(arrayMove(stack, oldIndex, newIndex))
      }
    }
  }

  return (
    <div className="space-y-4 p-3">
      <div className="flex gap-1.5 rounded-lg border border-border bg-muted/20 p-1">
        <ModeBtn active={mode === 'stack'} onClick={() => setMode('stack')}>
          Stack (orden)
        </ModeBtn>
        <ModeBtn active={mode === 'weights'} onClick={() => setMode('weights')}>
          Pesos (%)
        </ModeBtn>
      </div>

      {mode === 'stack' ? (
        <div className="space-y-1">
          <p className="mb-2 text-[10px] text-muted-foreground">
            Arrastra para reordenar. El primer elemento tiene la mayor prioridad.
          </p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={stack} strategy={verticalListSortingStrategy}>
              <div className="space-y-1">
                {stack.map((id, index) => {
                  const info = PRIORIDADES_CATALOG.find((p) => p.id === id)
                  if (!info) return null
                  return (
                    <SortablePriorityItem
                      key={id}
                      id={id}
                      index={index}
                      info={info}
                      isFirst={index === 0}
                      isLast={index === stack.length - 1}
                      onMoveUp={() => moveStackItem(index, index - 1)}
                      onMoveDown={() => moveStackItem(index, index + 1)}
                    />
                  )
                })}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Total</span>
            <span
              className={cn(
                'font-mono font-semibold',
                Math.abs(totalWeight - 1) < 0.01
                  ? 'text-status-success'
                  : 'text-status-critical',
              )}
            >
              {(totalWeight * 100).toFixed(0)}%
              {Math.abs(totalWeight - 1) >= 0.01 && ' (debe ser 100%)'}
            </span>
          </div>
          {PRIORIDADES_CATALOG.map((info) => (
            <div key={info.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-foreground">{info.label}</span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {((weights[info.id] ?? 0) * 100).toFixed(0)}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={(weights[info.id] ?? 0) * 100}
                onChange={(e) => setWeight(info.id, +e.target.value / 100)}
                aria-label={`Peso para ${info.label}`}
                className="h-1.5 w-full accent-status-warning"
              />
            </div>
          ))}
        </div>
      )}

      <button
        onClick={resetPrioridades}
        className="flex w-full items-center justify-center gap-1.5 rounded-md border border-border bg-card py-2 text-[11px] text-muted-foreground hover:text-foreground"
      >
        <RotateCcw className="h-3 w-3" />
        Restaurar por defecto
      </button>
    </div>
  )
}

function SortablePriorityItem({
  id,
  index,
  info,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  id: string
  index: number
  info: any
  onMoveUp: () => void
  onMoveDown: () => void
  isFirst: boolean
  isLast: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-2 rounded-lg border border-border bg-card p-2 transition-colors',
        !isDragging && 'hover:border-status-warning/30',
        isDragging && 'z-50 border-status-warning bg-card shadow-xl opacity-90',
        // Dynamic coloring based on position (1st, 2nd, 3rd)
        !isDragging && index === 0 && 'border-status-warning bg-status-warning/5',
        !isDragging && index === 1 && 'border-status-warning/60 bg-status-warning/[0.02]',
        !isDragging && index === 2 && 'border-status-warning/30 bg-status-warning/[0.01]',
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab p-1 -ml-1 rounded hover:bg-muted active:cursor-grabbing"
      >
        <GripVertical className="h-3 w-3 shrink-0 text-muted-foreground" />
      </div>

      <span
        className={cn(
          'mr-1 rounded px-1.5 py-0.5 font-mono text-[9px] font-bold transition-colors',
          index === 0
            ? 'bg-status-warning text-white'
            : index === 1
              ? 'bg-status-warning/60 text-white'
              : index === 2
                ? 'bg-status-warning/30 text-white'
                : 'bg-muted text-muted-foreground',
        )}
      >
        {index + 1}
      </span>

      <div className="min-w-0 flex-1">
        <p className={cn('text-[11px] font-medium text-foreground', index === 0 && 'text-status-warning')}>
          {info.label}
        </p>
        <p className="truncate text-[9px] text-muted-foreground">{info.description}</p>
      </div>

      <div className="flex flex-col opacity-0 transition-opacity group-hover:opacity-100">
        <button
          disabled={isFirst}
          onClick={(e) => {
            e.stopPropagation()
            onMoveUp()
          }}
          className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-0"
        >
          <ArrowUp className="h-3 w-3" />
        </button>
        <button
          disabled={isLast}
          onClick={(e) => {
            e.stopPropagation()
            onMoveDown()
          }}
          className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-0"
        >
          <ArrowDown className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

// ── Shared UI ──

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon?: typeof Settings2
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5">
        {Icon && <Icon className="h-3 w-3 text-muted-foreground" />}
        <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h4>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  const id = useId()

  return (
    <label className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-1 py-0.5 hover:bg-muted/30">
      <span className="text-[11px] text-foreground">{label}</span>
      <span className="relative inline-flex h-4 w-7 items-center">
        <input
          id={id}
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span
          aria-hidden="true"
          className={cn(
            'block h-4 w-7 rounded-full transition-colors',
            checked ? 'bg-status-warning' : 'bg-muted',
          )}
        >
          <span
            className={cn(
              'absolute left-0.5 top-0.5 h-3 w-3 rounded-full bg-white transition-transform',
              checked ? 'translate-x-3.5' : 'translate-x-0.5',
            )}
          />
        </span>
      </span>
    </label>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2 px-1">
      <span className="text-[11px] text-foreground">{label}</span>
      {children}
    </div>
  )
}

function ModeBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors',
        active
          ? 'bg-status-warning text-white'
          : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {children}
    </button>
  )
}
