import { useState } from 'react'
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
            value={limitaciones.parqueoMax}
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
            value={limitaciones.descansoMinSlots}
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
        {limitaciones.notasGlobales.map((n, i) => (
          <div
            key={i}
            className="flex items-start gap-2 rounded-md border border-border bg-muted/20 p-2 text-[11px] text-foreground"
          >
            <span className="flex-1">{n}</span>
            <button
              onClick={() => removeNota(i)}
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
  const { mode, stack, weights, setMode, moveStackItem, setWeight, resetPrioridades } =
    usePrioridadesStore()

  const totalWeight = Object.values(weights).reduce((s, w) => s + w, 0)

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
          <p className="text-[10px] text-muted-foreground">
            Arrastra o usa flechas para reordenar. La primera tiene mayor prioridad.
          </p>
          {stack.map((id, index) => {
            const info = PRIORIDADES_CATALOG.find((p) => p.id === id)
            if (!info) return null
            return (
              <div
                key={id}
                className={cn(
                  'flex items-center gap-2 rounded-lg border border-border bg-card p-2 transition-colors hover:border-status-warning/30',
                  info.critical && 'border-status-critical/30 bg-status-critical/5',
                )}
              >
                <GripVertical className="h-3 w-3 shrink-0 text-muted-foreground" />
                <span className="mr-1 rounded bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-foreground">{info.label}</p>
                  <p className="text-[9px] text-muted-foreground">{info.description}</p>
                </div>
                <div className="flex flex-col">
                  <button
                    disabled={index === 0}
                    onClick={() => moveStackItem(index, index - 1)}
                    className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button
                    disabled={index === stack.length - 1}
                    onClick={() => moveStackItem(index, index + 1)}
                    className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )
          })}
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
  return (
    <label className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-1 py-0.5 hover:bg-muted/30">
      <span className="text-[11px] text-foreground">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative h-4 w-7 rounded-full transition-colors',
          checked ? 'bg-status-warning' : 'bg-muted',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-3 w-3 rounded-full bg-white transition-transform',
            checked ? 'translate-x-3.5' : 'translate-x-0.5',
          )}
        />
      </button>
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
