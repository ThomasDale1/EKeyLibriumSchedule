import { ArrowRight, MapPin, Plus, Trash2, UserPlus, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SLOT_HEIGHT_PX, slotToTime } from '../constants'
import { COLOR_STYLES } from '../colors'
import type { GhostAction, GhostBlock, Subject } from '../types'

const ACTION_CONFIG: Record<GhostAction, { label: string; icon: typeof Plus; border: string; bg: string; text: string }> = {
  add: { label: 'AGREGAR', icon: Plus, border: 'border-status-success/70', bg: 'bg-status-success/10', text: 'text-status-success' },
  move: { label: 'MOVER AQUÍ', icon: ArrowRight, border: 'border-status-warning/70', bg: 'bg-status-warning/10', text: 'text-status-warning' },
  remove: { label: 'ELIMINAR', icon: Trash2, border: 'border-status-critical/70', bg: 'bg-status-critical/10', text: 'text-status-critical' },
  resize: { label: 'REDIMENSIONAR', icon: Maximize2, border: 'border-status-info/70', bg: 'bg-status-info/10', text: 'text-status-info' },
  'reassign-professor': { label: 'NUEVO PROF.', icon: UserPlus, border: 'border-[#8b5cf6]/70', bg: 'bg-[#8b5cf6]/10', text: 'text-[#a78bfa]' },
  'reassign-room': { label: 'NUEVA AULA', icon: MapPin, border: 'border-[#14b8a6]/70', bg: 'bg-[#14b8a6]/10', text: 'text-[#2dd4bf]' },
}

type Props = {
  block: GhostBlock
  subject: Subject
}

export function GhostBlockOverlay({ block, subject }: Props) {
  const colorStyle = COLOR_STYLES[subject.color]
  const config = ACTION_CONFIG[block.action]
  const Icon = config.icon
  const height = block.duration * SLOT_HEIGHT_PX - 4

  return (
    <div
      style={{
        top: block.startSlot * SLOT_HEIGHT_PX + 2,
        height,
        zIndex: 25,
      }}
      className={cn(
        'absolute left-1 right-1 rounded-md border-2 border-dashed pointer-events-none',
        'animate-pulse',
        config.border,
        config.bg,
      )}
    >
      <div className="flex h-full flex-col justify-between p-1.5">
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            <Icon className={cn('h-2.5 w-2.5', config.text)} />
            <span className={cn('text-[8px] font-bold uppercase tracking-wider', config.text)}>
              {config.label}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className={cn('font-mono text-[10px] font-semibold', colorStyle.text)}>
              {subject.codigo}
            </span>
            <span className="text-[10px] text-muted-foreground">·{block.sectionLabel}</span>
          </div>
          {block.duration >= 2 && (
            <p className="mt-0.5 truncate text-[11px] font-medium text-foreground/60">{subject.nombre}</p>
          )}
        </div>
        {block.duration >= 2 && (
          <div className="text-[9px] text-muted-foreground/70">
            {slotToTime(block.startSlot)}–{slotToTime(block.startSlot + block.duration)}
          </div>
        )}
      </div>
    </div>
  )
}
