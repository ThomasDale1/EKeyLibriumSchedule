import {
  Users,
  BookOpen,
  GraduationCap,
  CalendarCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import { Badge, Card, PageHeader, ProgressBar, StatCard } from '@/components/admin/ui'

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Panel General"
        description="Resumen del sistema académico en tiempo real"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Estudiantes" value="1,284" delta="+4.2%" icon={Users} accent="info" />
        <StatCard label="Profesores" value="87" delta="+2" icon={GraduationCap} accent="warning" />
        <StatCard label="Materias activas" value="142" delta="+6.1%" icon={BookOpen} accent="success" />
        <StatCard
          label="Inscripciones"
          value="32.4%"
          delta="-0.5%"
          trend="down"
          icon={CalendarCheck}
          accent="critical"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Enrollment chart placeholder */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Inscripciones del Semestre</h3>
              <p className="text-xs text-muted-foreground">
                Evolución diaria de registros en el sistema
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="muted">30 días</Badge>
              <Badge variant="warning">En vivo</Badge>
            </div>
          </div>
          <div className="relative h-64 w-full overflow-hidden rounded-lg border border-border bg-gradient-to-b from-status-warning/5 to-transparent">
            {/* Fake line chart using SVG */}
            <svg viewBox="0 0 600 200" className="h-full w-full" preserveAspectRatio="none">
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0,150 C60,140 100,90 160,100 C220,110 260,40 320,60 C380,80 420,130 480,110 C540,90 580,70 600,80 L600,200 L0,200 Z"
                fill="url(#grad)"
              />
              <path
                d="M0,150 C60,140 100,90 160,100 C220,110 260,40 320,60 C380,80 420,130 480,110 C540,90 580,70 600,80"
                stroke="#f97316"
                strokeWidth="2"
                fill="none"
              />
            </svg>
          </div>
        </Card>

        {/* Sistema */}
        <Card>
          <h3 className="mb-1 text-lg font-semibold text-foreground">Estado del Sistema</h3>
          <p className="mb-4 text-xs text-muted-foreground">Disponibilidad de servicios</p>
          <div className="space-y-4">
            {[
              { name: 'Motor de horarios', status: 'ok', value: 99 },
              { name: 'Base de datos', status: 'ok', value: 100 },
              { name: 'Autenticación', status: 'ok', value: 98 },
              { name: 'Servicio de correos', status: 'warn', value: 72 },
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
        {/* Próximas clases */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Próximas Clases</h3>
              <p className="text-xs text-muted-foreground">Hoy, programadas en el campus</p>
            </div>
            <Badge variant="info">12 en total</Badge>
          </div>
          <div className="space-y-3">
            {[
              { name: 'Matemáticas Discretas', prof: 'Dr. Pérez', room: 'A-204', time: '09:00', status: 'En curso' },
              { name: 'Bases de Datos II', prof: 'Ing. Ramírez', room: 'Lab 3', time: '10:30', status: 'Próxima' },
              { name: 'Algoritmos Avanzados', prof: 'Dr. Mejía', room: 'B-101', time: '13:00', status: 'Próxima' },
              { name: 'Redes de Computadoras', prof: 'Ing. Castro', room: 'Lab 1', time: '15:30', status: 'Próxima' },
            ].map((c) => (
              <div
                key={c.name}
                className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-4 py-3 hover:border-status-warning/40"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-status-warning/10 text-status-warning">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.prof} · Aula {c.room}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono text-foreground">{c.time}</p>
                  <Badge variant={c.status === 'En curso' ? 'success' : 'muted'}>
                    {c.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Alertas */}
        <Card>
          <h3 className="mb-1 text-lg font-semibold text-foreground">Alertas Activas</h3>
          <p className="mb-4 text-xs text-muted-foreground">Requieren atención</p>
          <div className="space-y-3">
            <AlertRow
              variant="critical"
              icon={AlertTriangle}
              title="Aula B-305 sobre capacidad"
              meta="Hace 12 min"
            />
            <AlertRow
              variant="warning"
              icon={AlertTriangle}
              title="Conflicto de horario detectado"
              meta="Materia: Física II"
            />
            <AlertRow
              variant="success"
              icon={CheckCircle2}
              title="Optimización completada"
              meta="Semestre 2026-01"
            />
          </div>
        </Card>
      </div>
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
