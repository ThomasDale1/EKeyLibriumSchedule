import { CalendarDays, Sparkles } from 'lucide-react'
import { Badge, Card, PageHeader } from '@/components/admin/ui'

const hours = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00']
const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']

type Clase = {
  day: number
  start: number
  duration: number
  name: string
  room: string
  color: string
}

const clases: Clase[] = [
  { day: 0, start: 1, duration: 2, name: 'Mat. Discretas', room: 'A-204', color: 'warning' },
  { day: 0, start: 4, duration: 2, name: 'BDD II', room: 'Lab 3', color: 'info' },
  { day: 1, start: 2, duration: 2, name: 'Algoritmos', room: 'B-101', color: 'success' },
  { day: 2, start: 0, duration: 2, name: 'Redes', room: 'Lab 1', color: 'critical' },
  { day: 2, start: 5, duration: 3, name: 'Física II', room: 'A-110', color: 'warning' },
  { day: 3, start: 1, duration: 2, name: 'Mat. Discretas', room: 'A-204', color: 'warning' },
  { day: 4, start: 3, duration: 2, name: 'IA', room: 'Lab 2', color: 'info' },
]

const colorMap: Record<string, string> = {
  warning: 'bg-status-warning/15 border-status-warning/30 text-status-warning',
  info: 'bg-status-info/15 border-status-info/30 text-status-info',
  success: 'bg-status-success/15 border-status-success/30 text-status-success',
  critical: 'bg-status-critical/15 border-status-critical/30 text-status-critical',
}

export default function Horarios() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Horarios"
        description="Vista semanal del calendario académico"
        actions={
          <>
            <button className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm text-foreground hover:bg-muted">
              <CalendarDays className="h-4 w-4" /> Exportar
            </button>
            <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-status-warning px-4 text-sm font-semibold text-white hover:bg-status-warning/90">
              <Sparkles className="h-4 w-4" /> Optimizar
            </button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="warning">Semestre 2026-01</Badge>
        <Badge variant="success">Sin conflictos</Badge>
        <Badge variant="muted">7 clases</Badge>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="grid" style={{ gridTemplateColumns: '80px repeat(5, 1fr)' }}>
          {/* Header row */}
          <div className="border-b border-r border-border bg-muted/20 p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Hora
          </div>
          {days.map((d) => (
            <div
              key={d}
              className="border-b border-r border-border bg-muted/20 p-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground last:border-r-0"
            >
              {d}
            </div>
          ))}

          {/* Hour rows */}
          {hours.map((h, hi) => (
            <HourRow key={h} hour={h} hi={hi} />
          ))}
        </div>
      </Card>
    </div>
  )

  function HourRow({ hour, hi }: { hour: string; hi: number }) {
    return (
      <>
        <div className="border-b border-r border-border bg-card p-2 text-right text-xs font-mono text-muted-foreground">
          {hour}
        </div>
        {days.map((_, di) => {
          const clase = clases.find((c) => c.day === di && c.start === hi)
          return (
            <div
              key={di}
              className="relative border-b border-r border-border bg-card/50 p-1 last:border-r-0"
              style={{ minHeight: 56 }}
            >
              {clase && (
                <div
                  className={`absolute inset-1 rounded-md border p-2 ${colorMap[clase.color]}`}
                  style={{ height: `calc(${clase.duration * 56}px - 8px)` }}
                >
                  <p className="text-xs font-semibold">{clase.name}</p>
                  <p className="mt-0.5 text-[10px] opacity-80">{clase.room}</p>
                </div>
              )}
            </div>
          )
        })}
      </>
    )
  }
}
