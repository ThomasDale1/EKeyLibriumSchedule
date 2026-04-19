import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  Clock,
  GraduationCap,
  Layers,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge, Card, EmptyState, PageHeader, Skeleton, StatCard } from '@/components/admin/ui'
import { Carreras, Materias as MateriasApi } from '@/hooks/useApiQueries'
import { FormModal, Field, inputClass } from '@/components/admin/FormModal'
import type { Carrera, Materia, TipoAula } from '@/lib/types'

const TIPOS_AULA: TipoAula[] = ['TEORIA', 'LABORATORIO_COMPUTO', 'LABORATORIO_CIENCIAS', 'AUDITORIO']

const TIPO_AULA_LABEL: Record<TipoAula, string> = {
  TEORIA: 'Teoría',
  LABORATORIO_COMPUTO: 'Lab. Cómputo',
  LABORATORIO_CIENCIAS: 'Lab. Ciencias',
  AUDITORIO: 'Auditorio',
}

const TIPO_AULA_COLOR: Record<TipoAula, { bg: string; border: string; text: string; badge: string }> = {
  TEORIA: {
    bg: 'bg-status-info/8',
    border: 'border-status-info/25',
    text: 'text-status-info',
    badge: 'bg-status-info/15 text-status-info border-status-info/20',
  },
  LABORATORIO_COMPUTO: {
    bg: 'bg-violet-500/8',
    border: 'border-violet-500/25',
    text: 'text-violet-400',
    badge: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
  },
  LABORATORIO_CIENCIAS: {
    bg: 'bg-status-success/8',
    border: 'border-status-success/25',
    text: 'text-status-success',
    badge: 'bg-status-success/15 text-status-success border-status-success/20',
  },
  AUDITORIO: {
    bg: 'bg-status-warning/8',
    border: 'border-status-warning/25',
    text: 'text-status-warning',
    badge: 'bg-status-warning/15 text-status-warning border-status-warning/20',
  },
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']

export default function Materias() {
  const { data: materias = [], isLoading, error } = MateriasApi.useList()
  const { data: carreras = [] } = Carreras.useList()
  const create = MateriasApi.useCreate()
  const remove = MateriasApi.useDelete()

  const createCarrera = Carreras.useCreate()

  const [selectedCarreraId, setSelectedCarreraId] = useState<string>('')
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [carreraModalOpen, setCarreraModalOpen] = useState(false)
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(new Set())
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null)
  const [form, setForm] = useState({
    codigo: '',
    nombre: '',
    creditos: 4,
    horasSemanales: 4,
    ciclo: 1,
    tipoAula: 'TEORIA' as TipoAula,
    carreraId: '',
  })
  const [carreraForm, setCarreraForm] = useState({
    nombre: '',
    codigo: '',
    duracionCiclos: 10,
    descripcion: '',
  })

  const selectedCarrera = carreras.find((c) => c.id === selectedCarreraId) ?? carreras[0]

  const filtered = useMemo(() => {
    let list = materias
    const carreraId = selectedCarreraId || carreras[0]?.id
    if (carreraId) list = list.filter((m) => m.carreraId === carreraId)
    const q = search.trim().toLowerCase()
    if (q) list = list.filter((m) => m.codigo.toLowerCase().includes(q) || m.nombre.toLowerCase().includes(q))
    return list
  }, [materias, carreras, selectedCarreraId, search])

  const maxCiclo = selectedCarrera?.duracionCiclos ?? Math.max(1, ...filtered.map((m) => m.ciclo ?? 1))

  const cicloColumns = useMemo(() => {
    const cols: Materia[][] = Array.from({ length: maxCiclo }, () => [])
    for (const m of filtered) {
      const idx = Math.max(0, Math.min(maxCiclo - 1, (m.ciclo ?? 1) - 1))
      cols[idx].push(m)
    }
    return cols
  }, [filtered, maxCiclo])

  const totalCreditos = filtered.reduce((sum, m) => sum + m.creditos, 0)
  const totalHoras = filtered.reduce((sum, m) => sum + m.horasSemanales, 0)
  const activas = filtered.filter((m) => m.activa).length

  const submit = async () => {
    const carreraId = form.carreraId || selectedCarrera?.id
    if (!carreraId) return alert('Selecciona una carrera')
    try {
      await create.mutateAsync({ ...form, carreraId })
      setOpen(false)
      setForm({ codigo: '', nombre: '', creditos: 4, horasSemanales: 4, ciclo: 1, tipoAula: 'TEORIA', carreraId: '' })
    } catch (e: unknown) {
      const message = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al crear'
      alert(message)
    }
  }

  const submitCarrera = async () => {
    if (!carreraForm.nombre.trim() || !carreraForm.codigo.trim()) return alert('Nombre y código son requeridos')
    try {
      await createCarrera.mutateAsync(carreraForm)
      setCarreraModalOpen(false)
      setCarreraForm({ nombre: '', codigo: '', duracionCiclos: 10, descripcion: '' })
    } catch (e: unknown) {
      const message = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al crear carrera'
      alert(message)
    }
  }

  const handleDelete = async (m: Materia) => {
    if (!confirm(`¿Eliminar ${m.nombre}?`)) return
    setPendingDeleteIds((prev) => new Set(prev).add(m.id))
    try {
      await remove.mutateAsync(m.id)
    } catch (e: unknown) {
      const message = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al eliminar'
      alert(message)
    } finally {
      setPendingDeleteIds((prev) => {
        const s = new Set(prev)
        s.delete(m.id)
        return s
      })
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Malla Curricular"
        description="Visualiza y gestiona las materias organizadas por ciclo académico"
        actions={
          <button
            onClick={() => {
              setForm((f) => ({ ...f, carreraId: selectedCarrera?.id ?? '' }))
              setOpen(true)
            }}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-status-warning px-4 text-sm font-semibold text-white hover:bg-status-warning/90"
          >
            <Plus className="h-4 w-4" /> Nueva Materia
          </button>
        }
      />

      {/* ── Toolbar: Carrera selector + search + stats ── */}
      <div className="flex flex-wrap items-center gap-3">
        <CarreraDropdown
          carreras={carreras}
          selected={selectedCarrera}
          onChange={setSelectedCarreraId}
        />

        <button
          onClick={() => setCarreraModalOpen(true)}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-dashed border-border bg-card px-3 text-sm text-muted-foreground hover:border-status-warning/50 hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" /> Carrera
        </button>

        <div className="relative min-w-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar materia..."
            className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm focus:border-status-warning/50 focus:outline-none"
          />
        </div>

        <div className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" /> {filtered.length} materias
          </span>
          <span className="flex items-center gap-1.5">
            <GraduationCap className="h-3.5 w-3.5" /> {totalCreditos} créditos
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" /> {totalHoras} hrs/sem
          </span>
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap items-center gap-2">
        {TIPOS_AULA.map((t) => (
          <span
            key={t}
            className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium ${TIPO_AULA_COLOR[t].badge}`}
          >
            <span className={`h-2 w-2 rounded-full ${TIPO_AULA_COLOR[t].text} bg-current`} />
            {TIPO_AULA_LABEL[t]}
          </span>
        ))}
      </div>

      {/* ── Malla grid ── */}
      {isLoading ? (
        <div className="overflow-x-auto pb-4">
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${maxCiclo}, minmax(180px, 1fr))` }}>
            {Array.from({ length: maxCiclo }, (_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full opacity-60" />
              </div>
            ))}
          </div>
        </div>
      ) : error ? (
        <EmptyState
          icon={AlertTriangle}
          title="Error al cargar materias"
          description="Verifica tu conexión e intenta de nuevo"
        />
      ) : filtered.length === 0 && !search ? (
        <EmptyState
          icon={Layers}
          title="No hay materias en esta carrera"
          description="Crea la primera materia para empezar a armar la malla curricular"
          action={
            carreras.length > 0 ? (
              <button
                onClick={() => {
                  setForm((f) => ({ ...f, carreraId: selectedCarrera?.id ?? '' }))
                  setOpen(true)
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-status-warning px-4 py-2 text-sm font-semibold text-white hover:bg-status-warning/90"
              >
                <Plus className="h-4 w-4" /> Nueva Materia
              </button>
            ) : (
              <button
                onClick={() => alert('Crea una carrera primero para poder agregar materias.')}
                className="inline-flex items-center gap-2 rounded-lg bg-status-warning px-4 py-2 text-sm font-semibold text-white hover:bg-status-warning/90"
              >
                <Plus className="h-4 w-4" /> Crea una carrera primero
              </button>
            )
          }
        />
      ) : (
        <div className="overflow-x-auto pb-4">
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: `repeat(${maxCiclo}, minmax(180px, 1fr))`,
            }}
          >
            {/* Column headers */}
            {cicloColumns.map((_, i) => (
              <div
                key={`header-${i}`}
                className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2"
              >
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Ciclo {ROMAN[i] ?? i + 1}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {cicloColumns[i].length} mat.
                </span>
              </div>
            ))}

            {/* Card columns */}
            {cicloColumns.map((col, i) => (
              <div key={`col-${i}`} className="flex flex-col gap-2">
                {col.length === 0 ? (
                  <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border/50 text-[11px] text-muted-foreground/40">
                    Sin materias
                  </div>
                ) : (
                  col.map((m) => (
                    <MateriaCard
                      key={m.id}
                      materia={m}
                      expanded={expandedCardId === m.id}
                      onToggle={() => setExpandedCardId(expandedCardId === m.id ? null : m.id)}
                      onDelete={() => handleDelete(m)}
                      deleting={pendingDeleteIds.has(m.id)}
                    />
                  ))
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Summary per ciclo ── */}
      {!isLoading && filtered.length > 0 && (
        <div className="overflow-x-auto">
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: `repeat(${maxCiclo}, minmax(180px, 1fr))`,
            }}
          >
            {cicloColumns.map((col, i) => {
              const creds = col.reduce((s, m) => s + m.creditos, 0)
              const hrs = col.reduce((s, m) => s + m.horasSemanales, 0)
              return (
                <div
                  key={`summary-${i}`}
                  className="flex items-center justify-between rounded-lg border border-border/40 bg-card/50 px-3 py-1.5 text-[11px] text-muted-foreground"
                >
                  <span>{creds} cred.</span>
                  <span>{hrs} hrs</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Create modal ── */}
      <FormModal
        open={open}
        title="Nueva Materia"
        onClose={() => setOpen(false)}
        onSubmit={submit}
        submitting={create.isPending}
      >
        <Field label="Código">
          <input className={inputClass} value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} required />
        </Field>
        <Field label="Nombre">
          <input className={inputClass} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Créditos">
            <input type="number" min={1} className={inputClass} value={form.creditos || ''} onFocus={(e) => e.target.select()} onChange={(e) => setForm({ ...form, creditos: Math.max(1, +e.target.value) || undefined })} required />
          </Field>
          <Field label="Horas/sem">
            <input type="number" min={1} className={inputClass} value={form.horasSemanales || ''} onFocus={(e) => e.target.select()} onChange={(e) => setForm({ ...form, horasSemanales: Math.max(1, +e.target.value) || undefined })} required />
          </Field>
          <Field label="Ciclo">
            <input type="number" min={1} max={maxCiclo} className={inputClass} value={form.ciclo || ''} onFocus={(e) => e.target.select()} onChange={(e) => setForm({ ...form, ciclo: Math.max(1, +e.target.value) || undefined })} required />
          </Field>
        </div>
        <Field label="Tipo de aula">
          <select className={inputClass} value={form.tipoAula} onChange={(e) => setForm({ ...form, tipoAula: e.target.value as TipoAula })}>
            {TIPOS_AULA.map((t) => (
              <option key={t} value={t}>{TIPO_AULA_LABEL[t]}</option>
            ))}
          </select>
        </Field>
        <Field label="Carrera">
          <select
            className={inputClass}
            value={form.carreraId || selectedCarrera?.id || ''}
            onChange={(e) => setForm({ ...form, carreraId: e.target.value })}
            required
          >
            <option value="">— Selecciona —</option>
            {carreras.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </Field>
      </FormModal>

      {/* ── Create Carrera modal ── */}
      <FormModal
        open={carreraModalOpen}
        title="Nueva Carrera"
        onClose={() => setCarreraModalOpen(false)}
        onSubmit={submitCarrera}
        submitting={createCarrera.isPending}
      >
        <Field label="Nombre">
          <input className={inputClass} value={carreraForm.nombre} onChange={(e) => setCarreraForm({ ...carreraForm, nombre: e.target.value })} required />
        </Field>
        <Field label="Código">
          <input className={inputClass} value={carreraForm.codigo} onChange={(e) => setCarreraForm({ ...carreraForm, codigo: e.target.value })} required />
        </Field>
        <Field label="Duración (ciclos)">
          <input type="number" min={1} max={20} className={inputClass} value={carreraForm.duracionCiclos || ''} onFocus={(e) => e.target.select()} onChange={(e) => {
            const v = e.target.value.trim()
            setCarreraForm({ ...carreraForm, duracionCiclos: v === '' ? undefined : Math.max(1, +v) || undefined })
          }} required />
        </Field>
        <Field label="Descripción">
          <textarea className={inputClass + ' min-h-[60px]'} value={carreraForm.descripcion} onChange={(e) => setCarreraForm({ ...carreraForm, descripcion: e.target.value })} />
        </Field>
      </FormModal>
    </div>
  )
}

// ── Carrera Dropdown ──

function CarreraDropdown({
  carreras,
  selected,
  onChange,
}: {
  carreras: Carrera[]
  selected: Carrera | undefined
  onChange: (id: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground hover:bg-muted/50"
      >
        <GraduationCap className="h-4 w-4 text-status-warning" />
        {selected?.nombre ?? 'Seleccionar carrera'}
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-1 min-w-[260px] rounded-xl border border-border bg-card p-1 shadow-xl">
            {carreras.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                No hay carreras registradas
              </div>
            ) : (
              carreras.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    onChange(c.id)
                    setIsOpen(false)
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50 ${
                    selected?.id === c.id ? 'bg-muted/30 text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  <div className="flex-1">
                    <div className="font-medium text-foreground">{c.nombre}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {c.codigo} · {c.duracionCiclos} ciclos
                    </div>
                  </div>
                  {selected?.id === c.id && (
                    <span className="h-1.5 w-1.5 rounded-full bg-status-warning" />
                  )}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}

// ── Materia Card ──

function MateriaCard({
  materia: m,
  expanded,
  onToggle,
  onDelete,
  deleting,
}: {
  materia: Materia
  expanded: boolean
  onToggle: () => void
  onDelete: () => void
  deleting: boolean
}) {
  const colors = TIPO_AULA_COLOR[m.tipoAula]

  return (
    <div
      onClick={onToggle}
      className={`group relative cursor-pointer rounded-lg border transition-all duration-200 ${colors.border} ${colors.bg} hover:shadow-md hover:scale-[1.02] ${
        expanded ? 'ring-1 ring-current/20' : ''
      } ${!m.activa ? 'opacity-50' : ''}`}
    >
      {/* Color accent bar */}
      <div className={`absolute inset-y-0 left-0 w-1 rounded-l-lg ${colors.text} bg-current`} />

      <div className="py-2.5 pl-4 pr-3">
        {/* Code + type badge */}
        <div className="mb-1 flex items-start justify-between gap-1">
          <span className="font-mono text-[10px] font-semibold tracking-wide text-muted-foreground">
            {m.codigo}
          </span>
          <span className={`rounded px-1 py-px text-[9px] font-medium ${colors.badge}`}>
            {TIPO_AULA_LABEL[m.tipoAula]}
          </span>
        </div>

        {/* Name */}
        <p className="text-[13px] font-semibold leading-tight text-foreground">
          {m.nombre}
        </p>

        {/* Credits + hours */}
        <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
          <span>{m.creditos} cred.</span>
          <span>{m.horasSemanales} hrs/sem</span>
        </div>

        {/* Expanded details */}
        {expanded && (
          <div className="mt-2 border-t border-border/30 pt-2">
            {m.prerequisitos && m.prerequisitos.length > 0 && (
              <div className="mb-2">
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Prerequisitos
                </span>
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {m.prerequisitos.map((p) => (
                    <span
                      key={p.id}
                      className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {p.codigo}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {m.descripcion && (
              <p className="mb-2 text-[11px] leading-relaxed text-muted-foreground">
                {m.descripcion}
              </p>
            )}

            <div className="flex items-center justify-between">
              <Badge variant={m.activa ? 'success' : 'muted'}>
                {m.activa ? 'Activa' : 'Inactiva'}
              </Badge>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                }}
                disabled={deleting}
                className="rounded p-1 text-muted-foreground hover:bg-status-critical/10 hover:text-status-critical disabled:opacity-50"
                aria-label="Eliminar materia"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
