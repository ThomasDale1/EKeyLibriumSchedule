import { cn } from '@/lib/utils'
import type { ComponentType, ReactNode } from 'react'

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Card({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card p-5 shadow-[0_1px_0_rgba(255,255,255,0.02)]',
        className
      )}
    >
      {children}
    </div>
  )
}

export function StatCard({
  label,
  value,
  delta,
  trend = 'up',
  icon: Icon,
  accent = 'warning',
}: {
  label: string
  value: string
  delta?: string
  trend?: 'up' | 'down'
  icon: ComponentType<{ className?: string }>
  accent?: 'warning' | 'info' | 'success' | 'critical'
}) {
  const accentMap = {
    warning: 'bg-status-warning/10 text-status-warning',
    info: 'bg-status-info/10 text-status-info',
    success: 'bg-status-success/10 text-status-success',
    critical: 'bg-status-critical/10 text-status-critical',
  }
  return (
    <Card className="flex items-start justify-between gap-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
        {delta && (
          <p
            className={cn(
              'mt-1 text-xs font-medium',
              trend === 'up' ? 'text-status-success' : 'text-status-critical'
            )}
          >
            {trend === 'up' ? '↗' : '↘'} {delta}
          </p>
        )}
      </div>
      <div className={cn('rounded-lg p-2.5', accentMap[accent])}>
        <Icon className="h-5 w-5" />
      </div>
    </Card>
  )
}

export function Badge({
  children,
  variant = 'muted',
}: {
  children: ReactNode
  variant?: 'success' | 'warning' | 'critical' | 'info' | 'muted'
}) {
  const map = {
    success: 'bg-status-success/15 text-status-success border-status-success/20',
    warning: 'bg-status-warning/15 text-status-warning border-status-warning/20',
    critical: 'bg-status-critical/15 text-status-critical border-status-critical/20',
    info: 'bg-status-info/15 text-status-info border-status-info/20',
    muted: 'bg-muted text-muted-foreground border-border',
  }
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium',
        map[variant]
      )}
    >
      {children}
    </span>
  )
}

export function ProgressBar({
  value,
  accent = 'warning',
}: {
  value: number
  accent?: 'warning' | 'info' | 'success' | 'critical'
}) {
  const map = {
    warning: 'bg-status-warning',
    info: 'bg-status-info',
    success: 'bg-status-success',
    critical: 'bg-status-critical',
  }
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div
        className={cn('h-full rounded-full transition-all', map[accent])}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

export function DataTable<T>({
  columns,
  rows,
  empty = 'Sin datos',
}: {
  columns: { key: keyof T | string; label: string; render?: (row: T) => ReactNode; className?: string }[]
  rows: T[]
  empty?: string
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            {columns.map((c) => (
              <th key={String(c.key)} className={cn('px-5 py-3 font-medium', c.className)}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-5 py-10 text-center text-muted-foreground">
                {empty}
              </td>
            </tr>
          )}
          {rows.map((row, i) => (
            <tr
              key={i}
              className="border-b border-border/60 last:border-0 transition-colors hover:bg-muted/30"
            >
              {columns.map((c) => (
                <td key={String(c.key)} className={cn('px-5 py-3.5 text-foreground', c.className)}>
                  {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key as string] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
