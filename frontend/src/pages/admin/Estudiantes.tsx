import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BarChart3,
  Car,
  ChevronDown,
  DollarSign,
  Filter,
  GraduationCap,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge, Card, EmptyState, PageHeader, SkeletonStatCard, SkeletonTable, StatCard } from '@/components/admin/ui'
import {
  Carreras,
  Estudiantes as EstudiantesApi,
  Materias as MateriasApi,
  Aulas as AulasApi,
} from '@/hooks/useApiQueries'
import { FormModal, Field, inputClass } from '@/components/admin/FormModal'
import type { Carrera, Estudiante, EstadoEstudiante, Materia } from '@/lib/types'

// ── Constants ──

const ESTADOS: EstadoEstudiante[] = ['ACTIVO', 'INACTIVO', 'GRADUADO', 'SUSPENDIDO']

const ESTADO_LABEL: Record<EstadoEstudiante, string> = {
  ACTIVO: 'Activo',
  INACTIVO: 'Inactivo',
  GRADUADO: 'Graduado',
  SUSPENDIDO: 'Suspendido',
}

const ESTADO_VARIANT: Record<EstadoEstudiante, 'success' | 'muted' | 'info' | 'warning' | 'critical'> = {
  ACTIVO: 'success',
  INACTIVO: 'muted',
  GRADUADO: 'info',
  SUSPENDIDO: 'critical',
}

// ── Filter types ──

type SortField = 'codigoEstudiante' | 'nombre' | 'carrera' | 'cicloActual' | 'estado' | 'mensualidad' | 'promedioGPA'
type SortDir = 'asc' | 'desc'

type AdvancedFilter = {
  id: string
  field: string
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte'
  value: string
}

let filterIdCounter = 0
const nextFilterId = () => `f${++filterIdCounter}`

// ── Main Page ──

export default function Estudiantes() {
  const { data: rawEstudiantes, isLoading, error } = EstudiantesApi.useList()
  const estudiantes = useMemo(() => rawEstudiantes ?? [], [rawEstudiantes])
  const { data: rawCarreras } = Carreras.useList()
  const carreras = useMemo(() => rawCarreras ?? [], [rawCarreras])
  const { data: rawMaterias } = MateriasApi.useList()
  const materias = useMemo(() => rawMaterias ?? [], [rawMaterias])
  const { data: rawAulas } = AulasApi.useList()
  const aulas = useMemo(() => rawAulas ?? [], [rawAulas])
  const create = EstudiantesApi.useCreate()
  const remove = EstudiantesApi.useDelete()

  // ── Search + filters state ──
  const [search, setSearch] = useState('')
  const [estadoFilter, setEstadoFilter] = useState<EstadoEstudiante | ''>('')
  const [carreraFilter, setCarreraFilter] = useState('')
  const [vehiculoFilter, setVehiculoFilter] = useState<'' | 'true' | 'false'>('')
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilter[]>([])
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [sortField, setSortField] = useState<SortField | ''>('')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  // ── Modal state ──
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    codigoEstudiante: '',
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    cicloActual: 1,
    mensualidad: 250,
    tieneVehiculo: false,
    carreraId: '',
  })

  // ── Demand calculator state ──
  const [showDemand, setShowDemand] = useState(false)
  const [demandCarreraId, setDemandCarreraId] = useState('')

  // ── Stats ──
  const stats = useMemo(() => {
    const act = estudiantes.filter((e) => e.estado === 'ACTIVO').length
    const grad = estudiantes.filter((e) => e.estado === 'GRADUADO').length
    const ing = estudiantes
      .filter((e) => e.estado === 'ACTIVO')
      .reduce((sum, e) => sum + (Number(e.mensualidad) || 0), 0)
    const veh = estudiantes.filter((e) => e.tieneVehiculo).length
    return { activos: act, graduados: grad, ingresoMensual: ing, conVehiculo: veh }
  }, [estudiantes])

  // ── Filter + sort logic ──
  const processed = useMemo(() => {
    const q = search.trim().toLowerCase()

    const filtered = estudiantes.filter((e) => {
      // Text search
      if (q && !`${e.codigoEstudiante} ${e.nombre} ${e.apellido} ${e.email}`.toLowerCase().includes(q)) {
        return false
      }
      // Quick filters
      if (estadoFilter && e.estado !== estadoFilter) return false
      if (carreraFilter && e.carreraId !== carreraFilter) return false
      if (vehiculoFilter !== '' && e.tieneVehiculo !== (vehiculoFilter === 'true')) return false

      // Advanced filters
      return advancedFilters.every((f) => {
        const raw = getFieldValue(e, f.field, carreras)
        const val = String(raw).toLowerCase()
        const target = f.value.toLowerCase()

        switch (f.operator) {
          case 'equals': return val === target
          case 'contains': return val.includes(target)
          case 'gt': return Number(raw) > Number(f.value)
          case 'lt': return Number(raw) < Number(f.value)
          case 'gte': return Number(raw) >= Number(f.value)
          case 'lte': return Number(raw) <= Number(f.value)
          default: return true
        }
      })
      })

    if (!sortField) return filtered

    // Create a copy before sorting to satisfy the compiler's inmutability checks
    return [...filtered].sort((a, b) => {
      const va = getFieldValue(a, sortField, carreras)
      const vb = getFieldValue(b, sortField, carreras)
      const na = Number(va)
      const nb = Number(vb)
      const cmp = !isNaN(na) && !isNaN(nb) ? na - nb : String(va).localeCompare(String(vb))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [estudiantes, search, estadoFilter, carreraFilter, vehiculoFilter, advancedFilters, sortField, sortDir, carreras])

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDir === 'asc') setSortDir('desc')
      else { setSortField(''); setSortDir('asc') }
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const activeFilterCount =
    (estadoFilter ? 1 : 0) + (carreraFilter ? 1 : 0) + (vehiculoFilter ? 1 : 0) + advancedFilters.length

  const clearAllFilters = () => {
    setEstadoFilter('')
    setCarreraFilter('')
    setVehiculoFilter('')
    setAdvancedFilters([])
    setSearch('')
  }

  // ── Submit ──
  const submit = async () => {
    if (!form.carreraId) return alert('Selecciona una carrera')
    try {
      await create.mutateAsync({
        ...form,
        clerkUserId: `manual_${Date.now()}`,
      })
      setOpen(false)
      setForm({
        codigoEstudiante: '',
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        cicloActual: 1,
        mensualidad: 250,
        tieneVehiculo: false,
        carreraId: '',
      })
    } catch (e: unknown) {
      const message =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al crear'
      alert(message)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Estudiantes"
        description="Registro académico, inscripciones y estado estudiantil"
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => setShowDemand(true)}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-muted/50"
            >
              <BarChart3 className="h-4 w-4" /> Demanda
            </button>
            <button
              onClick={() => setOpen(true)}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-status-warning px-4 text-sm font-semibold text-white hover:bg-status-warning/90"
            >
              <Plus className="h-4 w-4" /> Nuevo Estudiante
            </button>
          </div>
        }
      />

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => <SkeletonStatCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Activos" value={String(stats.activos)} icon={Users} accent="success" />
          <StatCard label="Graduados" value={String(stats.graduados)} icon={GraduationCap} accent="info" />
          <StatCard
            label="Ingreso mensual"
            value={`$${stats.ingresoMensual.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            icon={DollarSign}
            accent="warning"
          />
          <StatCard label="Con transporte" value={String(stats.conVehiculo)} icon={Car} accent="critical" />
        </div>
      )}

      {/* Toolbar */}
      <Card>
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por carnet, nombre o email..."
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm focus:border-status-warning/50 focus:outline-none"
            />
          </div>

          {/* Quick filters */}
          <QuickSelect
            value={estadoFilter}
            onChange={(v) => setEstadoFilter(v as EstadoEstudiante | '')}
            placeholder="Estado"
            options={ESTADOS.map((e) => ({ value: e, label: ESTADO_LABEL[e] }))}
          />
          <QuickSelect
            value={carreraFilter}
            onChange={setCarreraFilter}
            placeholder="Carrera"
            options={carreras.map((c) => ({ value: c.id, label: c.nombre }))}
          />
          <QuickSelect
            value={vehiculoFilter}
            onChange={(v) => setVehiculoFilter(v as '' | 'true' | 'false')}
            placeholder="Vehículo"
            options={[
              { value: 'true', label: 'Con vehículo' },
              { value: 'false', label: 'Sin vehículo' },
            ]}
          />

          {/* Advanced filter button */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors ${
              advancedFilters.length > 0
                ? 'border-status-warning/30 bg-status-warning/10 text-status-warning'
                : 'border-border text-muted-foreground hover:bg-muted/50'
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            Filtros {advancedFilters.length > 0 && `(${advancedFilters.length})`}
          </button>

          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Limpiar todo
            </button>
          )}

          <span className="ml-auto text-xs text-muted-foreground">
            {processed.length} de {estudiantes.length}
          </span>
        </div>

        {/* Advanced filters panel */}
        {showAdvanced && (
          <AdvancedFiltersPanel
            filters={advancedFilters}
            setFilters={setAdvancedFilters}
            carreras={carreras}
          />
        )}

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5 border-t border-border/40 pt-2">
            {estadoFilter && (
              <FilterChip label={`Estado: ${ESTADO_LABEL[estadoFilter]}`} onRemove={() => setEstadoFilter('')} />
            )}
            {carreraFilter && (
              <FilterChip
                label={`Carrera: ${carreras.find((c) => c.id === carreraFilter)?.nombre ?? '?'}`}
                onRemove={() => setCarreraFilter('')}
              />
            )}
            {vehiculoFilter && (
              <FilterChip
                label={vehiculoFilter === 'true' ? 'Con vehículo' : 'Sin vehículo'}
                onRemove={() => setVehiculoFilter('')}
              />
            )}
            {advancedFilters.map((f) => (
              <FilterChip
                key={f.id}
                label={`${f.field} ${f.operator} ${f.value}`}
                onRemove={() => setAdvancedFilters((prev) => prev.filter((x) => x.id !== f.id))}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Table */}
      {isLoading ? (
        <SkeletonTable rows={6} cols={9} />
      ) : error ? (
        <EmptyState
          icon={AlertTriangle}
          title="Error al cargar estudiantes"
          description="Verifica tu conexión e intenta de nuevo"
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <SortHeader field="codigoEstudiante" label="Carnet" current={sortField} dir={sortDir} onSort={toggleSort} />
                  <SortHeader field="nombre" label="Nombre" current={sortField} dir={sortDir} onSort={toggleSort} />
                  <SortHeader field="carrera" label="Carrera" current={sortField} dir={sortDir} onSort={toggleSort} />
                  <SortHeader field="cicloActual" label="Ciclo" current={sortField} dir={sortDir} onSort={toggleSort} className="text-center" />
                  <SortHeader field="estado" label="Estado" current={sortField} dir={sortDir} onSort={toggleSort} />
                  <SortHeader field="mensualidad" label="Mensualidad" current={sortField} dir={sortDir} onSort={toggleSort} className="text-right" />
                  <SortHeader field="promedioGPA" label="GPA" current={sortField} dir={sortDir} onSort={toggleSort} className="text-center" />
                  <th className="px-4 py-3 text-center font-medium">Vehículo</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {processed.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-14 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="rounded-2xl bg-muted/40 p-3">
                          <Users className="h-6 w-6 text-muted-foreground/40" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {estudiantes.length === 0 ? 'No hay estudiantes registrados' : 'Sin resultados para los filtros aplicados'}
                        </p>
                        {estudiantes.length === 0 && (
                          <p className="text-xs text-muted-foreground/60">Agrega el primer estudiante para empezar</p>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  processed.map((e) => (
                    <tr
                      key={e.id}
                      className="border-b border-border/40 transition-colors last:border-0 hover:bg-muted/20"
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs text-muted-foreground">{e.codigoEstudiante}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-foreground">{e.nombre} {e.apellido}</span>
                        <div className="text-[11px] text-muted-foreground">{e.email}</div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {e.carrera?.nombre ?? carreras.find((c) => c.id === e.carreraId)?.nombre ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
                          {e.cicloActual}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={ESTADO_VARIANT[e.estado]}>{ESTADO_LABEL[e.estado]}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-foreground">
                        ${Number(e.mensualidad || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-muted-foreground">
                        {e.promedioGPA != null ? Number(e.promedioGPA).toFixed(2) : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {e.tieneVehiculo ? (
                          <Car className="mx-auto h-4 w-4 text-status-warning" />
                        ) : (
                          <span className="text-[10px] text-muted-foreground/40">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={async () => {
                            if (confirm(`¿Eliminar a ${e.nombre} ${e.apellido}?`)) {
                              try {
                                await remove.mutateAsync(e.id)
                              } catch (err: unknown) {
                                const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al eliminar'
                                alert(msg)
                              }
                            }
                          }}
                          disabled={remove.isPending}
                          className="rounded p-1 text-muted-foreground hover:text-status-critical disabled:opacity-50"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create modal */}
      <FormModal
        open={open}
        title="Nuevo Estudiante"
        onClose={() => setOpen(false)}
        onSubmit={submit}
        submitting={create.isPending}
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Carnet">
            <input className={inputClass} value={form.codigoEstudiante} onChange={(e) => setForm({ ...form, codigoEstudiante: e.target.value })} placeholder="2024-001" required />
          </Field>
          <Field label="Email">
            <input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Nombre">
            <input className={inputClass} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required />
          </Field>
          <Field label="Apellido">
            <input className={inputClass} value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} required />
          </Field>
        </div>
        <Field label="Teléfono">
          <input className={inputClass} value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="Ciclo actual">
            <input type="number" className={inputClass} min={1} value={form.cicloActual} onChange={(e) => setForm({ ...form, cicloActual: Math.max(1, +e.target.value) })} required />
          </Field>
          <Field label="Mensualidad ($)">
            <input type="number" step="0.01" min={0} className={inputClass} value={form.mensualidad} onChange={(e) => setForm({ ...form, mensualidad: +e.target.value })} required />
          </Field>
          <Field label="Carrera">
            <select className={inputClass} value={form.carreraId} onChange={(e) => setForm({ ...form, carreraId: e.target.value })} required>
              <option value="">— Selecciona —</option>
              {carreras.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          </Field>
        </div>
        <label className="flex items-center gap-2 pt-1 text-sm text-foreground">
          <input
            type="checkbox"
            checked={form.tieneVehiculo}
            onChange={(e) => setForm({ ...form, tieneVehiculo: e.target.checked })}
          />
          Tiene vehículo (transporte propio)
        </label>
      </FormModal>

      {/* Demand calculator modal */}
      {showDemand && (
        <DemandCalculator
          estudiantes={estudiantes}
          materias={materias}
          carreras={carreras}
          aulas={aulas}
          selectedCarreraId={demandCarreraId}
          setSelectedCarreraId={setDemandCarreraId}
          onClose={() => setShowDemand(false)}
        />
      )}
    </div>
  )
}

// ── Sortable header ──

function SortHeader({
  field,
  label,
  current,
  dir,
  onSort,
  className = '',
}: {
  field: SortField
  label: string
  current: SortField | ''
  dir: SortDir
  onSort: (f: SortField) => void
  className?: string
}) {
  const isActive = current === field
  return (
    <th
      className={`cursor-pointer select-none px-4 py-3 font-medium transition-colors hover:text-foreground ${className}`}
      onClick={() => onSort(field)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive ? (
          dir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-30" />
        )}
      </span>
    </th>
  )
}

// ── Quick select dropdown ──

function QuickSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`h-9 rounded-lg border border-border bg-background px-2.5 text-xs focus:border-status-warning/50 focus:outline-none ${
        value ? 'text-foreground' : 'text-muted-foreground'
      }`}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

// ── Filter chip ──

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-status-warning/10 px-2 py-0.5 text-[11px] font-medium text-status-warning">
      {label}
      <button onClick={onRemove} className="hover:text-status-critical">
        <X className="h-3 w-3" />
      </button>
    </span>
  )
}

// ── Advanced filters panel ──

const FILTER_FIELDS = [
  { value: 'nombre', label: 'Nombre', type: 'text' },
  { value: 'apellido', label: 'Apellido', type: 'text' },
  { value: 'email', label: 'Email', type: 'text' },
  { value: 'codigoEstudiante', label: 'Carnet', type: 'text' },
  { value: 'carreraId', label: 'Carrera', type: 'select' },
  { value: 'cicloActual', label: 'Ciclo', type: 'number' },
  { value: 'mensualidad', label: 'Mensualidad', type: 'number' },
  { value: 'promedioGPA', label: 'GPA', type: 'number' },
]

const TEXT_OPERATORS = [
  { value: 'contains', label: 'contiene' },
  { value: 'equals', label: 'es igual a' },
]

const NUMBER_OPERATORS = [
  { value: 'equals', label: '=' },
  { value: 'gt', label: '>' },
  { value: 'lt', label: '<' },
  { value: 'gte', label: '>=' },
  { value: 'lte', label: '<=' },
]

function AdvancedFiltersPanel({
  filters,
  setFilters,
  carreras,
}: {
  filters: AdvancedFilter[]
  setFilters: (f: AdvancedFilter[]) => void
  carreras: Carrera[]
}) {
  const [field, setField] = useState('nombre')
  const [operator, setOperator] = useState('contains')
  const [value, setValue] = useState('')

  const fieldDef = FILTER_FIELDS.find((f) => f.value === field)
  const operators = fieldDef?.type === 'number' ? NUMBER_OPERATORS : TEXT_OPERATORS

  const addFilter = () => {
    if (!value.trim()) return
    setFilters([
      ...filters,
      { id: nextFilterId(), field, operator: operator as AdvancedFilter['operator'], value: value.trim() },
    ])
    setValue('')
  }

  return (
    <div className="mt-3 border-t border-border/40 pt-3">
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <span className="mb-1 block text-[10px] font-medium text-muted-foreground">Campo</span>
          <select
            value={field}
            onChange={(e) => {
              setField(e.target.value)
              const def = FILTER_FIELDS.find((f) => f.value === e.target.value)
              setOperator(def?.type === 'number' ? 'equals' : 'contains')
              setValue('')
            }}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs focus:outline-none"
          >
            {FILTER_FIELDS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
        <div>
          <span className="mb-1 block text-[10px] font-medium text-muted-foreground">Operador</span>
          <select
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
            className="h-8 rounded-md border border-border bg-background px-2 text-xs focus:outline-none"
          >
            {operators.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <span className="mb-1 block text-[10px] font-medium text-muted-foreground">Valor</span>
          {fieldDef?.type === 'select' ? (
            <select
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="h-8 w-32 rounded-md border border-border bg-background px-2 text-xs focus:outline-none"
            >
              <option value="">— Seleccionar —</option>
              {field === 'carreraId' && carreras.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
          ) : (
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addFilter()}
              className="h-8 w-32 rounded-md border border-border bg-background px-2 text-xs focus:outline-none"
              placeholder="..."
            />
          )}
        </div>
        <button
          onClick={addFilter}
          className="h-8 rounded-md bg-status-warning/20 px-3 text-xs font-medium text-status-warning hover:bg-status-warning/30"
        >
          Agregar
        </button>
      </div>
    </div>
  )
}

// ── Demand Calculator ──

function DemandCalculator({
  estudiantes,
  materias,
  carreras,
  aulas,
  selectedCarreraId,
  setSelectedCarreraId,
  onClose,
}: {
  estudiantes: Estudiante[]
  materias: Materia[]
  carreras: Carrera[]
  aulas: { capacidad: number; activa: boolean }[]
  selectedCarreraId: string
  setSelectedCarreraId: (id: string) => void
  onClose: () => void
}) {
  const carreraId = selectedCarreraId || (carreras.length > 0 ? carreras[0].id : '')

  // Average active classroom capacity
  const activeAulas = aulas.filter((a) => a.activa)
  const avgCapacity = activeAulas.length > 0
    ? Math.round(activeAulas.reduce((s, a) => s + a.capacidad, 0) / activeAulas.length)
    : 30

  // Active students in this carrera
  const activeStudents = useMemo(() => 
    estudiantes.filter((e) => e.estado === 'ACTIVO' && e.carreraId === carreraId),
    [estudiantes, carreraId]
  )

  // Materias for this carrera
  const carreraMaterias = materias.filter((m) => m.carreraId === carreraId && m.activa)

  // Calculate demand for each materia
  const demandRows = useMemo(() => {
    return carreraMaterias
      .map((m) => {
        // Students who should take this materia:
        // - cicloActual >= m.ciclo (they're in or past the semester)
        // - Haven't approved it yet
        const demand = activeStudents.filter((e) => {
          if (e.cicloActual < (m.ciclo ?? 1)) return false
          const approved = e.materiasAprobadas ?? []
          if (approved.some((a) => a.materiaId === m.id)) return false

          // Check prerequisites
          const prereqs = m.prerequisitos ?? []
          if (prereqs.length > 0) {
            const allPrereqsMet = prereqs.every((p) =>
              approved.some((a) => a.materiaId === p.id)
            )
            if (!allPrereqsMet) return false
          }

          return true
        }).length

        const suggestedSections = demand > 0 ? Math.ceil(demand / avgCapacity) : 0

        return {
          materia: m,
          demand,
          suggestedSections,
          avgCapacity,
        }
      })
      .sort((a, b) => b.demand - a.demand)
  }, [carreraMaterias, activeStudents, avgCapacity])

  const totalDemand = demandRows.reduce((s, r) => s + r.demand, 0)
  const totalSections = demandRows.reduce((s, r) => s + r.suggestedSections, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-[5vh]">
      <div className="w-full max-w-3xl rounded-xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Calculadora de Demanda</h3>
            <p className="text-xs text-muted-foreground">
              Secciones sugeridas basadas en estudiantes activos y capacidad de aulas
            </p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5">
          {/* Controls */}
          <div className="mb-4 flex flex-wrap items-center gap-4">
            <div>
              <span className="mb-1 block text-[10px] font-medium text-muted-foreground">Carrera</span>
              <select
                value={carreraId}
                onChange={(e) => setSelectedCarreraId(e.target.value)}
                className={inputClass + ' max-w-[300px]'}
              >
                {carreras.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>Estudiantes activos: <strong className="text-foreground">{activeStudents.length}</strong></span>
              <span>Capacidad prom. aula: <strong className="text-foreground">{avgCapacity}</strong></span>
              <span>Inscripciones totales: <strong className="text-foreground">{totalDemand}</strong></span>
              <span>Secciones sugeridas: <strong className="text-status-warning">{totalSections}</strong></span>
            </div>
          </div>

          {/* Demand table */}
          <div className="max-h-[400px] overflow-y-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2 font-medium">Código</th>
                  <th className="px-3 py-2 font-medium">Materia</th>
                  <th className="px-3 py-2 text-center font-medium">Ciclo</th>
                  <th className="px-3 py-2 text-center font-medium">Demanda</th>
                  <th className="px-3 py-2 text-center font-medium">Secciones</th>
                  <th className="px-3 py-2 font-medium">Barra</th>
                </tr>
              </thead>
              <tbody>
                {demandRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-xs text-muted-foreground">
                      No hay materias para esta carrera
                    </td>
                  </tr>
                ) : (
                  demandRows.map((r) => {
                    const pct = activeStudents.length > 0
                      ? Math.min(100, (r.demand / activeStudents.length) * 100)
                      : 0
                    return (
                      <tr key={r.materia.id} className="border-b border-border/30 last:border-0">
                        <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">
                          {r.materia.codigo}
                        </td>
                        <td className="px-3 py-2 text-xs font-medium text-foreground">
                          {r.materia.nombre}
                        </td>
                        <td className="px-3 py-2 text-center text-xs text-muted-foreground">
                          {r.materia.ciclo ?? '—'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`font-mono text-xs font-bold ${
                            r.demand > avgCapacity ? 'text-status-critical' : 'text-foreground'
                          }`}>
                            {r.demand}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-status-warning/15 px-1.5 text-xs font-bold text-status-warning">
                            {r.suggestedSections}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full transition-all ${
                                pct > 80 ? 'bg-status-critical' : pct > 50 ? 'bg-status-warning' : 'bg-status-success'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-[10px] text-muted-foreground">
            Demanda = estudiantes activos con ciclo &ge; ciclo de la materia, prerequisitos aprobados, y que no la han cursado.
            Secciones = &lceil;demanda / capacidad promedio&rceil;.
          </p>
        </div>

        <div className="flex justify-end border-t border-border px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Helpers ──

function getFieldValue(e: Estudiante, field: string, carreras: Carrera[]): string | number {
  switch (field) {
    case 'codigoEstudiante': return e.codigoEstudiante
    case 'nombre': return `${e.nombre} ${e.apellido}`
    case 'apellido': return e.apellido
    case 'email': return e.email
    case 'carreraId': return e.carreraId
    case 'carrera': return e.carrera?.nombre ?? carreras.find((c) => c.id === e.carreraId)?.nombre ?? ''
    case 'cicloActual': return e.cicloActual
    case 'estado': return e.estado
    case 'mensualidad': return Number(e.mensualidad) || 0
    case 'promedioGPA': return e.promedioGPA ?? 0
    default: return ''
  }
}
