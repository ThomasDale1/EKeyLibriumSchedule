import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Car,
  ChevronDown,
  ChevronRight,
  Clock,
  Construction,
  DollarSign,
  DoorOpen,
  GraduationCap,
  Layers,
  TrendingDown,
  TrendingUp,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react'
import { useId, useMemo, useState, type ReactNode } from 'react'
import { Card, PageHeader, ProgressBar, SkeletonCard, SkeletonStatCard } from '@/components/admin/ui'
import {
  Carreras,
  Estudiantes as EstudiantesApi,
  Materias as MateriasApi,
  Profesores as ProfesoresApi,
  Aulas as AulasApi,
} from '@/hooks/useApiQueries'
import type { Carrera, Estudiante, Materia, Profesor, Aula } from '@/lib/types'

function parseTimeToHours(time?: string): number {
  if (!time) return 0
  const [hours, minutes] = time.split(':')
  const h = Number(hours)
  const m = Number(minutes ?? '0')
  if (Number.isNaN(h) || Number.isNaN(m)) return 0
  return h + m / 60
}

// ── Main Page ─

export default function Analytics() {
  const { data: estudiantes = [], isLoading: loadingEst, isError: estudiantesError, error: estudiantesErrorData } = EstudiantesApi.useList()
  const { data: carreras = [], isLoading: loadingCar, isError: carrerasError, error: carrerasErrorData } = Carreras.useList()
  const { data: materias = [], isLoading: loadingMat, isError: materiasError, error: materiasErrorData } = MateriasApi.useList()
  const { data: profesores = [], isLoading: loadingProf, isError: profesoresError, error: profesoresErrorData } = ProfesoresApi.useList()
  const { data: aulas = [], isLoading: loadingAulas, isError: aulasError, error: aulasErrorData } = AulasApi.useList()

  const isError = estudiantesError || carrerasError || materiasError || profesoresError || aulasError
  const errorMessage = [estudiantesErrorData, carrerasErrorData, materiasErrorData, profesoresErrorData, aulasErrorData]
    .filter(Boolean)
    .map((err) => (err instanceof Error ? err.message : String(err)))
    .join(' | ')

  const isLoading = loadingEst || loadingCar || loadingMat || loadingProf || loadingAulas

  const kpis = useMemo(
    () => computeKpis(estudiantes, materias, profesores, aulas, carreras),
    [estudiantes, materias, profesores, aulas, carreras]
  )

  if (isError) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Analíticas"
          description="No se pudieron cargar los datos. Revisa el error y vuelve a intentarlo."
        />
        <Card className="border-status-critical bg-status-critical/5 p-6">
          <div className="flex items-start gap-3 text-status-critical">
            <AlertTriangle className="h-6 w-6" />
            <div>
              <h2 className="text-lg font-semibold">Error al cargar datos</h2>
              <p className="mt-1 text-sm text-muted-foreground">{errorMessage || 'Ocurrió un error inesperado.'}</p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Analíticas"
          description="Métricas académicas, financieras y de recursos en tiempo real"
        />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => <SkeletonStatCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => <SkeletonCard key={i} className="h-56" />)}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SkeletonCard className="h-48" />
          <SkeletonCard className="h-48" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <SkeletonCard className="h-40" />
          <SkeletonCard className="h-40 lg:col-span-2" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analíticas"
        description="Métricas académicas, financieras y de recursos en tiempo real"
      />

      {/* ── Top KPIs ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Tasa de retención"
          value={`${kpis.retencion.toFixed(1)}%`}
          icon={UserCheck}
          accent="success"
          trend={kpis.retencion >= 90 ? 'up' : 'down'}
          subtitle={`${kpis.estudiantesActivos} activos de ${kpis.totalEstudiantes}`}
        />
        <KpiCard
          label="Tasa de atraso"
          value={`${kpis.tasaAtraso.toFixed(1)}%`}
          icon={Clock}
          accent={kpis.tasaAtraso > 30 ? 'critical' : kpis.tasaAtraso > 15 ? 'warning' : 'success'}
          trend={kpis.tasaAtraso > 20 ? 'down' : 'up'}
          subtitle={`${kpis.estudiantesAtrasados} estudiantes atrasados`}
        />
        <KpiCard
          label="Materias saturadas"
          value={String(kpis.materiasSaturadas)}
          icon={AlertTriangle}
          accent={kpis.materiasSaturadas > 5 ? 'critical' : 'warning'}
          subtitle={`de ${materias.length} materias activas`}
        />
        <KpiCard
          label="Balance mensual"
          value={`$${Math.abs(kpis.balanceMensual).toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
          icon={DollarSign}
          accent={kpis.balanceMensual >= 0 ? 'success' : 'critical'}
          trend={kpis.balanceMensual >= 0 ? 'up' : 'down'}
          subtitle={kpis.balanceMensual >= 0 ? 'Superávit' : 'Déficit'}
        />
      </div>

      {/* ── Row 2: Academic + Financial ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Top Carreras */}
        <ExpandableCard
          title="Top Carreras"
          subtitle="Por estudiantes activos"
          icon={GraduationCap}
          expandedContent={
            <div className="mt-3 space-y-2 border-t border-border/40 pt-3">
              {kpis.carreraStats.map((c) => (
                <div key={c.id} className="text-[11px] text-muted-foreground">
                  <span className="text-foreground">{c.nombre}</span> — {c.activos} activos, {c.graduados} graduados, {c.atrasados} atrasados
                  {c.ingreso > 0 && <span className="ml-1 text-status-warning">(${c.ingreso.toFixed(0)}/mes)</span>}
                </div>
              ))}
            </div>
          }
        >
          <div className="space-y-3">
            {kpis.carreraStats.slice(0, 6).map((c) => (
              <div key={c.id}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-foreground">{c.nombre}</span>
                  <span className="font-mono text-muted-foreground">{c.activos}</span>
                </div>
                <ProgressBar
                  value={kpis.estudiantesActivos > 0 ? (c.activos / kpis.estudiantesActivos) * 100 : 0}
                  accent="warning"
                />
              </div>
            ))}
            {kpis.carreraStats.length === 0 && (
              <p className="py-4 text-center text-xs text-muted-foreground">Sin datos</p>
            )}
          </div>
        </ExpandableCard>

        {/* Students per ciclo */}
        <ExpandableCard
          title="Estudiantes por ciclo"
          subtitle="Distribución de activos"
          icon={Layers}
          expandedContent={
            <div className="mt-3 space-y-1 border-t border-border/40 pt-3 text-[11px] text-muted-foreground">
              {kpis.cicloDistribution.map((c) => (
                <div key={c.ciclo} className="flex justify-between">
                  <span>Ciclo {c.ciclo}</span>
                  <span>{c.count} est. · {c.atrasados} atrasados · ${c.ingreso.toFixed(0)}/mes</span>
                </div>
              ))}
            </div>
          }
        >
          <div className="grid grid-cols-5 gap-2">
            {kpis.cicloDistribution.slice(0, 10).map((c) => (
              <div
                key={c.ciclo}
                className="rounded-lg border border-border bg-background/50 p-2.5 text-center transition-colors hover:border-status-warning/30"
              >
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground">C{c.ciclo}</p>
                <p className="mt-0.5 text-lg font-bold text-foreground">{c.count}</p>
                {c.atrasados > 0 && (
                  <p className="text-[9px] text-status-critical">{c.atrasados} atras.</p>
                )}
              </div>
            ))}
          </div>
        </ExpandableCard>

        {/* Finanzas */}
        <ExpandableCard
          title="Resumen Financiero"
          subtitle="Ingresos vs costos mensuales"
          icon={DollarSign}
          expandedContent={
            <div className="mt-3 space-y-1.5 border-t border-border/40 pt-3 text-[11px]">
              <div className="flex justify-between text-muted-foreground">
                <span>Ingreso por estudiantes</span>
                <span className="text-status-success">${kpis.ingresoEstudiantes.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Costo de aulas</span>
                <span className="text-status-critical">-${kpis.costoAulas.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Costo docente (estimado)</span>
                <span className="text-status-critical">-${kpis.costoDocente.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="mt-1 flex justify-between border-t border-border/30 pt-1 font-semibold">
                <span className="text-foreground">Balance</span>
                <span className={kpis.balanceMensual >= 0 ? 'text-status-success' : 'text-status-critical'}>
                  ${kpis.balanceMensual.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          }
        >
          <div className="space-y-3">
            <FinanceBar label="Ingresos" value={kpis.ingresoEstudiantes} max={Math.max(kpis.ingresoEstudiantes, kpis.costoAulas + kpis.costoDocente) || 1} color="bg-status-success" />
            <FinanceBar label="Costo aulas" value={kpis.costoAulas} max={Math.max(kpis.ingresoEstudiantes, kpis.costoAulas + kpis.costoDocente) || 1} color="bg-status-critical" />
            <FinanceBar label="Costo docente" value={kpis.costoDocente} max={Math.max(kpis.ingresoEstudiantes, kpis.costoAulas + kpis.costoDocente) || 1} color="bg-status-warning" />
          </div>
        </ExpandableCard>
      </div>

      {/* ── Row 3: Resources + Professors ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Classroom utilization */}
        <ExpandableCard
          title="Uso de recursos"
          subtitle="Aulas por tipo y capacidad"
          icon={DoorOpen}
          expandedContent={
            <div className="mt-3 space-y-1.5 border-t border-border/40 pt-3 text-[11px] text-muted-foreground">
              <div className="flex justify-between">
                <span>Total salones</span><span className="text-foreground">{aulas.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Activos</span><span className="text-foreground">{aulas.filter((a) => a.activa).length}</span>
              </div>
              <div className="flex justify-between">
                <span>Capacidad total</span><span className="text-foreground">{aulas.reduce((s, a) => s + a.capacidad, 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Capacidad promedio</span>
                <span className="text-foreground">
                  {aulas.length > 0 ? Math.round(aulas.reduce((s, a) => s + a.capacidad, 0) / aulas.length) : 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Costo mensual total</span>
                <span className="text-status-warning">
                  ${kpis.costoAulas.toFixed(2)}
                </span>
              </div>
            </div>
          }
        >
          <div className="space-y-3">
            {kpis.aulaStats.map((r) => (
              <div key={r.tipo}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-foreground">{r.label}</span>
                  <span className="font-mono text-muted-foreground">{r.count} ({r.capacidad} cap.)</span>
                </div>
                <ProgressBar
                  value={aulas.length > 0 ? (r.count / aulas.length) * 100 : 0}
                  accent={r.tipo === 'LABORATORIO_COMPUTO' ? 'info' : r.tipo === 'AUDITORIO' ? 'warning' : 'success'}
                />
              </div>
            ))}
          </div>
        </ExpandableCard>

        {/* Professor workload */}
        <ExpandableCard
          title="Carga docente"
          subtitle="Distribución de contratos y capacidad"
          icon={GraduationCap}
          expandedContent={
            <div className="mt-3 space-y-1.5 border-t border-border/40 pt-3 text-[11px] text-muted-foreground">
              {profesores.slice(0, 8).map((p) => {
                const workBlocks = (p.disponibilidad ?? []).filter((d) => !d.esBloqueo)
                const workHrs = workBlocks.reduce((s, d) => {
                  return s + parseTimeToHours(d.horaFin) - parseTimeToHours(d.horaInicio)
                }, 0)
                const subjectCount = (p.materias ?? []).length
                return (
                  <div key={p.id} className="flex items-center justify-between">
                    <span className="text-foreground">{p.nombre} {p.apellido}</span>
                    <span>{workHrs.toFixed(0)}h lab. · {subjectCount} mat. · max {p.maxHorasSemana}h/sem</span>
                  </div>
                )
              })}
            </div>
          }
        >
          <div className="space-y-3">
            {kpis.profesorStats.map((s) => (
              <div key={s.tipo}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-foreground">{s.label}</span>
                  <span className="font-mono text-muted-foreground">{s.count} prof.</span>
                </div>
                <ProgressBar
                  value={profesores.length > 0 ? (s.count / profesores.length) * 100 : 0}
                  accent={s.tipo === 'TIEMPO_COMPLETO' ? 'success' : s.tipo === 'MEDIO_TIEMPO' ? 'info' : 'warning'}
                />
              </div>
            ))}
            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Cap. total clase/sem</span>
              <span className="font-mono text-foreground">{kpis.totalHorasClaseCapacidad}h</span>
            </div>
          </div>
        </ExpandableCard>
      </div>

      {/* ── Row 4: Transport + Materias demand ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Transport / Parking */}
        <ExpandableCard
          title="Transporte y parqueo"
          subtitle="Estudiantes con vehículo propio"
          icon={Car}
          expandedContent={
            <div className="mt-3 space-y-1.5 border-t border-border/40 pt-3 text-[11px] text-muted-foreground">
              {kpis.carreraStats.filter((c) => c.conVehiculo > 0).map((c) => (
                <div key={c.id} className="flex justify-between">
                  <span>{c.nombre}</span>
                  <span>{c.conVehiculo} con vehículo ({c.activos > 0 ? ((c.conVehiculo / c.activos) * 100).toFixed(0) : 0}%)</span>
                </div>
              ))}
            </div>
          }
        >
          <div className="flex items-center gap-6">
            <div className="relative flex h-28 w-28 items-center justify-center">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted/50" />
                <circle
                  cx="18" cy="18" r="16" fill="none" strokeWidth="3"
                  strokeDasharray={`${kpis.pctVehiculo} ${100 - kpis.pctVehiculo}`}
                  strokeLinecap="round"
                  className="text-status-warning"
                  stroke="currentColor"
                />
              </svg>
              <span className="absolute text-lg font-bold text-foreground">{kpis.pctVehiculo.toFixed(0)}%</span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-status-warning" />
                <span className="text-foreground">{kpis.conVehiculo}</span>
                <span className="text-muted-foreground">con vehículo</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-muted" />
                <span className="text-foreground">{kpis.estudiantesActivos - kpis.conVehiculo}</span>
                <span className="text-muted-foreground">sin vehículo</span>
              </div>
            </div>
          </div>
        </ExpandableCard>

        {/* Top saturated materias */}
        <ExpandableCard
          title="Materias con mayor demanda"
          subtitle="Demanda vs capacidad promedio"
          icon={BookOpen}
          className="lg:col-span-2"
          expandedContent={
            <div className="mt-3 space-y-1 border-t border-border/40 pt-3 text-[11px] text-muted-foreground">
              {kpis.materiaDemand.slice(0, 12).map((m) => (
                <div key={m.id} className="flex justify-between">
                  <span><span className="font-mono">{m.codigo}</span> {m.nombre}</span>
                  <span>
                    Demanda: {m.demand} · Secciones sugeridas: <span className="text-status-warning">{m.suggestedSections}</span> · Ciclo {m.ciclo}
                  </span>
                </div>
              ))}
            </div>
          }
        >
          <div className="space-y-2">
            {kpis.materiaDemand.slice(0, 6).map((m) => {
              const pct = kpis.estudiantesActivos > 0 ? (m.demand / kpis.estudiantesActivos) * 100 : 0
              const isSaturated = m.demand > kpis.avgCapacity
              return (
                <div key={m.id}>
                  <div className="mb-0.5 flex items-center justify-between text-xs">
                    <span className="text-foreground">
                      <span className="font-mono text-[10px] text-muted-foreground">{m.codigo}</span> {m.nombre}
                    </span>
                    <span className={`font-mono ${isSaturated ? 'text-status-critical' : 'text-muted-foreground'}`}>
                      {m.demand} {isSaturated && '!!'}
                    </span>
                  </div>
                  <ProgressBar value={Math.min(100, pct * 2)} accent={isSaturated ? 'critical' : pct > 30 ? 'warning' : 'success'} />
                </div>
              )
            })}
          </div>
        </ExpandableCard>
      </div>

      {/* ── Row 5: Alerts + Suggestions ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-status-warning" />
            <h3 className="text-base font-semibold text-foreground">Alertas</h3>
          </div>
          <div className="space-y-2">
            {kpis.alertas.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">Sin alertas activas</p>
            ) : (
              kpis.alertas.map((a, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
                    a.severity === 'critical'
                      ? 'border-status-critical/20 bg-status-critical/5 text-status-critical'
                      : a.severity === 'warning'
                        ? 'border-status-warning/20 bg-status-warning/5 text-status-warning'
                        : 'border-status-info/20 bg-status-info/5 text-status-info'
                  }`}
                >
                  <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                  <span>{a.message}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-status-warning" />
            <h3 className="text-base font-semibold text-foreground">Sugerencias</h3>
          </div>
          <div className="space-y-2">
            {kpis.sugerencias.map((s, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-xs text-muted-foreground"
              >
                <Zap className="mt-0.5 h-3 w-3 shrink-0 text-status-warning" />
                <span>{s}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Row 6: Pending/Future features ── */}
      <Card className="border-dashed border-border/50">
        <div className="mb-3 flex items-center gap-2">
          <Construction className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-muted-foreground">En Construcción</h3>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            'Predicción de saturación de parqueo',
            'Tendencias históricas por ciclo',
            'Optimización automática de horarios',
            'Heatmap de uso de aulas por hora',
            'Tasa de deserción interanual',
            'Costo por estudiante por carrera',
            'Simulación de escenarios "what-if"',
            'Alertas inteligentes con ML',
          ].map((f) => (
            <div key={f} className="rounded-lg border border-dashed border-border/40 px-3 py-2 text-[11px] text-muted-foreground/60">
              {f}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ── Expandable Card ──

function ExpandableCard({
  title,
  subtitle,
  icon: Icon,
  children,
  expandedContent,
  className = '',
}: {
  title: string
  subtitle: string
  icon: typeof Users
  children: ReactNode
  expandedContent?: ReactNode
  className?: string
}) {
  const [expanded, setExpanded] = useState(false)
  const panelId = useId()
  return (
    <Card className={`transition-all duration-200 hover:border-status-warning/20 hover:shadow-lg hover:shadow-status-warning/5 ${className}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls={expandedContent ? panelId : undefined}
        className="mb-3 flex w-full items-center justify-between text-left"
      >
        <div>
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-status-warning" />
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
        {expandedContent && (
          expanded
            ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
            : <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {children}
      {expanded && expandedContent ? <div id={panelId}>{expandedContent}</div> : null}
    </Card>
  )
}

// ── KPI Card ──

function KpiCard({
  label,
  value,
  icon: Icon,
  accent,
  trend,
  subtitle,
}: {
  label: string
  value: string
  icon: typeof Users
  accent: 'success' | 'warning' | 'critical' | 'info'
  trend?: 'up' | 'down'
  subtitle?: string
}) {
  const accentMap = {
    warning: 'bg-status-warning/10 text-status-warning',
    info: 'bg-status-info/10 text-status-info',
    success: 'bg-status-success/10 text-status-success',
    critical: 'bg-status-critical/10 text-status-critical',
  }
  return (
    <Card className="transition-all duration-200 hover:border-status-warning/20 hover:shadow-lg hover:shadow-status-warning/5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
              {trend === 'up' && <ArrowUpRight className="h-3 w-3 text-status-success" />}
              {trend === 'down' && <ArrowDownRight className="h-3 w-3 text-status-critical" />}
              {subtitle}
            </p>
          )}
        </div>
        <div className={`rounded-lg p-2.5 ${accentMap[accent]}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  )
}

// ── Finance Bar ──

function FinanceBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-foreground">{label}</span>
        <span className="font-mono text-muted-foreground">${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  )
}

// ── Compute all KPIs ──

type Alert = { severity: 'critical' | 'warning' | 'info'; message: string }

type CarreraStat = {
  id: string
  nombre: string
  activos: number
  graduados: number
  atrasados: number
  ingreso: number
  conVehiculo: number
}

type MateriaDemand = {
  id: string
  codigo: string
  nombre: string
  ciclo: number
  demand: number
  suggestedSections: number
}

function computeKpis(
  estudiantes: Estudiante[],
  materias: Materia[],
  profesores: Profesor[],
  aulas: Aula[],
  carreras: Carrera[]
) {
  // ── Basic counts ──
  const totalEstudiantes = estudiantes.length
  const estudiantesActivos = estudiantes.filter((e) => e.estado === 'ACTIVO').length
  const graduados = estudiantes.filter((e) => e.estado === 'GRADUADO').length

  // ── Retention: active / (total - graduated) ──
  const nonGraduated = totalEstudiantes - graduados
  const retencion = nonGraduated > 0 ? (estudiantesActivos / nonGraduated) * 100 : 100

  // ── Delay rate: students behind on their materias ──
  const activeStudents = estudiantes.filter((e) => e.estado === 'ACTIVO')
  let estudiantesAtrasados = 0

  for (const est of activeStudents) {
    const carreraMaterias = materias.filter(
      (m) => m.carreraId === est.carreraId && m.activa && (m.ciclo ?? 1) < est.cicloActual
    )
    if (carreraMaterias.length === 0) continue
    const approved = new Set((est.materiasAprobadas ?? []).map((a) => a.materiaId))
    const pending = carreraMaterias.filter((m) => !approved.has(m.id))
    if (pending.length > 0) estudiantesAtrasados++
  }

  const tasaAtraso = estudiantesActivos > 0 ? (estudiantesAtrasados / estudiantesActivos) * 100 : 0

  // ── Financial ──
  const ingresoEstudiantes = activeStudents.reduce((s, e) => s + (Number(e.mensualidad) || 0), 0)
  const activeAulas = aulas.filter((a) => a.activa)
  const costoAulas = activeAulas.reduce((s, a) => s + (Number(a.costoMensual) || 0), 0)

  // Professor cost estimate (monthly): hourly * maxHorasSemana * 4.33 weeks, or fixed for full/half
  const costoDocente = profesores.reduce((s, p) => {
    const monthlyCost = p.costoMensual ?? ((p.costoHora ?? 0) * (p.maxHorasSemana ?? 0) * 4.33)
    return s + monthlyCost
  }, 0)

  const balanceMensual = ingresoEstudiantes - costoAulas - costoDocente

  // ── Carrera stats ──
  const carreraStats: CarreraStat[] = carreras
    .map((c) => {
      const cStudents = estudiantes.filter((e) => e.carreraId === c.id)
      const cActive = cStudents.filter((e) => e.estado === 'ACTIVO')
      const cMaterias = materias.filter((m) => m.carreraId === c.id && m.activa)

      let atrasados = 0
      for (const est of cActive) {
        const approved = new Set((est.materiasAprobadas ?? []).map((a) => a.materiaId))
        const pending = cMaterias.filter((m) => (m.ciclo ?? 1) < est.cicloActual && !approved.has(m.id))
        if (pending.length > 0) atrasados++
      }

      return {
        id: c.id,
        nombre: c.nombre,
        activos: cActive.length,
        graduados: cStudents.filter((e) => e.estado === 'GRADUADO').length,
        atrasados,
        ingreso: cActive.reduce((s, e) => s + (Number(e.mensualidad) || 0), 0),
        conVehiculo: cActive.filter((e) => e.tieneVehiculo).length,
      }
    })
    .sort((a, b) => b.activos - a.activos)

  // ── Ciclo distribution ──
  const cicloMap = new Map<number, { count: number; atrasados: number; ingreso: number }>()
  for (const est of activeStudents) {
    const entry = cicloMap.get(est.cicloActual) ?? { count: 0, atrasados: 0, ingreso: 0 }
    entry.count++
    entry.ingreso += Number(est.mensualidad) || 0

    const approved = new Set((est.materiasAprobadas ?? []).map((a) => a.materiaId))
    const carreraMaterias = materias.filter(
      (m) => m.carreraId === est.carreraId && m.activa && (m.ciclo ?? 1) < est.cicloActual
    )
    if (carreraMaterias.some((m) => !approved.has(m.id))) entry.atrasados++

    cicloMap.set(est.cicloActual, entry)
  }
  const cicloDistribution = Array.from(cicloMap.entries())
    .map(([ciclo, data]) => ({ ciclo, ...data }))
    .sort((a, b) => a.ciclo - b.ciclo)

  // ── Aula stats ──
  const tipoLabels: Record<string, string> = {
    TEORIA: 'Teoría',
    LABORATORIO_COMPUTO: 'Lab. Cómputo',
    LABORATORIO_CIENCIAS: 'Lab. Ciencias',
    AUDITORIO: 'Auditorio',
  }
  const tipoCount = new Map<string, { count: number; capacidad: number }>()
  for (const a of aulas) {
    const entry = tipoCount.get(a.tipo) ?? { count: 0, capacidad: 0 }
    entry.count++
    entry.capacidad += a.capacidad
    tipoCount.set(a.tipo, entry)
  }
  const aulaStats = Array.from(tipoCount.entries())
    .map(([tipo, data]) => ({ tipo, label: tipoLabels[tipo] ?? tipo, ...data }))
    .sort((a, b) => b.count - a.count)

  const avgCapacity = activeAulas.length > 0
    ? Math.round(activeAulas.reduce((s, a) => s + a.capacidad, 0) / activeAulas.length)
    : 30

  // ── Professor stats ──
  const contratoLabels: Record<string, string> = {
    TIEMPO_COMPLETO: 'Tiempo completo',
    MEDIO_TIEMPO: 'Medio tiempo',
    POR_HORA: 'Por hora',
  }
  const contratoCount = new Map<string, number>()
  for (const p of profesores) {
    contratoCount.set(p.tipoContrato, (contratoCount.get(p.tipoContrato) ?? 0) + 1)
  }
  const profesorStats = Array.from(contratoCount.entries())
    .map(([tipo, count]) => ({ tipo, label: contratoLabels[tipo] ?? tipo, count }))
    .sort((a, b) => b.count - a.count)

  const totalHorasClaseCapacidad = profesores.reduce((s, p) => s + p.maxHorasSemana, 0)

  // ── Transport ──
  const conVehiculo = activeStudents.filter((e) => e.tieneVehiculo).length
  const pctVehiculo = estudiantesActivos > 0 ? (conVehiculo / estudiantesActivos) * 100 : 0

  // ── Materia demand (same logic as demand calculator) ──
  const activeMaterias = materias.filter((m) => m.activa)
  const materiaDemand: MateriaDemand[] = activeMaterias
    .map((m) => {
      const demand = activeStudents.filter((e) => {
        if (e.cicloActual < (m.ciclo ?? 1)) return false
        if (e.carreraId !== m.carreraId) return false
        const approved = (e.materiasAprobadas ?? []).map((a) => a.materiaId)
        if (approved.includes(m.id)) return false
        const prereqs = m.prerequisitos ?? []
        if (prereqs.length > 0 && !prereqs.every((p) => approved.includes(p.id))) return false
        return true
      }).length
      return {
        id: m.id,
        codigo: m.codigo,
        nombre: m.nombre,
        ciclo: m.ciclo ?? 1,
        demand,
        suggestedSections: demand > 0 ? Math.ceil(demand / avgCapacity) : 0,
      }
    })
    .sort((a, b) => b.demand - a.demand)

  const materiasSaturadas = materiaDemand.filter((m) => m.demand > avgCapacity).length

  // ── Alerts ──
  const alertas: Alert[] = []

  if (tasaAtraso > 25) {
    alertas.push({ severity: 'critical', message: `${estudiantesAtrasados} estudiantes (${tasaAtraso.toFixed(0)}%) están atrasados con materias de ciclos anteriores.` })
  } else if (tasaAtraso > 10) {
    alertas.push({ severity: 'warning', message: `${estudiantesAtrasados} estudiantes (${tasaAtraso.toFixed(0)}%) tienen materias pendientes de ciclos anteriores.` })
  }

  if (materiasSaturadas > 0) {
    alertas.push({ severity: 'warning', message: `${materiasSaturadas} materias tienen demanda superior a la capacidad promedio de aulas (${avgCapacity}).` })
  }

  if (balanceMensual < 0) {
    alertas.push({ severity: 'critical', message: `El balance mensual es negativo: -$${Math.abs(balanceMensual).toFixed(0)}. Los costos superan los ingresos.` })
  }

  const overloadedProfs = profesores.filter((p) => {
    const workBlocks = (p.disponibilidad ?? []).filter((d) => !d.esBloqueo)
    const workHrs = workBlocks.reduce((s, d) => {
      return s + parseTimeToHours(d.horaFin) - parseTimeToHours(d.horaInicio)
    }, 0)
    return workHrs > p.maxHorasSemana
  })
  if (overloadedProfs.length > 0) {
    alertas.push({ severity: 'warning', message: `${overloadedProfs.length} profesores tienen horario laboral que excede su máximo semanal.` })
  }

  if (pctVehiculo > 60) {
    alertas.push({ severity: 'info', message: `${pctVehiculo.toFixed(0)}% de estudiantes activos tienen vehículo. Verificar capacidad de parqueo.` })
  }

  // ── Suggestions ──
  const sugerencias: string[] = []

  if (materiasSaturadas > 3) {
    sugerencias.push(`Abrir secciones adicionales para las ${materiasSaturadas} materias saturadas reduciría el embudo de inscripción.`)
  }

  if (estudiantesAtrasados > 0) {
    sugerencias.push(`Ofrecer materias de ciclos anteriores en horarios accesibles ayudaría a ${estudiantesAtrasados} estudiantes a regularizar su avance.`)
  }

  const noSubjectProfs = profesores.filter((p) => (p.materias ?? []).length === 0)
  if (noSubjectProfs.length > 0) {
    sugerencias.push(`${noSubjectProfs.length} profesores no tienen materias asignadas. Asignar competencias mejora la planificación de secciones.`)
  }

  const noScheduleProfs = profesores.filter((p) => (p.disponibilidad ?? []).length === 0)
  if (noScheduleProfs.length > 0) {
    sugerencias.push(`${noScheduleProfs.length} profesores no tienen horario laboral definido. Completar disponibilidad permite optimizar el calendarizado.`)
  }

  if (costoDocente > ingresoEstudiantes * 0.7) {
    sugerencias.push(`El costo docente representa más del 70% del ingreso. Evaluar proporción de profesores por hora vs tiempo completo.`)
  }

  if (sugerencias.length === 0) {
    sugerencias.push('Los indicadores actuales están dentro de rangos aceptables. Continuar monitoreando.')
  }

  return {
    totalEstudiantes,
    estudiantesActivos,
    graduados,
    retencion,
    estudiantesAtrasados,
    tasaAtraso,
    ingresoEstudiantes,
    costoAulas,
    costoDocente,
    balanceMensual,
    carreraStats,
    cicloDistribution,
    aulaStats,
    avgCapacity,
    profesorStats,
    totalHorasClaseCapacidad,
    conVehiculo,
    pctVehiculo,
    materiaDemand,
    materiasSaturadas,
    alertas,
    sugerencias,
  }
}
