import { CalendarDays, Sparkles } from 'lucide-react'
import { PageHeader } from '@/components/admin/ui'
import { ScheduleBuilder } from '@/features/scheduler/components/ScheduleBuilder'

export default function Horarios() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Horario Builder"
        description="Arrastra materias al calendario, redimensiona bloques y resuelve conflictos en vivo"
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
      <ScheduleBuilder />
    </div>
  )
}
