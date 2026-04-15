import { BookOpen, Plus, Search, SlidersHorizontal } from 'lucide-react'
import { Badge, Card, DataTable, PageHeader, ProgressBar, StatCard } from '@/components/admin/ui'

type Materia = {
  codigo: string
  nombre: string
  creditos: number
  departamento: string
  profesor: string
  cupos: number
  inscritos: number
  estado: 'Activa' | 'Borrador' | 'Archivada'
}

const materias: Materia[] = [
  { codigo: 'MAT-201', nombre: 'Matemáticas Discretas', creditos: 4, departamento: 'Ciencias', profesor: 'Dr. Pérez', cupos: 40, inscritos: 38, estado: 'Activa' },
  { codigo: 'BDD-301', nombre: 'Bases de Datos II', creditos: 5, departamento: 'Ing. Software', profesor: 'Ing. Ramírez', cupos: 30, inscritos: 30, estado: 'Activa' },
  { codigo: 'ALG-402', nombre: 'Algoritmos Avanzados', creditos: 5, departamento: 'Ing. Software', profesor: 'Dr. Mejía', cupos: 35, inscritos: 22, estado: 'Activa' },
  { codigo: 'RED-210', nombre: 'Redes de Computadoras', creditos: 4, departamento: 'Sistemas', profesor: 'Ing. Castro', cupos: 28, inscritos: 14, estado: 'Activa' },
  { codigo: 'IA-501', nombre: 'Inteligencia Artificial', creditos: 5, departamento: 'Ing. Software', profesor: '—', cupos: 25, inscritos: 0, estado: 'Borrador' },
  { codigo: 'FIS-102', nombre: 'Física II', creditos: 4, departamento: 'Ciencias', profesor: 'Dra. Navas', cupos: 45, inscritos: 41, estado: 'Activa' },
]

export default function Materias() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Materias"
        description="Gestiona el catálogo académico y cupos por período"
        actions={
          <>
            <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm text-foreground hover:bg-muted">
              <SlidersHorizontal className="h-4 w-4" /> Filtros
            </button>
            <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-status-warning px-4 text-sm font-semibold text-white hover:bg-status-warning/90">
              <Plus className="h-4 w-4" /> Nueva Materia
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total materias" value="142" icon={BookOpen} accent="warning" />
        <StatCard label="Activas" value="128" delta="+6" icon={BookOpen} accent="success" />
        <StatCard label="Borradores" value="8" icon={BookOpen} accent="info" />
        <StatCard label="Cupos ocupados" value="78%" delta="+3.2%" icon={BookOpen} accent="critical" />
      </div>

      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Buscar por código o nombre..."
              className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm focus:border-status-warning/50 focus:outline-none"
            />
          </div>
          <select className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
            <option>Todos los departamentos</option>
            <option>Ing. Software</option>
            <option>Ciencias</option>
            <option>Sistemas</option>
          </select>
          <select className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground">
            <option>Todos los estados</option>
            <option>Activa</option>
            <option>Borrador</option>
            <option>Archivada</option>
          </select>
        </div>

        <DataTable<Materia>
          columns={[
            { key: 'codigo', label: 'Código', render: (r) => <span className="font-mono text-xs text-muted-foreground">{r.codigo}</span> },
            { key: 'nombre', label: 'Nombre', render: (r) => <span className="font-medium">{r.nombre}</span> },
            { key: 'departamento', label: 'Departamento' },
            { key: 'profesor', label: 'Profesor' },
            { key: 'creditos', label: 'Créditos', className: 'text-right' },
            {
              key: 'cupos',
              label: 'Cupos',
              render: (r) => (
                <div className="min-w-[140px]">
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>{r.inscritos}/{r.cupos}</span>
                    <span>{Math.round((r.inscritos / r.cupos) * 100) || 0}%</span>
                  </div>
                  <ProgressBar
                    value={(r.inscritos / r.cupos) * 100}
                    accent={r.inscritos / r.cupos > 0.9 ? 'critical' : r.inscritos / r.cupos > 0.6 ? 'warning' : 'success'}
                  />
                </div>
              ),
            },
            {
              key: 'estado',
              label: 'Estado',
              render: (r) => (
                <Badge variant={r.estado === 'Activa' ? 'success' : r.estado === 'Borrador' ? 'info' : 'muted'}>
                  {r.estado}
                </Badge>
              ),
            },
          ]}
          rows={materias}
        />
      </Card>
    </div>
  )
}
