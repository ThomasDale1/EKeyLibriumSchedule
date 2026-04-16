import { BookOpen, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge, Card, DataTable, PageHeader, StatCard } from '@/components/admin/ui'
import { Carreras, Materias as MateriasApi } from '@/hooks/useApiQueries'
import { FormModal, Field, inputClass } from '@/components/admin/FormModal'
import type { Materia, TipoAula } from '@/lib/types'

const TIPOS_AULA: TipoAula[] = ['TEORIA', 'LABORATORIO_COMPUTO', 'LABORATORIO_CIENCIAS', 'AUDITORIO']

export default function Materias() {
  const { data: materias = [], isLoading, error } = MateriasApi.useList()
  const { data: carreras = [] } = Carreras.useList()
  const create = MateriasApi.useCreate()
  const remove = MateriasApi.useDelete()

  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({
    codigo: '',
    nombre: '',
    creditos: 4,
    horasSemanales: 4,
    tipoAula: 'TEORIA' as TipoAula,
    carreraId: '',
  })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q
      ? materias.filter(
          (m) => m.codigo.toLowerCase().includes(q) || m.nombre.toLowerCase().includes(q)
        )
      : materias
  }, [materias, search])

  const activas = materias.filter((m) => m.activa).length

  const submit = async () => {
    if (!form.carreraId) return alert('Selecciona una carrera')
    try {
      await create.mutateAsync(form)
      setOpen(false)
      setForm({ codigo: '', nombre: '', creditos: 4, horasSemanales: 4, tipoAula: 'TEORIA', carreraId: '' })
    } catch (e: unknown) {
      const message = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al crear'
      alert(message)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Materias"
        description="Gestiona el catálogo académico y cupos por período"
        actions={
          <button
            onClick={() => setOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-status-warning px-4 text-sm font-semibold text-white hover:bg-status-warning/90"
          >
            <Plus className="h-4 w-4" /> Nueva Materia
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total materias" value={String(materias.length)} icon={BookOpen} accent="warning" />
        <StatCard label="Activas" value={String(activas)} icon={BookOpen} accent="success" />
        <StatCard label="Inactivas" value={String(materias.length - activas)} icon={BookOpen} accent="info" />
        <StatCard label="Carreras" value={String(carreras.length)} icon={BookOpen} accent="critical" />
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código o nombre..."
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm focus:border-status-warning/50 focus:outline-none"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Cargando...</div>
        ) : error ? (
          <div className="py-8 text-center text-red-400">Error al cargar materias</div>
        ) : (
          <DataTable<Materia>
            columns={[
              { key: 'codigo', label: 'Código', render: (r) => <span className="font-mono text-xs text-muted-foreground">{r.codigo}</span> },
              { key: 'nombre', label: 'Nombre', render: (r) => <span className="font-medium">{r.nombre}</span> },
              { key: 'carrera', label: 'Carrera', render: (r) => r.carrera?.nombre ?? carreras.find((c) => c.id === r.carreraId)?.nombre ?? '—' },
              { key: 'creditos', label: 'Créditos', className: 'text-right' },
              { key: 'horasSemanales', label: 'Horas/sem', className: 'text-right' },
              { key: 'tipoAula', label: 'Tipo', render: (r) => <Badge variant="muted">{r.tipoAula}</Badge> },
              {
                key: 'activa',
                label: 'Estado',
                render: (r) => (
                  <Badge variant={r.activa ? 'success' : 'muted'}>{r.activa ? 'Activa' : 'Inactiva'}</Badge>
                ),
              },
              {
                key: 'actions',
                label: '',
                render: (r) => (
                  <button
                    onClick={async () => {
                      if (confirm(`¿Eliminar ${r.nombre}?`)) {
                        setPendingDeleteId(r.id)
                        try {
                          await remove.mutateAsync(r.id)
                          alert('Materia eliminada exitosamente')
                        } catch (e: unknown) {
                          const message = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al eliminar materia'
                          alert(message)
                        } finally {
                          setPendingDeleteId(null)
                        }
                      }
                    }}
                    disabled={pendingDeleteId === r.id}
                    className="text-muted-foreground hover:text-status-critical disabled:opacity-50"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ),
              },
            ]}
            rows={filtered}
          />
        )}
      </Card>

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
        <div className="grid grid-cols-2 gap-3">
          <Field label="Créditos">
            <input type="number" min={1} className={inputClass} value={form.creditos} onChange={(e) => setForm({ ...form, creditos: +e.target.value })} required />
          </Field>
          <Field label="Horas semanales">
            <input type="number" min={1} className={inputClass} value={form.horasSemanales} onChange={(e) => setForm({ ...form, horasSemanales: +e.target.value })} required />
          </Field>
        </div>
        <Field label="Tipo de aula">
          <select className={inputClass} value={form.tipoAula} onChange={(e) => setForm({ ...form, tipoAula: e.target.value as TipoAula })}>
            {TIPOS_AULA.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>
        <Field label="Carrera">
          <select className={inputClass} value={form.carreraId} onChange={(e) => setForm({ ...form, carreraId: e.target.value })} required>
            <option value="">— Selecciona —</option>
            {carreras.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </Field>
        {carreras.length === 0 && (
          <p className="text-xs text-status-warning">No hay carreras. Crea una nueva carrera en el panel de gestión.</p>
        )}
      </FormModal>
    </div>
  )
}
