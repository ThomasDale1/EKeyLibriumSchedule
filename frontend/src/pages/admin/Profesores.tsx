import { GraduationCap, Mail, Plus, Search, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge, Card, PageHeader, StatCard } from '@/components/admin/ui'
import { Profesores as ProfesoresApi } from '@/hooks/useApiQueries'
import { FormModal, Field, inputClass } from '@/components/admin/FormModal'
import type { TipoContrato } from '@/lib/types'

const TIPOS: TipoContrato[] = ['TIEMPO_COMPLETO', 'MEDIO_TIEMPO', 'POR_HORA']

export default function Profesores() {
  const { data: profesores = [], isLoading, error } = ProfesoresApi.useList()
  const create = ProfesoresApi.useCreate()
  const remove = ProfesoresApi.useDelete()

  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    clerkUserId: '',
    codigo: '',
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    tipoContrato: 'POR_HORA' as TipoContrato,
    costoHora: 25,
  })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q
      ? profesores.filter((p) =>
          `${p.nombre} ${p.apellido} ${p.email} ${p.codigo}`.toLowerCase().includes(q)
        )
      : profesores
  }, [profesores, search])

  const activos = profesores.filter((p) => p.activo).length

  const submit = async () => {
    try {
      await create.mutateAsync({
        ...form,
        clerkUserId: form.clerkUserId || `manual_${Date.now()}`,
      })
      setOpen(false)
      setForm({ clerkUserId: '', codigo: '', nombre: '', apellido: '', email: '', telefono: '', tipoContrato: 'POR_HORA', costoHora: 25 })
    } catch (e: unknown) {
      const message = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al crear'
      alert(message)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profesores"
        description="Carga docente, disponibilidad y asignaciones"
        actions={
          <button
            onClick={() => setOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-status-warning px-4 text-sm font-semibold text-white hover:bg-status-warning/90"
          >
            <Plus className="h-4 w-4" /> Nuevo Profesor
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Profesores" value={String(profesores.length)} icon={GraduationCap} accent="warning" />
        <StatCard label="Activos" value={String(activos)} icon={GraduationCap} accent="success" />
        <StatCard label="Inactivos" value={String(profesores.length - activos)} icon={GraduationCap} accent="info" />
        <StatCard label="Tiempo completo" value={String(profesores.filter((p) => p.tipoContrato === 'TIEMPO_COMPLETO').length)} icon={GraduationCap} accent="critical" />
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar profesor..."
            className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm focus:border-status-warning/50 focus:outline-none"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">Cargando...</div>
      ) : error ? (
        <div className="py-8 text-center text-red-400">Error al cargar profesores</div>
      ) : filtered.length === 0 ? (
        <Card>
          <p className="py-8 text-center text-muted-foreground">Aún no hay profesores registrados.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <Card key={p.id} className="transition-colors hover:border-status-warning/40">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-status-warning to-amber-500 text-sm font-bold text-white">
                  {(p.nombre?.[0] ?? '?') + (p.apellido?.[0] ?? '')}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-foreground">{p.nombre} {p.apellido}</p>
                    <Badge variant={p.activo ? 'success' : 'muted'}>{p.activo ? 'Activo' : 'Inactivo'}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{p.codigo} · {p.tipoContrato}</p>
                  <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{p.email}</span>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                <span className="text-xs text-muted-foreground">${p.costoHora}/hr</span>
                <button
                  onClick={async () => {
                    if (confirm(`¿Eliminar a ${p.nombre}?`)) {
                      try {
                        await remove.mutateAsync(p.id)
                        alert('Profesor eliminado exitosamente')
                      } catch (e: unknown) {
                        const message = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Error al eliminar profesor'
                        alert(message)
                      }
                    }
                  }}
                  disabled={remove.isPending}
                  className="text-muted-foreground hover:text-status-critical disabled:opacity-50"
                  aria-label={`Eliminar ${p.nombre}`}
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
        title="Nuevo Profesor"
        onClose={() => setOpen(false)}
        onSubmit={submit}
        submitting={create.isPending}
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Código"><input className={inputClass} value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} required /></Field>
          <Field label="Clerk User ID (opc.)"><input className={inputClass} value={form.clerkUserId} onChange={(e) => setForm({ ...form, clerkUserId: e.target.value })} /></Field>
          <Field label="Nombre"><input className={inputClass} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required /></Field>
          <Field label="Apellido"><input className={inputClass} value={form.apellido} onChange={(e) => setForm({ ...form, apellido: e.target.value })} required /></Field>
        </div>
        <Field label="Email"><input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></Field>
        <Field label="Teléfono"><input className={inputClass} value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo contrato">
            <select className={inputClass} value={form.tipoContrato} onChange={(e) => setForm({ ...form, tipoContrato: e.target.value as TipoContrato })}>
              {TIPOS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Costo/hora (USD)"><input type="number" step="0.01" className={inputClass} value={form.costoHora} onChange={(e) => setForm({ ...form, costoHora: +e.target.value })} required /></Field>
        </div>
      </FormModal>
    </div>
  )
}
