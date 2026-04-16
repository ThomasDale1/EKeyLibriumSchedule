import { useMemo, useState } from 'react'
import { Sparkles, X, Users, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useScheduleStore, useActiveSchedule } from '../store'
import { COLOR_STYLES } from '../colors'
import { generateAutoSectionBlocks, planAutoSections, type AutoSectionInput } from '../autoSection'
import type { Subject } from '../types'

type Props = {
  open: boolean
  onClose: () => void
}

export function AutoSectionsDialog({ open, onClose }: Props) {
  const subjects = useScheduleStore((s) => s.subjects)
  const rooms = useScheduleStore((s) => s.rooms)
  const active = useActiveSchedule()
  const addBlocksRaw = useScheduleStore((s) => s.addBlocksRaw)

  const [demand, setDemand] = useState<Record<string, number>>({})

  const inputs: AutoSectionInput[] = useMemo(
    () =>
      subjects.map((s) => ({
        subjectId: s.id,
        demand: demand[s.id] ?? 0,
      })),
    [subjects, demand]
  )

  const plan = useMemo(() => planAutoSections(inputs, subjects, rooms, active.blocks), [inputs, subjects, rooms, active.blocks])

  const totalNewSections = plan.reduce((sum, p) => sum + p.sectionCount, 0)
  const totalStudents = plan.reduce((sum, p) => sum + p.sectionCount * p.perSection, 0)

  function generate() {
    const newBlocks = generateAutoSectionBlocks(plan, active.blocks)
    if (newBlocks.length === 0) {
      onClose()
      return
    }
    addBlocksRaw(newBlocks)
    setDemand({})
    onClose()
  }

  function setAll(value: number) {
    const next: Record<string, number> = {}
    for (const s of subjects) next[s.id] = value
    setDemand(next)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl overflow-hidden rounded-xl border border-border bg-card shadow-dark-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-status-warning/10 p-1.5">
              <Sparkles className="h-4 w-4 text-status-warning" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground">Auto-secciones por demanda</h3>
              <p className="text-[11px] text-muted-foreground">
                Calcula cuántas secciones crear según demanda esperada y capacidad de aula
              </p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Cerrar">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 border-b border-border bg-muted/20 px-5 py-2.5">
          <Info className="h-3 w-3 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">Atajos:</span>
          <button onClick={() => setAll(30)} className="rounded-md border border-border bg-card px-2 py-0.5 text-[11px] hover:bg-muted">30</button>
          <button onClick={() => setAll(50)} className="rounded-md border border-border bg-card px-2 py-0.5 text-[11px] hover:bg-muted">50</button>
          <button onClick={() => setAll(80)} className="rounded-md border border-border bg-card px-2 py-0.5 text-[11px] hover:bg-muted">80</button>
          <button onClick={() => setAll(0)} className="rounded-md border border-border bg-card px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted">Limpiar</button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-border text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-2 font-medium">Materia</th>
                <th className="px-3 py-2 text-right font-medium">Demanda</th>
                <th className="px-3 py-2 text-center font-medium">Secciones</th>
                <th className="px-3 py-2 text-center font-medium">Por sección</th>
                <th className="px-5 py-2 font-medium">Notas</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map((s) => {
                const planItem = plan.find((p) => p.subjectId === s.id)
                return (
                  <SubjectRow
                    key={s.id}
                    subject={s}
                    demand={demand[s.id] ?? 0}
                    onDemandChange={(v) => setDemand((prev) => ({ ...prev, [s.id]: v }))}
                    sectionCount={planItem?.sectionCount ?? 0}
                    perSection={planItem?.perSection ?? 0}
                    reason={planItem?.reason ?? ''}
                  />
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/20 px-5 py-3">
          <div className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{totalNewSections}</span> nueva(s) sección(es) ·{' '}
            <span className="font-semibold text-foreground">{totalStudents}</span> estudiante(s) total
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-md border border-border bg-card px-4 py-1.5 text-xs font-medium hover:bg-muted"
            >
              Cancelar
            </button>
            <button
              onClick={generate}
              disabled={totalNewSections === 0}
              className="flex items-center gap-1.5 rounded-md bg-status-warning px-4 py-1.5 text-xs font-semibold text-white transition-opacity hover:bg-status-warning/90 disabled:opacity-50"
            >
              <Sparkles className="h-3 w-3" />
              Generar {totalNewSections} bloque(s)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function SubjectRow({
  subject,
  demand,
  onDemandChange,
  sectionCount,
  perSection,
  reason,
}: {
  subject: Subject
  demand: number
  onDemandChange: (v: number) => void
  sectionCount: number
  perSection: number
  reason: string
}) {
  const color = COLOR_STYLES[subject.color]
  return (
    <tr className="border-b border-border/40 transition-colors hover:bg-muted/20">
      <td className="px-5 py-2">
        <div className="flex items-center gap-2">
          <span className={cn('h-2 w-2 rounded-full', color.solid)} />
          <div className="min-w-0">
            <span className={cn('font-mono text-[10px] font-semibold', color.text)}>{subject.codigo}</span>
            <p className="truncate text-[11px] text-foreground">{subject.nombre}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-2 text-right">
        <input
          type="number"
          min={0}
          value={demand || ''}
          onChange={(e) => onDemandChange(Math.max(0, parseInt(e.target.value) || 0))}
          placeholder="0"
          className="h-7 w-16 rounded-md border border-border bg-background px-1.5 text-right text-xs focus:border-status-warning/50 focus:outline-none"
        />
      </td>
      <td className="px-3 py-2 text-center">
        {sectionCount > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-status-warning/15 px-2 py-0.5 text-[11px] font-semibold text-status-warning">
            ×{sectionCount}
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-3 py-2 text-center">
        {perSection > 0 ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-foreground">
            <Users className="h-2.5 w-2.5 text-muted-foreground" />
            {perSection}
          </span>
        ) : (
          <span className="text-[11px] text-muted-foreground">—</span>
        )}
      </td>
      <td className="px-5 py-2 text-[10px] text-muted-foreground">{reason}</td>
    </tr>
  )
}
