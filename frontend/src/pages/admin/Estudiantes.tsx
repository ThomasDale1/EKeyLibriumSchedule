import { Users, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge, Card, DataTable, PageHeader, StatCard } from '@/components/admin/ui'
import { Carreras, Estudiantes as EstudiantesApi } from '@/hooks/useApiQueries'
import { FormModal, Field, inputClass } from '@/components/admin/FormModal'
import type { Estudiante, EstadoEstudiante } from '@/lib/types'

const ESTADOS: EstadoEstudiante[] = ['ACTIVO', 'INACTIVO', 'GRADUADO', 'SUSPENDIDO']

export default function Estudiantes() {
  const { data: estudiantes = [], isLoading, error } = EstudiantesApi.useList()
  const { data: carreras = [] } = Carreras.useList()
  const create = EstudiantesApi.useCreate()
  const remove = EstudiantesApi.useDelete()

  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    clerkUserId: '',
    codigoEstudiante: '',
    nombre: '',
    apellido: '',
    email: '',
    cicloActual: 1,
    carreraId: '',
  })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q
      ? estudiantes.filter((e) =>
          `${e.nombre} ${e.apellido} ${e.email} ${e.codigoEstudiante}`.toLowerCase().includes(q)
        )
      : estudiantes
  }, [estudiantes, search])

  const activos = estudiantes.filter((e) => e.estado === 'ACTIVO').length
  const graduados = estudiantes.filter((e) => e.estado === 'GRADUADO').length

  const submit = async () => {
    if (!form.carreraId) return alert('Selecciona una carrera')
    try {
      await create.mutateAsync({
        ...form,
        clerkUserId: form.clerkUserId || `manual_${Date.now()}`,
      })
      setOpen(false)
      setForm({ clerkUserId: '', codigoEstudiante: '', nombre: '', apellido: '', email: '', cicloActual: 1, carreraId: '' })
    } catch (e: unknown) {
      const message = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al crear'
      alert(message)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Estudiantes"
        description="Registro académico y estado de inscripción"
        actions={
          <button
            onClick={() => setOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-status-warning px-4 text-sm font-semibold text-white hover:bg-status-warning/90"
          >
            <Plus className="h-4 w-4" /> Nuevo Estudiante
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Estudiantes" value={String(estudiantes.length)} icon={Users} accent="warning" />
        <StatCard label="Activos" value={String(activos)} icon={Users} accent="success" />
        <StatCard label="Graduados" value={String(graduados)} icon={Users} accent="info" />
        <StatCard label="Carreras" value={String(carreras.length)} icon={Users} accent="critical" />
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por carnet o nombre..."
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm focus:border-status-warning/50 focus:outline-none"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Cargando...</div>
        ) : error ? (
          <div className="py-8 text-center text-red-400">Error al cargar estudiantes</div>
        ) : (
          <DataTable<Estudiante>
            columns={[
              { key: 'codigoEstudiante', label: 'Carnet', render: (r) => <span className="font-mono text-xs text-muted-foreground">{r.codigoEstudiante}</span> },
              { key: 'nombre', label: 'Nombre', render: (r) => <span className="font-medium">{r.nombre} {r.apellido}</span> },
              { key: 'carrera', label: 'Carrera', render: (r) => r.carrera?.nombre ?? carreras.find((c) => c.id === r.carreraId)?.nombre ?? '—' },
              { key: 'cicloActual', label: 'Ciclo' },
              { key: 'email', label: 'Email', render: (r) => <span className="text-xs text-muted-foreground">{r.email}</span> },
              {
                key: 'estado',
                label: 'Estado',
                render: (r) => (
                  <Badge variant={r.estado === 'ACTIVO' ? 'success' : r.estado === 'GRADUADO' ? 'info' : 'muted'}>
                    {r.estado}
                  </Badge>
                ),
              },
              {
                key: 'actions',
                label: '',
                render: (r) => (
                  <button
                    onClick={async () => {
                      if (confirm(`¿Eliminar a ${r.nombre} ${r.apellido}?`)) {
                        try {
                          await remove.mutateAsync(r.id)
                          alert('Estudiante eliminado exitosamente')
                        } catch (e: unknown) {
                          const message = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al eliminar estudiante'
                          alert(message)
                        }
                      }
                    }}
                    disabled={remove.isPending}
                    className="text-muted-foreground hover:text-status-critical disabled:opacity-50"
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
        title="Nuevo Estudiante"
        onClose={() => setOpen(false)}
        onSubmit={submit}
        submitting={create.isPending}
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Carnet"><input className={inputClass} value={form.codigoEstudiante} onChange={(e) => setForm({ ...form, codigoEstudiante: e.target.value })} required /></Field>
          <Field label="Clerk User ID (opc.)"><input className={inputClass} value={form.clerkUserId} onChange={(e) => setForm({ ...form, clerkUserId: e.target.value })} /></Field>
          <Field label="Nombre"><input className={inputClass} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required /></Field>
          <Field label="Apellido"><input className={inputClass} value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} required /></Field>
        </div>
        <Field label="Email"><input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Ciclo actual"><input type="number" className={inputClass} min="1" value={form.cicloActual} onChange={(e) => setForm({ ...form, cicloActual: Math.max(1, +e.target.value) })} required /></Field>
          <Field label="Carrera">
            <select className={inputClass} value={form.carreraId} onChange={(e) => setForm({ ...form, carreraId: e.target.value })} required>
              <option value="">— Selecciona —</option>
              {carreras.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </Field>
        </div>
        <p className="text-[10px] text-muted-foreground">Estados disponibles: {ESTADOS.join(', ')}</p>
      </FormModal>
    </div>
  )
}
