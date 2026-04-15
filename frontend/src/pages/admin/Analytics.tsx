import { BarChart3, TrendingUp, Users, BookOpen } from 'lucide-react'
import { Card, PageHeader, ProgressBar, StatCard } from '@/components/admin/ui'

export default function Analytics() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Analíticas"
        description="Métricas académicas y de recursos del semestre"
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Tasa de aprobación" value="87.4%" delta="+2.1%" icon={TrendingUp} accent="success" />
        <StatCard label="Retención" value="92.1%" delta="+0.4%" icon={Users} accent="info" />
        <StatCard label="Materias saturadas" value="9" delta="-3" trend="down" icon={BookOpen} accent="warning" />
        <StatCard label="Choques resueltos" value="124" icon={BarChart3} accent="critical" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">Inscripciones por mes</h3>
            <p className="text-xs text-muted-foreground">Últimos 12 meses</p>
          </div>
          <div className="flex h-64 items-end gap-2">
            {[40, 55, 62, 48, 70, 85, 78, 90, 72, 95, 110, 88].map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-gradient-to-t from-status-warning to-amber-400"
                  style={{ height: `${v}%` }}
                />
                <span className="text-[10px] text-muted-foreground">
                  {['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][i]}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-1 text-lg font-semibold text-foreground">Top Carreras</h3>
          <p className="mb-4 text-xs text-muted-foreground">Por número de estudiantes</p>
          <div className="space-y-4">
            {[
              { name: 'Ing. Software', value: 520, pct: 90 },
              { name: 'Sistemas', value: 342, pct: 65 },
              { name: 'Ciencias', value: 245, pct: 45 },
              { name: 'Diseño', value: 177, pct: 32 },
            ].map((c) => (
              <div key={c.name}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-foreground">{c.name}</span>
                  <span className="font-mono text-muted-foreground">{c.value}</span>
                </div>
                <ProgressBar value={c.pct} accent="warning" />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="mb-1 text-lg font-semibold text-foreground">Distribución por semestre</h3>
          <p className="mb-4 text-xs text-muted-foreground">Estudiantes activos</p>
          <div className="grid grid-cols-5 gap-2">
            {[220, 186, 164, 142, 118, 96, 82, 74, 58, 44].map((v, i) => (
              <div key={i} className="rounded-lg border border-border bg-background/50 p-3 text-center">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  S{i + 1}
                </p>
                <p className="mt-1 text-lg font-bold text-foreground">{v}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-1 text-lg font-semibold text-foreground">Uso de recursos</h3>
          <p className="mb-4 text-xs text-muted-foreground">Por tipo de espacio</p>
          <div className="space-y-4">
            {[
              { name: 'Aulas', pct: 78 },
              { name: 'Laboratorios', pct: 62 },
              { name: 'Auditorios', pct: 45 },
              { name: 'Sala de cómputo', pct: 88 },
            ].map((r) => (
              <div key={r.name}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-foreground">{r.name}</span>
                  <span className="font-mono text-muted-foreground">{r.pct}%</span>
                </div>
                <ProgressBar
                  value={r.pct}
                  accent={r.pct > 80 ? 'critical' : r.pct > 60 ? 'warning' : 'success'}
                />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
