import { GraduationCap, Mail, Plus, Search } from 'lucide-react'
import { Badge, Card, PageHeader, StatCard } from '@/components/admin/ui'

type Profesor = {
  id: string
  nombre: string
  email: string
  departamento: string
  materias: number
  carga: number
  estado: 'Activo' | 'Licencia' | 'Inactivo'
}

const profesores: Profesor[] = [
  { id: '1', nombre: 'Dr. Carlos Pérez', email: 'c.perez@keyinstitute.edu.sv', departamento: 'Ciencias', materias: 3, carga: 18, estado: 'Activo' },
  { id: '2', nombre: 'Ing. Laura Ramírez', email: 'l.ramirez@keyinstitute.edu.sv', departamento: 'Ing. Software', materias: 4, carga: 20, estado: 'Activo' },
  { id: '3', nombre: 'Dr. Miguel Mejía', email: 'm.mejia@keyinstitute.edu.sv', departamento: 'Ing. Software', materias: 2, carga: 10, estado: 'Activo' },
  { id: '4', nombre: 'Ing. Ana Castro', email: 'a.castro@keyinstitute.edu.sv', departamento: 'Sistemas', materias: 3, carga: 12, estado: 'Licencia' },
  { id: '5', nombre: 'Dra. Sofía Navas', email: 's.navas@keyinstitute.edu.sv', departamento: 'Ciencias', materias: 4, carga: 22, estado: 'Activo' },
  { id: '6', nombre: 'Ing. Raúl Méndez', email: 'r.mendez@keyinstitute.edu.sv', departamento: 'Sistemas', materias: 2, carga: 8, estado: 'Inactivo' },
]

export default function Profesores() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Profesores"
        description="Carga docente, disponibilidad y asignaciones"
        actions={
          <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-status-warning px-4 text-sm font-semibold text-white hover:bg-status-warning/90">
            <Plus className="h-4 w-4" /> Nuevo Profesor
          </button>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Profesores" value="87" icon={GraduationCap} accent="warning" />
        <StatCard label="Activos" value="74" icon={GraduationCap} accent="success" />
        <StatCard label="En licencia" value="6" icon={GraduationCap} accent="info" />
        <StatCard label="Carga promedio" value="14.2 h" delta="-0.8h" trend="down" icon={GraduationCap} accent="critical" />
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Buscar profesor..."
            className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm focus:border-status-warning/50 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {profesores.map((p) => (
          <Card key={p.id} className="transition-colors hover:border-status-warning/40">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-status-warning to-amber-500 text-sm font-bold text-white">
                {p.nombre
                  .split(' ')
                  .slice(-2)
                  .map((w) => w[0])
                  .join('')}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-foreground">{p.nombre}</p>
                  <Badge
                    variant={
                      p.estado === 'Activo' ? 'success' : p.estado === 'Licencia' ? 'warning' : 'muted'
                    }
                  >
                    {p.estado}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{p.departamento}</p>
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{p.email}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-center">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Materias</p>
                <p className="mt-0.5 text-lg font-bold text-foreground">{p.materias}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Carga / sem</p>
                <p className="mt-0.5 text-lg font-bold text-foreground">{p.carga}h</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
