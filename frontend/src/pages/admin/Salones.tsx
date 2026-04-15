import { DoorOpen, Plus } from 'lucide-react'
import { Badge, Card, PageHeader, ProgressBar, StatCard } from '@/components/admin/ui'

type Salon = {
  codigo: string
  nombre: string
  capacidad: number
  ocupacion: number
  tipo: 'Aula' | 'Laboratorio' | 'Auditorio'
  estado: 'Disponible' | 'Ocupado' | 'Mantenimiento'
}

const salones: Salon[] = [
  { codigo: 'A-101', nombre: 'Aula Edif. A', capacidad: 40, ocupacion: 32, tipo: 'Aula', estado: 'Ocupado' },
  { codigo: 'A-204', nombre: 'Aula Edif. A', capacidad: 45, ocupacion: 38, tipo: 'Aula', estado: 'Ocupado' },
  { codigo: 'B-101', nombre: 'Aula Edif. B', capacidad: 35, ocupacion: 0, tipo: 'Aula', estado: 'Disponible' },
  { codigo: 'LAB-1', nombre: 'Laboratorio de Redes', capacidad: 28, ocupacion: 14, tipo: 'Laboratorio', estado: 'Ocupado' },
  { codigo: 'LAB-2', nombre: 'Laboratorio de IA', capacidad: 25, ocupacion: 0, tipo: 'Laboratorio', estado: 'Mantenimiento' },
  { codigo: 'AUD-1', nombre: 'Auditorio Principal', capacidad: 200, ocupacion: 120, tipo: 'Auditorio', estado: 'Ocupado' },
]

export default function Salones() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Salones"
        description="Disponibilidad, capacidad y estado de recursos físicos"
        actions={
          <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-status-warning px-4 text-sm font-semibold text-white hover:bg-status-warning/90">
            <Plus className="h-4 w-4" /> Nuevo Salón
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total salones" value="42" icon={DoorOpen} accent="warning" />
        <StatCard label="Disponibles" value="14" icon={DoorOpen} accent="success" />
        <StatCard label="Ocupados" value="26" icon={DoorOpen} accent="info" />
        <StatCard label="Mantenimiento" value="2" icon={DoorOpen} accent="critical" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {salones.map((s) => {
          const pct = Math.round((s.ocupacion / s.capacidad) * 100)
          return (
            <Card key={s.codigo}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{s.codigo}</span>
                    <Badge variant="muted">{s.tipo}</Badge>
                  </div>
                  <p className="mt-2 text-base font-semibold text-foreground">{s.nombre}</p>
                </div>
                <Badge
                  variant={
                    s.estado === 'Disponible'
                      ? 'success'
                      : s.estado === 'Ocupado'
                        ? 'warning'
                        : 'critical'
                  }
                >
                  {s.estado}
                </Badge>
              </div>

              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Ocupación</span>
                  <span className="font-mono text-foreground">
                    {s.ocupacion}/{s.capacidad}
                  </span>
                </div>
                <ProgressBar
                  value={pct}
                  accent={pct > 90 ? 'critical' : pct > 60 ? 'warning' : 'success'}
                />
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
