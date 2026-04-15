import { Users, Plus, Search } from 'lucide-react'
import { Badge, Card, DataTable, PageHeader, StatCard } from '@/components/admin/ui'

type Estudiante = {
  carnet: string
  nombre: string
  carrera: string
  semestre: number
  creditos: number
  promedio: number
  estado: 'Activo' | 'Inactivo' | 'Graduado'
}

const estudiantes: Estudiante[] = [
  { carnet: 'EKL-24001', nombre: 'Andrea Flores', carrera: 'Ing. Software', semestre: 5, creditos: 85, promedio: 9.1, estado: 'Activo' },
  { carnet: 'EKL-24002', nombre: 'Luis Torres', carrera: 'Sistemas', semestre: 3, creditos: 48, promedio: 8.4, estado: 'Activo' },
  { carnet: 'EKL-23118', nombre: 'María Pineda', carrera: 'Ing. Software', semestre: 7, creditos: 120, promedio: 9.5, estado: 'Activo' },
  { carnet: 'EKL-22044', nombre: 'Jorge Alvarado', carrera: 'Ciencias', semestre: 9, creditos: 160, promedio: 8.9, estado: 'Graduado' },
  { carnet: 'EKL-25010', nombre: 'Sofía Rivas', carrera: 'Ing. Software', semestre: 1, creditos: 18, promedio: 8.0, estado: 'Activo' },
  { carnet: 'EKL-23077', nombre: 'Daniel Serrano', carrera: 'Sistemas', semestre: 6, creditos: 102, promedio: 7.8, estado: 'Inactivo' },
]

export default function Estudiantes() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Estudiantes"
        description="Registro académico y estado de inscripción"
        actions={
          <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-status-warning px-4 text-sm font-semibold text-white hover:bg-status-warning/90">
            <Plus className="h-4 w-4" /> Nuevo Estudiante
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Estudiantes" value="1,284" delta="+52" icon={Users} accent="warning" />
        <StatCard label="Activos" value="1,142" icon={Users} accent="success" />
        <StatCard label="Promedio global" value="8.6" delta="+0.1" icon={Users} accent="info" />
        <StatCard label="Graduados 2026" value="186" icon={Users} accent="critical" />
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Buscar por carnet o nombre..."
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm focus:border-status-warning/50 focus:outline-none"
            />
          </div>
          <select className="h-9 rounded-lg border border-border bg-background px-3 text-sm">
            <option>Todas las carreras</option>
          </select>
          <select className="h-9 rounded-lg border border-border bg-background px-3 text-sm">
            <option>Todos los estados</option>
          </select>
        </div>

        <DataTable<Estudiante>
          columns={[
            { key: 'carnet', label: 'Carnet', render: (r) => <span className="font-mono text-xs text-muted-foreground">{r.carnet}</span> },
            { key: 'nombre', label: 'Nombre', render: (r) => <span className="font-medium">{r.nombre}</span> },
            { key: 'carrera', label: 'Carrera' },
            { key: 'semestre', label: 'Sem.' },
            { key: 'creditos', label: 'Créditos' },
            {
              key: 'promedio',
              label: 'Promedio',
              render: (r) => (
                <span className={r.promedio >= 9 ? 'text-status-success font-semibold' : 'text-foreground'}>
                  {r.promedio.toFixed(1)}
                </span>
              ),
            },
            {
              key: 'estado',
              label: 'Estado',
              render: (r) => (
                <Badge
                  variant={r.estado === 'Activo' ? 'success' : r.estado === 'Graduado' ? 'info' : 'muted'}
                >
                  {r.estado}
                </Badge>
              ),
            },
          ]}
          rows={estudiantes}
        />
      </Card>
    </div>
  )
}
