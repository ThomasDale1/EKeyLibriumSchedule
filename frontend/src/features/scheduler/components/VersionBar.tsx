import { useState, useRef, useEffect } from 'react'
import { Check, Cloud, CloudOff, Copy, GitBranch, Loader2, MoreHorizontal, Pencil, Plus, Save, Trash2, Download, Calendar, FileJson, Sparkles, Printer } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useScheduleStore, useActiveSchedule } from '../store'
import { exportScheduleAsICS, exportScheduleAsJSON, downloadFile, sanitizeFilename } from '../export'
import type { SyncStatus } from '../useScheduleSync'

type Props = {
  onOpenAutoSections: () => void
  syncStatus: SyncStatus
  onSaveNow: () => void
  onDeletePlan: (id: string) => void
  lastSaved: number | null
}

export function VersionBar({ onOpenAutoSections, syncStatus, onSaveNow, onDeletePlan, lastSaved }: Props) {
  const schedules = useScheduleStore((s) => s.schedules)
  const activeScheduleId = useScheduleStore((s) => s.activeScheduleId)
  const setActiveSchedule = useScheduleStore((s) => s.setActiveSchedule)
  const createSchedule = useScheduleStore((s) => s.createSchedule)
  const renameSchedule = useScheduleStore((s) => s.renameSchedule)

  const subjects = useScheduleStore((s) => s.subjects)
  const professors = useScheduleStore((s) => s.professors)
  const rooms = useScheduleStore((s) => s.rooms)

  const active = useActiveSchedule()

  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [exportOpen, setExportOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null)
        setExportOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  function startRename(id: string, current: string) {
    setRenaming(id)
    setRenameValue(current)
    setMenuOpenId(null)
  }

  function commitRename() {
    if (renaming && renameValue.trim()) {
      renameSchedule(renaming, renameValue.trim())
    }
    setRenaming(null)
  }

  function exportJSON() {
    const content = exportScheduleAsJSON(active, subjects, professors, rooms)
    downloadFile(`horario_${sanitizeFilename(active.name)}.json`, content, 'application/json')
    setExportOpen(false)
  }
  function exportICS() {
    const content = exportScheduleAsICS(active, subjects, professors, rooms)
    downloadFile(`horario_${sanitizeFilename(active.name)}.ics`, content, 'text/calendar')
    setExportOpen(false)
  }
  function printSchedule() {
    window.print()
    setExportOpen(false)
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card/50 p-2" ref={menuRef}>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <GitBranch className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Versión:</span>
      </div>

      <div className="flex flex-wrap items-center gap-1">
        {schedules.map((s) => {
          const isActive = s.id === activeScheduleId
          const isRenamingThis = renaming === s.id

          return (
            <div key={s.id} className="relative">
              {isRenamingThis ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitRename()
                    if (e.key === 'Escape') setRenaming(null)
                  }}
                  className="h-7 rounded-md border border-status-warning bg-background px-2 text-xs focus:outline-none"
                  style={{ width: Math.max(120, renameValue.length * 8) }}
                />
              ) : (
                <button
                  onClick={() => setActiveSchedule(s.id)}
                  className={cn(
                    'flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors',
                    isActive
                      ? 'border-status-warning bg-status-warning/10 text-status-warning'
                      : 'border-border bg-card text-foreground hover:bg-muted'
                  )}
                >
                  {isActive && <Check className="h-3 w-3" />}
                  {s.name}
                  <span className="text-[9px] text-muted-foreground">
                    {s.blocks.length}
                  </span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuOpenId(menuOpenId === s.id ? null : s.id)
                    }}
                    className="ml-0.5 rounded p-0.5 hover:bg-foreground/10"
                    role="button"
                    tabIndex={0}
                  >
                    <MoreHorizontal className="h-3 w-3" />
                  </span>
                </button>
              )}

              {menuOpenId === s.id && !isRenamingThis && (
                <div className="absolute left-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-md border border-border bg-card shadow-dark-xl">
                  <MenuItem icon={Pencil} onClick={() => startRename(s.id, s.name)}>
                    Renombrar
                  </MenuItem>
                  <MenuItem
                    icon={Copy}
                    onClick={() => {
                      createSchedule(`v${schedules.length + 1} · Copia de ${s.name}`, s.id)
                      setMenuOpenId(null)
                    }}
                  >
                    Duplicar
                  </MenuItem>
                  {schedules.length > 1 && (
                    <MenuItem
                      icon={Trash2}
                      destructive
                      onClick={() => {
                        if (confirm(`¿Eliminar "${s.name}"?`)) {
                          onDeletePlan(s.id)
                          setMenuOpenId(null)
                        }
                      }}
                    >
                      Eliminar
                    </MenuItem>
                  )}
                </div>
              )}
            </div>
          )
        })}

        <button
          onClick={() => createSchedule()}
          className="flex h-7 items-center gap-1 rounded-md border border-dashed border-border bg-card/50 px-2 text-[11px] text-muted-foreground transition-colors hover:border-status-warning/50 hover:text-foreground"
          title="Nueva versión vacía"
        >
          <Plus className="h-3 w-3" />
          Nueva
        </button>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <SyncIndicator status={syncStatus} lastSaved={lastSaved} />

        <button
          onClick={onSaveNow}
          disabled={syncStatus === 'saving'}
          className="flex h-7 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs font-medium text-foreground transition-colors hover:border-status-warning/50 hover:bg-muted disabled:opacity-50"
          title="Guardar ahora (Ctrl+S)"
        >
          <Save className="h-3 w-3" />
          Guardar
        </button>

        <button
          onClick={onOpenAutoSections}
          className="flex h-7 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs font-medium text-foreground transition-colors hover:border-status-warning/50 hover:bg-muted"
        >
          <Sparkles className="h-3 w-3 text-status-warning" />
          <span className="hidden lg:inline">Auto-secciones</span>
        </button>

        <div className="relative">
          <button
            onClick={() => setExportOpen(!exportOpen)}
            className="flex h-7 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs font-medium text-foreground transition-colors hover:border-status-warning/50 hover:bg-muted"
          >
            <Download className="h-3 w-3" />
            <span className="hidden lg:inline">Exportar</span>
          </button>
          {exportOpen && (
            <div className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-md border border-border bg-card shadow-dark-xl">
              <MenuItem icon={FileJson} onClick={exportJSON}>JSON</MenuItem>
              <MenuItem icon={Calendar} onClick={exportICS}>iCalendar (.ics)</MenuItem>
              <MenuItem icon={Printer} onClick={printSchedule}>Imprimir / PDF</MenuItem>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SyncIndicator({ status, lastSaved }: { status: SyncStatus; lastSaved: number | null }) {
  const label = (() => {
    switch (status) {
      case 'saving':
        return 'Guardando...'
      case 'saved':
        return lastSaved ? `Guardado ${formatAgo(lastSaved)}` : 'Guardado'
      case 'error':
        return 'Error al guardar'
      case 'offline':
        return 'Sin conexión'
      default:
        return null
    }
  })()

  if (!label) return null

  const iconMap: Record<string, React.ReactNode> = {
    saving: <Loader2 className="h-3 w-3 animate-spin text-status-info" />,
    saved: <Cloud className="h-3 w-3 text-status-success" />,
    error: <CloudOff className="h-3 w-3 text-status-critical" />,
    offline: <CloudOff className="h-3 w-3 text-muted-foreground" />,
  }

  return (
    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
      {iconMap[status]}
      {label}
    </span>
  )
}

function formatAgo(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000)
  if (diff < 5) return 'ahora'
  if (diff < 60) return `hace ${diff}s`
  const min = Math.floor(diff / 60)
  return `hace ${min}m`
}

function MenuItem({
  icon: Icon,
  onClick,
  children,
  destructive,
}: {
  icon: React.ComponentType<{ className?: string }>
  onClick: () => void
  children: React.ReactNode
  destructive?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors',
        destructive
          ? 'text-status-critical hover:bg-status-critical/10'
          : 'text-foreground hover:bg-muted'
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  )
}
