import {
  Users,
  BookOpen,
  GraduationCap,
  CalendarCheck,
  AlertTriangle,
  CheckCircle2,
  DoorOpen,
} from 'lucide-react'
import { Badge, Card, PageHeader, ProgressBar, StatCard } from '@/components/admin/ui'
import {
  Aulas,
  Carreras,
  Estudiantes,
  Inscripciones,
  Materias,
  Profesores,
  Secciones,
  useMe,
} from '@/hooks/useApiQueries'

export default function Dashboard() {
  const { data: me } = useMe()
  const estudiantes = Estudiantes.useList().data ?? []
  const profesores = Profesores.useList().data ?? []
  const materias = Materias.useList().data ?? []
  const aulas = Aulas.useList().data ?? []
  const carreras = Carreras.useList().data ?? []
  const secciones = Secciones.useList().data ?? []
  const inscripciones = Inscripciones.useList().data ?? []

  const materiasActivas = materias.filter((m: { activa?: boolean }) => m.activa).length
  const aulasActivas = aulas.filter((a: { activa?: boolean }) => a.activa).length
  const inscripcionesConfirmadas = inscripciones.filter((i: { estado?: string }) => i.estado === 'CONFIRMADA').length
  const tasaInscripcion = inscripciones.length
    ? Math.round((inscripcionesConfirmadas / inscripciones.length) * 100)
    : 0

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hola, ${me?.nombre ?? 'Admin'} 👋`}
        description="Resumen del sistema académico en tiempo real"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Estudiantes" value={String(estudiantes.length)} icon={Users} accent="info" />
        <StatCard label="Profesores" value={String(profesores.length)} icon={GraduationCap} accent="warning" />
        <StatCard label="Materias activas" value={String(materiasActivas)} icon={BookOpen} accent="success" />
        <StatCard label="Inscripciones conf." value={`${tasaInscripcion}%`} icon={CalendarCheck} accent="critical" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">Distribución de Recursos</h3>
            <p className="text-xs text-muted-foreground">Conteo actual del sistema</p>
          </div>
          <div className="space-y-4">
            <ResourceRow label="Carreras" value={carreras.length} icon={BookOpen} />
            <ResourceRow label="Materias" value={materias.length} icon={BookOpen} />
            <ResourceRow label="Secciones" value={secciones.length} icon={CalendarCheck} />
            <ResourceRow label="Aulas" value={aulas.length} icon={DoorOpen} />
          </div>
        </Card>

        <Card>
          <h3 className="mb-1 text-lg font-semibold text-foreground">Estado del Sistema</h3>
          <p className="mb-4 text-xs text-muted-foreground">Disponibilidad de servicios</p>
          <div className="space-y-4">
            {[
              { name: 'Aulas activas', status: aulas.length ? 'ok' : 'warn', value: aulas.length ? Math.round((aulasActivas / aulas.length) * 100) : 0 },
              { name: 'Tasa de inscripción', status: tasaInscripcion >= 50 ? 'ok' : 'warn', value: tasaInscripcion },
              { name: 'Secciones', status: secciones.length ? 'ok' : 'warn', value: secciones.length ? Math.round((secciones.filter((s: { estado?: string }) => s.estado === 'ABIERTA').length / secciones.length) * 100) : 0 },
            ].map((s) => (
              <div key={s.name}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-foreground">{s.name}</span>
                  <span className="text-muted-foreground">{s.value}%</span>
                </div>
                <ProgressBar value={s.value} accent={s.status === 'ok' ? 'success' : 'warning'} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Últimas Inscripciones</h3>
              <p className="text-xs text-muted-foreground">Registros recientes en el sistema</p>
            </div>
            <Badge variant="info">{inscripciones.length} en total</Badge>
          </div>
          <div className="space-y-3">
            {inscripciones.slice(0, 5).map((i: { id: string; estado?: string; estudiante?: { nombre: string }; seccion?: { materia?: { nombre: string } }; seccionId?: string; creadoEn: string }) => (
              <div key={i.id} className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {i.estudiante?.nombre ?? 'Estudiante'} → {i.seccion?.materia?.nombre ?? i.seccionId}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(i.creadoEn).toLocaleString()}
                  </p>
                </div>
                <Badge variant={i.estado === 'CONFIRMADA' ? 'success' : 'muted'}>{i.estado ?? 'PENDIENTE'}</Badge>
              </div>
            ))}
            {inscripciones.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Aún no hay inscripciones registradas.
              </p>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="mb-1 text-lg font-semibold text-foreground">Alertas</h3>
          <p className="mb-4 text-xs text-muted-foreground">Requieren atención</p>
          <div className="space-y-3">
            {carreras.length === 0 && (
              <AlertRow variant="warning" icon={AlertTriangle} title="No hay carreras" meta="Crea una carrera para empezar" />
            )}
            {aulas.length === 0 && (
              <AlertRow variant="warning" icon={AlertTriangle} title="No hay aulas" meta="Agrega salones desde 'Salones'" />
            )}
            {profesores.length === 0 && (
              <AlertRow variant="warning" icon={AlertTriangle} title="No hay profesores" meta="Registra docentes desde 'Profesores'" />
            )}
            {carreras.length > 0 && aulas.length > 0 && profesores.length > 0 && (
              <AlertRow variant="success" icon={CheckCircle2} title="Sistema operativo" meta="Todos los recursos base están configurados" />
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}

function ResourceRow({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-status-warning/10 text-status-warning">
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <span className="font-mono text-lg font-bold text-foreground">{value}</span>
    </div>
  )
}

function AlertRow({
  variant,
  icon: Icon,
  title,
  meta,
}: {
  variant: 'critical' | 'warning' | 'success'
  icon: React.ComponentType<{ className?: string }>
  title: string
  meta: string
}) {
  const map = {
    critical: 'bg-status-critical/10 text-status-critical',
    warning: 'bg-status-warning/10 text-status-warning',
    success: 'bg-status-success/10 text-status-success',
  }
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-background/40 p-3">
      <div className={`rounded-md p-1.5 ${map[variant]}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{meta}</p>
      </div>
    </div>
  )
}
