import { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  Ghost,
  Info,
  Play,
  Shield,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GhostSuggestion } from '../types'
import type { ValidationItem, ValidationSeverity } from '../validation'

type Props = {
  items: ValidationItem[]
  ghostSuggestions: GhostSuggestion[]
  activeSuggestionId: string | null
  onActivateSuggestion: (id: string | null) => void
  onApplySuggestion: (id: string) => void
  onNavigateBlock: (blockId: string) => void
  hasBlocks: boolean
}

export function AlertasPanel({
  items,
  ghostSuggestions,
  activeSuggestionId,
  onActivateSuggestion,
  onApplySuggestion,
  onNavigateBlock,
  hasBlocks,
}: Props) {
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null)

  const counts = { critical: 0, high: 0, medium: 0, low: 0 }
  for (const i of items) counts[i.severity]++

  if (!hasBlocks) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <Info className="mb-3 h-6 w-6 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">Sin bloques</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Arrastra materias al calendario para empezar
        </p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-status-success/5 p-6 text-center">
        <CheckCircle2 className="mb-3 h-6 w-6 text-status-success" />
        <p className="text-sm font-medium text-foreground">Todo en orden</p>
        <p className="mt-1 text-xs text-muted-foreground">
          No se encontraron problemas en el horario actual
        </p>
      </div>
    )
  }

  const suggestionByCategory = new Map<string, GhostSuggestion[]>()
  for (const s of ghostSuggestions) {
    const arr = suggestionByCategory.get(s.category) ?? []
    arr.push(s)
    suggestionByCategory.set(s.category, arr)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="border-b border-border p-3">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-status-warning" />
          <h3 className="text-sm font-semibold text-foreground">Validación</h3>
          {ghostSuggestions.length > 0 && (
            <span className="ml-auto flex items-center gap-1 rounded-md border border-[#8b5cf6]/30 bg-[#8b5cf6]/10 px-2 py-0.5 text-[10px] font-semibold text-[#a78bfa]">
              <Ghost className="h-3 w-3" />
              {ghostSuggestions.length} sugerencia(s)
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {counts.critical > 0 && <SevBadge severity="critical" count={counts.critical} />}
          {counts.high > 0 && <SevBadge severity="high" count={counts.high} />}
          {counts.medium > 0 && <SevBadge severity="medium" count={counts.medium} />}
          {counts.low > 0 && <SevBadge severity="low" count={counts.low} />}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <div className="space-y-1.5">
          {items.map((item, i) => {
            const matchingSuggestions = ghostSuggestions.filter((s) => s.category === item.category)
            return (
              <AlertItemWithGhost
                key={i}
                item={item}
                suggestions={matchingSuggestions}
                expandedSuggestion={expandedSuggestion}
                activeSuggestionId={activeSuggestionId}
                onToggleExpand={(id) => setExpandedSuggestion(expandedSuggestion === id ? null : id)}
                onActivateSuggestion={onActivateSuggestion}
                onApplySuggestion={onApplySuggestion}
                onNavigateBlock={onNavigateBlock}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

const SEV_STYLES: Record<ValidationSeverity, { bg: string; text: string; icon: typeof AlertTriangle; label: string }> = {
  critical: { bg: 'bg-status-critical/10 border-status-critical/30', text: 'text-status-critical', icon: AlertTriangle, label: 'Crítico' },
  high: { bg: 'bg-orange-500/10 border-orange-500/30', text: 'text-orange-400', icon: AlertTriangle, label: 'Alto' },
  medium: { bg: 'bg-status-warning/10 border-status-warning/30', text: 'text-status-warning', icon: Clock, label: 'Medio' },
  low: { bg: 'bg-status-info/10 border-status-info/30', text: 'text-status-info', icon: Zap, label: 'Bajo' },
}

function SevBadge({ severity, count }: { severity: ValidationSeverity; count: number }) {
  const s = SEV_STYLES[severity]
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold', s.bg, s.text)}>
      {count} {s.label}
    </span>
  )
}

function AlertItemWithGhost({
  item,
  suggestions,
  expandedSuggestion,
  activeSuggestionId,
  onToggleExpand,
  onActivateSuggestion,
  onApplySuggestion,
  onNavigateBlock,
}: {
  item: ValidationItem
  suggestions: GhostSuggestion[]
  expandedSuggestion: string | null
  activeSuggestionId: string | null
  onToggleExpand: (id: string) => void
  onActivateSuggestion: (id: string | null) => void
  onApplySuggestion: (id: string) => void
  onNavigateBlock: (blockId: string) => void
}) {
  const s = SEV_STYLES[item.severity]
  const Icon = s.icon
  const hasNav = (item.blockIds?.length ?? 0) > 0

  return (
    <div className="space-y-1">
      <button
        onClick={hasNav ? () => onNavigateBlock(item.blockIds![0]) : undefined}
        className={cn(
          'flex w-full items-start gap-2 rounded-lg border p-2.5 text-left transition-colors',
          s.bg,
          hasNav && 'cursor-pointer hover:brightness-110',
          !hasNav && 'cursor-default',
        )}
      >
        <Icon className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', s.text)} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className={cn('text-[9px] font-semibold uppercase tracking-wider', s.text)}>
              {item.category}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] font-medium text-foreground">{item.message}</p>
          <p className="mt-0.5 text-[10px] text-muted-foreground">{item.detail}</p>
          {item.action && (
            <p className="mt-1 flex items-center gap-1 text-[10px] font-medium text-status-warning">
              <Zap className="h-2.5 w-2.5" />
              {item.action}
            </p>
          )}
        </div>
        {hasNav && <ChevronRight className="mt-1 h-3 w-3 shrink-0 text-muted-foreground" />}
      </button>

      {suggestions.map((suggestion) => (
        <GhostSuggestionCard
          key={suggestion.id}
          suggestion={suggestion}
          isExpanded={expandedSuggestion === suggestion.id}
          isActive={activeSuggestionId === suggestion.id}
          onToggleExpand={() => onToggleExpand(suggestion.id)}
          onTogglePreview={() =>
            onActivateSuggestion(activeSuggestionId === suggestion.id ? null : suggestion.id)
          }
          onApply={() => onApplySuggestion(suggestion.id)}
        />
      ))}
    </div>
  )
}

function GhostSuggestionCard({
  suggestion,
  isExpanded,
  isActive,
  onToggleExpand,
  onTogglePreview,
  onApply,
}: {
  suggestion: GhostSuggestion
  isExpanded: boolean
  isActive: boolean
  onToggleExpand: () => void
  onTogglePreview: () => void
  onApply: () => void
}) {
  return (
    <div
      className={cn(
        'rounded-lg border transition-colors',
        isActive
          ? 'border-[#8b5cf6]/50 bg-[#8b5cf6]/5'
          : 'border-border/50 bg-card/50 hover:border-[#8b5cf6]/30',
      )}
    >
      <button
        onClick={onToggleExpand}
        className="flex w-full items-center gap-2 p-2 text-left"
      >
        <Ghost className={cn('h-3.5 w-3.5 shrink-0', isActive ? 'text-[#a78bfa]' : 'text-muted-foreground')} />
        <div className="min-w-0 flex-1">
          <p className={cn('text-[11px] font-semibold', isActive ? 'text-[#a78bfa]' : 'text-foreground')}>
            {suggestion.title}
          </p>
          <p className="text-[10px] text-muted-foreground">{suggestion.description}</p>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-border/30 px-2 pb-2">
          <div className="mt-2 space-y-2">
            {suggestion.steps.map((step) => (
              <div key={step.order} className="flex gap-2">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#8b5cf6]/20 text-[9px] font-bold text-[#a78bfa]">
                  {step.order}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-medium text-foreground">{step.instruction}</p>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">{step.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 flex gap-1.5">
            <button
              onClick={onTogglePreview}
              className={cn(
                'flex flex-1 items-center justify-center gap-1 rounded-md border px-2 py-1.5 text-[10px] font-semibold transition-colors',
                isActive
                  ? 'border-[#8b5cf6]/50 bg-[#8b5cf6]/20 text-[#a78bfa]'
                  : 'border-border bg-card text-muted-foreground hover:border-[#8b5cf6]/30 hover:text-foreground',
              )}
            >
              {isActive ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {isActive ? 'Ocultar fantasma' : 'Ver fantasma'}
            </button>
            <button
              onClick={onApply}
              className="flex flex-1 items-center justify-center gap-1 rounded-md border border-status-success/50 bg-status-success/10 px-2 py-1.5 text-[10px] font-semibold text-status-success transition-colors hover:bg-status-success/20"
            >
              <Play className="h-3 w-3" />
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
