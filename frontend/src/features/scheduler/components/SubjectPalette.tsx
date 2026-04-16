import { useMemo, useState } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Search, BookOpen, Sparkles, GripVertical } from 'lucide-react'
import { cn } from '@/lib/utils'
import { COLOR_STYLES } from '../colors'
import type { PaletteDragData, Subject } from '../types'

type Props = {
  subjects: Subject[]
  cicloFilter: number | null
  onCicloFilterChange: (ciclo: number | null) => void
  sectionCounts: Map<string, number>
}

export function SubjectPalette({ subjects, cicloFilter, onCicloFilterChange, sectionCounts }: Props) {
  const [search, setSearch] = useState('')

  const ciclos = useMemo(() => {
    return Array.from(new Set(subjects.map((s) => s.ciclo))).sort((a, b) => a - b)
  }, [subjects])

  const filtered = useMemo(() => {
    let list = subjects
    if (cicloFilter != null) list = list.filter((s) => s.ciclo === cicloFilter)
    const q = search.trim().toLowerCase()
    if (q) list = list.filter((s) => s.codigo.toLowerCase().includes(q) || s.nombre.toLowerCase().includes(q))
    return list
  }, [subjects, cicloFilter, search])

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card">
      <div className="border-b border-border p-3">
        <div className="mb-2 flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-status-warning" />
          <h3 className="text-sm font-semibold text-foreground">Materias</h3>
          <span className="ml-auto text-[10px] text-muted-foreground">{filtered.length}</span>
        </div>

        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <label htmlFor="subject-search" className="sr-only">Buscar asignaturas</label>
          <input
            id="subject-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar..."
            aria-label="Buscar asignaturas"
            className="h-8 w-full rounded-md border border-border bg-background pl-8 pr-2 text-xs focus:border-status-warning/50 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-1">
          <FilterChip active={cicloFilter == null} onClick={() => onCicloFilterChange(null)}>
            Todos
          </FilterChip>
          {ciclos.map((c) => (
            <FilterChip key={c} active={cicloFilter === c} onClick={() => onCicloFilterChange(c)}>
              Ciclo {c}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Sparkles className="mb-2 h-6 w-6 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">No hay materias que coincidan</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {filtered.map((s) => (
              <PaletteItem key={s.id} subject={s} sections={sectionCounts.get(s.id) ?? 0} />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border bg-muted/20 px-3 py-2 text-[10px] text-muted-foreground">
        Arrastra al grid para crear bloques
      </div>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors',
        active
          ? 'bg-status-warning text-white'
          : 'bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground'
      )}
    >
      {children}
    </button>
  )
}

function PaletteItem({ subject, sections }: { subject: Subject; sections: number }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${subject.id}`,
    data: { type: 'palette', subjectId: subject.id } satisfies PaletteDragData,
  })
  const color = COLOR_STYLES[subject.color] ?? { bg: 'bg-muted/50', border: 'border-muted', text: 'text-muted-foreground' }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), zIndex: isDragging ? 50 : undefined }}
      {...attributes}
      {...listeners}
      className={cn(
        'group flex cursor-grab items-center gap-2 rounded-md border p-2 transition-all select-none',
        color.bg,
        color.border,
        isDragging ? 'cursor-grabbing opacity-80 shadow-dark-xl' : 'hover:shadow-dark-lg hover:-translate-y-px'
      )}
    >
      <GripVertical className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className={cn('font-mono text-[10px] font-semibold', color.text)}>{subject.codigo}</span>
          <span className="text-[9px] text-muted-foreground">C{subject.ciclo}</span>
          {sections > 0 && (
            <span className="ml-auto rounded bg-muted px-1 py-0.5 font-mono text-[9px] text-muted-foreground">
              ×{sections}
            </span>
          )}
        </div>
        <p className="mt-0.5 truncate text-[11px] font-medium text-foreground">{subject.nombre}</p>
        <p className="text-[9px] text-muted-foreground">
          {subject.horasSemanales}h sem · {subject.creditos} cr
        </p>
      </div>
    </div>
  )
}
