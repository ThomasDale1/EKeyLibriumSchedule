import { AlertTriangle, DollarSign, DoorOpen, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge, Card, EmptyState, PageHeader, SkeletonCard, SkeletonStatCard, StatCard } from '@/components/admin/ui'
import { Aulas as AulasApi } from '@/hooks/useApiQueries'
import { FormModal, Field, inputClass } from '@/components/admin/FormModal'
import type { TipoAula } from '@/lib/types'

const TIPOS: TipoAula[] = ['TEORIA', 'LABORATORIO_COMPUTO', 'LABORATORIO_CIENCIAS', 'AUDITORIO']

const TIPO_LABEL: Record<TipoAula, string> = {
  TEORIA: 'Teoría',
  LABORATORIO_COMPUTO: 'Lab. Cómputo',
  LABORATORIO_CIENCIAS: 'Lab. Ciencias',
  AUDITORIO: 'Auditorio',
}

export default function Salones() {
  const { data: aulas = [], isLoading, error } = AulasApi.useList()
  const create = AulasApi.useCreate()
  const remove = AulasApi.useDelete()

  const [open, setOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [tipoFilter, setTipoFilter] = useState<TipoAula | ''>('')
  const [form, setForm] = useState({
    codigo: '',
    nombre: '',
    capacidad: 30,
    tipo: 'TEORIA' as TipoAula,
    edificio: '',
    piso: 1,
    costoMensual: 0,
    tieneProyector: true,
    tieneAC: false,
    tieneInternet: true,
    activa: true,
  })

  const filtered = useMemo(() => {
    let list = aulas
    if (tipoFilter) list = list.filter((a) => a.tipo === tipoFilter)
    const q = search.trim().toLowerCase()
    if (q) list = list.filter((a) => `${a.codigo} ${a.nombre} ${a.edificio}`.toLowerCase().includes(q))
    return list
  }, [aulas, search, tipoFilter])

  const activas = aulas.filter((a) => a.activa).length
  const capacidadTotal = aulas.reduce((sum, a) => sum + a.capacidad, 0)
  const costoTotal = aulas.filter((a) => a.activa).reduce((sum, a) => sum + (Number(a.costoMensual) || 0), 0)

  const submit = async () => {
    try {
      await create.mutateAsync(form)
      setOpen(false)
      setForm({ codigo: '', nombre: '', capacidad: 30, tipo: 'TEORIA', edificio: '', piso: 1, costoMensual: 0, tieneProyector: true, tieneAC: false, tieneInternet: true, activa: true })
    } catch (e: unknown) {
      const message = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al crear'
      alert(message)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Salones"
        description="Disponibilidad, capacidad y estado de recursos físicos"
        actions={
          <button
            onClick={() => setOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-status-warning px-4 text-sm font-semibold text-white hover:bg-status-warning/90"
          >
            <Plus className="h-4 w-4" /> Nuevo Salón
          </button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          {Array.from({ length: 5 }, (_, i) => <SkeletonStatCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard label="Total salones" value={String(aulas.length)} icon={DoorOpen} accent="warning" />
          <StatCard label="Activos" value={String(activas)} icon={DoorOpen} accent="success" />
          <StatCard label="Laboratorios" value={String(aulas.filter((a) => a.tipo.startsWith('LABORATORIO')).length)} icon={DoorOpen} accent="info" />
          <StatCard label="Capacidad total" value={String(capacidadTotal)} icon={DoorOpen} accent="critical" />
          <StatCard label="Costo mensual" value={`$${costoTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} icon={DollarSign} accent="warning" />
        </div>
      )}

      {/* Search + filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar salón..."
            className="h-9 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm focus:border-status-warning/50 focus:outline-none"
          />
        </div>
        <select
          value={tipoFilter}
          onChange={(e) => setTipoFilter(e.target.value as TipoAula | '')}
          className={`h-9 rounded-lg border border-border bg-background px-2.5 text-xs focus:border-status-warning/50 focus:outline-none ${tipoFilter ? 'text-foreground' : 'text-muted-foreground'}`}
        >
          <option value="">Todos los tipos</option>
          {TIPOS.map((t) => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
        </select>
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} de {aulas.length}</span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <EmptyState
          icon={AlertTriangle}
          title="Error al cargar aulas"
          description="Verifica tu conexión e intenta de nuevo"
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={DoorOpen}
          title={aulas.length === 0 ? 'No hay salones registrados' : 'Sin resultados para los filtros'}
          description={aulas.length === 0 ? 'Crea el primer salón para empezar a gestionar recursos' : 'Ajusta los filtros o busca con otros términos'}
          action={aulas.length === 0 ? (
            <button
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-status-warning px-4 py-2 text-sm font-semibold text-white hover:bg-status-warning/90"
            >
              <Plus className="h-4 w-4" /> Nuevo Salón
            </button>
          ) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((a) => (
            <Card key={a.id} className="group transition-all duration-200 hover:border-status-warning/30 hover:shadow-lg hover:shadow-status-warning/5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{a.codigo}</span>
                    <Badge variant="muted">{TIPO_LABEL[a.tipo]}</Badge>
                  </div>
                  <p className="mt-2 text-base font-semibold text-foreground">{a.nombre}</p>
                  {a.edificio && <p className="text-xs text-muted-foreground">Edif. {a.edificio} · Piso {a.piso ?? '—'}</p>}
                </div>
                <Badge variant={a.activa ? 'success' : 'muted'}>{a.activa ? 'Disponible' : 'Inactiva'}</Badge>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span>Capacidad: <span className="font-mono text-foreground">{a.capacidad}</span></span>
                  {Number(a.costoMensual) > 0 && (
                    <span className="flex items-center gap-0.5 font-semibold text-status-warning">
                      <DollarSign className="h-3 w-3" />{Number(a.costoMensual).toFixed(2)}/mes
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {a.tieneProyector && <Badge variant="info">Proyector</Badge>}
                  {a.tieneAC && <Badge variant="info">A/C</Badge>}
                  {a.tieneInternet && <Badge variant="info">Wi-Fi</Badge>}
                </div>
              </div>
              <div className="mt-3 flex justify-end border-t border-border pt-2">
                <button
                  onClick={() => {
                    if (remove.isPending && deletingId === a.id) return
                    if (confirm(`¿Eliminar ${a.codigo}?`)) {
                      setDeletingId(a.id)
                      remove.mutate(a.id, {
                        onError: () => {
                          alert('Error al eliminar el salón. Por favor, intenta de nuevo.')
                          setDeletingId(null)
                        },
                        onSuccess: () => {
                          alert('Salón eliminado exitosamente')
                          setDeletingId(null)
                        }
                      })
                    }
                  }}
                  disabled={remove.isPending && deletingId === a.id}
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-status-critical/10 hover:text-status-critical disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={`Eliminar ${a.codigo}`}
                  aria-busy={remove.isPending && deletingId === a.id}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <FormModal
        open={open}
        title="Nuevo Salón"
        onClose={() => setOpen(false)}
        onSubmit={submit}
        submitting={create.isPending}
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Código"><input className={inputClass} value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} required /></Field>
          <Field label="Nombre"><input className={inputClass} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required /></Field>
          <Field label="Capacidad"><input type="number" className={inputClass} min="1" value={form.capacidad} onChange={(e) => setForm({ ...form, capacidad: Math.max(1, +e.target.value) })} required /></Field>
          <Field label="Tipo">
            <select className={inputClass} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value as TipoAula })}>
              {TIPOS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Edificio"><input className={inputClass} value={form.edificio} onChange={(e) => setForm({ ...form, edificio: e.target.value })} /></Field>
          <Field label="Piso"><input type="number" className={inputClass} value={form.piso} onChange={(e) => setForm({ ...form, piso: +e.target.value })} /></Field>
          <Field label="Costo mensual ($)"><input type="number" step="0.01" min="0" className={inputClass} value={form.costoMensual} onChange={(e) => setForm({ ...form, costoMensual: +e.target.value })} /></Field>
        </div>
        <div className="flex flex-wrap gap-4 pt-2 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.tieneProyector} onChange={(e) => setForm({ ...form, tieneProyector: e.target.checked })} /> Proyector</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.tieneAC} onChange={(e) => setForm({ ...form, tieneAC: e.target.checked })} /> A/C</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.tieneInternet} onChange={(e) => setForm({ ...form, tieneInternet: e.target.checked })} /> Internet</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.activa} onChange={(e) => setForm({ ...form, activa: e.target.checked })} /> Activa</label>
        </div>
      </FormModal>
    </div>
  )
}
