import { cn } from '@/lib/utils'
import type { ComponentType, ReactNode } from 'react'

// ── Skeleton (shimmer loading placeholder) ──

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-muted/60',
        className
      )}
    />
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border bg-card p-5', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-2 w-3/4" />
      </div>
    </div>
  )
}

export function SkeletonStatCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-5 flex items-start justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-16" />
      </div>
      <Skeleton className="h-10 w-10 rounded-lg" />
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border px-5 py-3 flex gap-6">
        {Array.from({ length: cols }, (_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="border-b border-border/40 px-5 py-3.5 flex gap-6 last:border-0">
          {Array.from({ length: cols }, (_, j) => (
            <Skeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

// ── Empty State ──

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: ComponentType<{ className?: string }>
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/50 py-16 text-center">
      <div className="mb-4 rounded-2xl bg-muted/40 p-4">
        <Icon className="h-8 w-8 text-muted-foreground/40" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-xs text-muted-foreground/60">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

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
  const boundedValue = Math.min(100, Math.max(0, value))
  return (
    <div 
      className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
      role="progressbar"
      aria-valuenow={Math.round(boundedValue)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Progress"
    >
      <div
        className={cn('h-full rounded-full transition-all', map[accent])}
        style={{ width: `${boundedValue}%` }}
      />
    </div>
  )
}

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  empty = 'Sin datos',
}: {
  columns: { key: keyof T | string; label: string; render?: (row: T) => ReactNode; className?: string }[]
  rows: T[]
  getRowKey?: (row: T, index: number) => string | number
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
          {rows.map((row, i) => {
            const rowKey = (getRowKey ? getRowKey(row, i) : (row as Record<string, unknown>).id) as
              | string
              | number
              | undefined
            if (rowKey == null) {
              console.warn('DataTable: No unique key found for row at index', i)
            }
            return (
              <tr
                key={rowKey ?? i}
                className="border-b border-border/60 last:border-0 transition-colors hover:bg-muted/30"
              >
                {columns.map((c) => (
                  <td key={String(c.key)} className={cn('px-5 py-3.5 text-foreground', c.className)}>
                    {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key as string] ?? '')}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
