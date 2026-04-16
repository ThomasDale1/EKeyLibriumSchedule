import { DoorOpen, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Badge, Card, PageHeader, StatCard } from '@/components/admin/ui'
import { Aulas as AulasApi } from '@/hooks/useApiQueries'
import { FormModal, Field, inputClass } from '@/components/admin/FormModal'
import type { TipoAula } from '@/lib/types'

const TIPOS: TipoAula[] = ['TEORIA', 'LABORATORIO_COMPUTO', 'LABORATORIO_CIENCIAS', 'AUDITORIO']

export default function Salones() {
  const { data: aulas = [], isLoading, error } = AulasApi.useList()
  const create = AulasApi.useCreate()
  const remove = AulasApi.useDelete()

  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    codigo: '',
    nombre: '',
    capacidad: 30,
    tipo: 'TEORIA' as TipoAula,
    edificio: '',
    piso: 1,
    tieneProyector: true,
    tieneAC: false,
    tieneInternet: true,
    activa: true,
  })

  const activas = aulas.filter((a) => a.activa).length
  const capacidadTotal = aulas.reduce((sum, a) => sum + a.capacidad, 0)

  const submit = async () => {
    try {
      await create.mutateAsync(form)
      setOpen(false)
      setForm({ codigo: '', nombre: '', capacidad: 30, tipo: 'TEORIA', edificio: '', piso: 1, tieneProyector: true, tieneAC: false, tieneInternet: true, activa: true })
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

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total salones" value={String(aulas.length)} icon={DoorOpen} accent="warning" />
        <StatCard label="Activos" value={String(activas)} icon={DoorOpen} accent="success" />
        <StatCard label="Laboratorios" value={String(aulas.filter((a) => a.tipo.startsWith('LABORATORIO')).length)} icon={DoorOpen} accent="info" />
        <StatCard label="Capacidad total" value={String(capacidadTotal)} icon={DoorOpen} accent="critical" />
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-muted-foreground">Cargando...</div>
      ) : error ? (
        <div className="py-8 text-center text-red-400">Error al cargar aulas</div>
      ) : aulas.length === 0 ? (
        <Card><p className="py-8 text-center text-muted-foreground">Aún no hay aulas registradas.</p></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {aulas.map((a) => (
            <Card key={a.id}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{a.codigo}</span>
                    <Badge variant="muted">{a.tipo}</Badge>
                  </div>
                  <p className="mt-2 text-base font-semibold text-foreground">{a.nombre}</p>
                  {a.edificio && <p className="text-xs text-muted-foreground">Edif. {a.edificio} · Piso {a.piso ?? '—'}</p>}
                </div>
                <Badge variant={a.activa ? 'success' : 'muted'}>{a.activa ? 'Disponible' : 'Inactiva'}</Badge>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>Capacidad: <span className="font-mono text-foreground">{a.capacidad}</span></span>
                <div className="flex gap-2">
                  {a.tieneProyector && <Badge variant="info">Proyector</Badge>}
                  {a.tieneAC && <Badge variant="info">A/C</Badge>}
                  {a.tieneInternet && <Badge variant="info">Wi-Fi</Badge>}
                </div>
              </div>
              <div className="mt-3 flex justify-end border-t border-border pt-2">
                <button
                  onClick={() => confirm(`¿Eliminar ${a.codigo}?`) && remove.mutate(a.id)}
                  className="text-muted-foreground hover:text-status-critical"
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
