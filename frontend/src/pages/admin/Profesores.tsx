import {
  AlertTriangle,
  BookOpen,
  Calendar,
  ChevronDown,
  Clock,
  DollarSign,
  Edit3,
  GraduationCap,
  Mail,
  Phone,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Badge, Card, EmptyState, PageHeader, ProgressBar, SkeletonCard, SkeletonStatCard, StatCard } from '@/components/admin/ui'
import {
  Profesores as ProfesoresApi,
  Disponibilidades,
  ProfesorMaterias,
  Materias as MateriasApi,
} from '@/hooks/useApiQueries'
import { FormModal, Field, inputClass } from '@/components/admin/FormModal'
import { useApi } from '@/lib/api'
import { useQueryClient } from '@tanstack/react-query'
import type {
  DiaSemana,
  DisponibilidadProfesor,
  Materia,
  Profesor,
  ProfesorMateria,
  TipoContrato,
} from '@/lib/types'

// ── Constants ──

const TIPOS_CONTRATO: TipoContrato[] = ['TIEMPO_COMPLETO', 'MEDIO_TIEMPO', 'POR_HORA']

const CONTRATO_LABEL: Record<TipoContrato, string> = {
  TIEMPO_COMPLETO: 'Tiempo completo',
  MEDIO_TIEMPO: 'Medio tiempo',
  POR_HORA: 'Por hora',
}

const DIAS: DiaSemana[] = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO']

const DIA_SHORT: Record<DiaSemana, string> = {
  LUNES: 'Lun',
  MARTES: 'Mar',
  MIERCOLES: 'Mié',
  JUEVES: 'Jue',
  VIERNES: 'Vie',
  SABADO: 'Sáb',
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7) // 7am - 8pm

function formatCost(cost: number, tipo: TipoContrato): string {
  const formatted = `$${cost.toFixed(2)}`
  return tipo === 'POR_HORA' ? `${formatted}/hr` : `${formatted}/mes`
}

function timeToSlot(time: string): number {
  // Validate time format: must be exactly "HH:MM"
  if (!time || typeof time !== 'string') {
    throw new Error(`Invalid time format: expected "HH:MM", got "${time}"`)
  }
  const parts = time.split(':')
  if (parts.length !== 2) {
    throw new Error(`Invalid time format: "${time}" must contain exactly one colon`)
  }
  const h = Number(parts[0])
  const m = Number(parts[1])
  if (isNaN(h) || isNaN(m)) {
    throw new Error(`Invalid time format: "${time}" contains non-numeric parts`)
  }
  if (h < 0 || h > 23 || m < 0 || m > 59) {
    throw new Error(`Invalid time values: hours must be 0-23, minutes must be 0-59, got ${h}:${m}`)
  }
  return (h - 7) * 2 + (m >= 30 ? 1 : 0)
}

function slotToTime(slot: number): string {
  const h = Math.floor(slot / 2) + 7
  const m = (slot % 2) * 30
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// ── Types for local schedule state ──

type ScheduleBlock = {
  dia: DiaSemana
  horaInicio: string
  horaFin: string
}

type SubjectSelection = {
  materiaId: string
  nivelDominio: number // 5 = primary, 3 = secondary
}

type ProfesorForm = {
  codigo: string
  nombre: string
  apellido: string
  email: string
  telefono: string
  tipoContrato: TipoContrato
  costoHora: number
  maxHorasDia: number
  maxHorasSemana: number
  activo: boolean
}

const EMPTY_FORM: ProfesorForm = {
  codigo: '',
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  tipoContrato: 'POR_HORA',
  costoHora: 25,
  maxHorasDia: 6,
  maxHorasSemana: 24,
  activo: true,
}

// ── Main Page ──

export default function Profesores() {
  const { data: profesores = [], isLoading, error } = ProfesoresApi.useList()
  const { data: materias = [] } = MateriasApi.useList()
  const create = ProfesoresApi.useCreate()
  const update = ProfesoresApi.useUpdate()
  const remove = ProfesoresApi.useDelete()
  const createDisp = Disponibilidades.useCreate()
  const deleteDisp = Disponibilidades.useDelete()
  const createPM = ProfesorMaterias.useCreate()
  const deletePM = ProfesorMaterias.useDelete()
  const api = useApi()
  const qc = useQueryClient()

  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<ProfesorForm>(EMPTY_FORM)
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([])
  const [subjectSelections, setSubjectSelections] = useState<SubjectSelection[]>([])
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q
      ? profesores.filter((p) =>
          `${p.nombre} ${p.apellido} ${p.email} ${p.codigo}`.toLowerCase().includes(q)
        )
      : profesores
  }, [profesores, search])

  const activos = profesores.filter((p) => p.activo).length
  const tiempoCompleto = profesores.filter((p) => p.tipoContrato === 'TIEMPO_COMPLETO').length

  // ── Open modal for create ──
  const openCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setScheduleBlocks([])
    setSubjectSelections([])
    setModalOpen(true)
  }

  // ── Open modal for edit ──
  const openEdit = (p: Profesor) => {
    setEditingId(p.id)
    setForm({
      codigo: p.codigo,
      nombre: p.nombre,
      apellido: p.apellido,
      email: p.email,
      telefono: p.telefono ?? '',
      tipoContrato: p.tipoContrato,
      costoHora: p.costoHora,
      maxHorasDia: p.maxHorasDia,
      maxHorasSemana: p.maxHorasSemana,
      activo: p.activo,
    })
    setScheduleBlocks(
      (p.disponibilidad ?? [])
        .filter((d) => !d.esBloqueo)
        .map((d) => ({ dia: d.dia, horaInicio: d.horaInicio, horaFin: d.horaFin }))
    )
    setSubjectSelections(
      (p.materias ?? []).map((pm) => ({ materiaId: pm.materiaId, nivelDominio: pm.nivelDominio }))
    )
    setModalOpen(true)
  }

  // ── Submit (create or update) ──
  const submit = async () => {
    // Validate required fields
    if (!form.codigo?.trim()) {
      alert('El código del profesor es requerido.')
      return
    }
    if (!form.nombre?.trim()) {
      alert('El nombre del profesor es requerido.')
      return
    }
    if (!form.apellido?.trim()) {
      alert('El apellido del profesor es requerido.')
      return
    }
    if (!form.email?.trim()) {
      alert('El email del profesor es requerido.')
      return
    }
    // Validate email format
    if (!validateEmail(form.email.trim())) {
      alert('El formato del email no es válido. Ingrese un email válido (ej: profesor@example.com).')
      return
    }
    setSaving(true)
    try {
      let profesorId: string
      const deletedDispIds: string[] = []
      const deletedPMIds: string[] = []

      let existingProfesor: Profesor | undefined
      let oldDispRecords: DisponibilidadProfesor[] = []
      let oldPMRecords: ProfesorMateria[] = []

      if (editingId) {
        existingProfesor = profesores.find((p) => p.id === editingId)
        profesorId = editingId
        oldDispRecords = existingProfesor?.disponibilidad ?? []
        oldPMRecords = existingProfesor?.materias ?? []

        for (const d of oldDispRecords) {
          deletedDispIds.push(d.id)
        }
        for (const pm of oldPMRecords) {
          deletedPMIds.push(pm.id)
        }
      } else {
        const created = await create.mutateAsync({
          ...form,
          clerkUserId: `manual_${Date.now()}`,
        })
        profesorId = (created as Profesor).id
      }

      // Create availability blocks first, before deleting old records.
      const createdDisp: string[] = []
      try {
        for (const block of scheduleBlocks) {
          const result = await createDisp.mutateAsync({
            profesorId,
            dia: block.dia,
            horaInicio: block.horaInicio,
            horaFin: block.horaFin,
            esBloqueo: false,
          })
          createdDisp.push((result as DisponibilidadProfesor).id)
        }
      } catch (e) {
        console.error('Error creating disponibilidades:', e)
        throw new Error('Error al guardar bloques de disponibilidad')
      }

      // Create subject competencies next.
      const createdPM: string[] = []
      try {
        for (const sel of subjectSelections) {
          const result = await createPM.mutateAsync({
            profesorId,
            materiaId: sel.materiaId,
            nivelDominio: sel.nivelDominio,
          })
          createdPM.push((result as ProfesorMateria).id)
        }
      } catch (e) {
        console.error('Error creating profesor-materias:', e)
        if (createdDisp.length > 0) {
          await Promise.allSettled(
            createdDisp.map((id) => deleteDisp.mutateAsync(id))
          )
        }
        throw new Error('Error al guardar asignaciones de materias')
      }

      // If editing, delete old records only after new ones have been created.
      let deleteSettled: Array<PromiseSettledResult<unknown>> = []
      if (editingId) {
        const deleteOperations = [
          ...deletedDispIds.map((id) => ({ id, type: 'disponibilidad' as const, recordType: 'disponibilidad', promise: deleteDisp.mutateAsync(id) })),
          ...deletedPMIds.map((id) => ({ id, type: 'profesor-materia' as const, recordType: 'materia', promise: deletePM.mutateAsync(id) })),
        ]

        deleteSettled = await Promise.allSettled(deleteOperations.map((op) => op.promise))
        const failed = deleteSettled
          .map((result, index) => ({ result, op: deleteOperations[index] }))
          .filter(({ result }) => result.status === 'rejected')

        if (failed.length === deleteOperations.length) {
          console.error('All delete operations failed after successful create:', failed)
          await Promise.allSettled([
            ...createdDisp.map((id) => deleteDisp.mutateAsync(id)),
            ...createdPM.map((id) => deletePM.mutateAsync(id)),
          ])
          throw new Error(
            'Error al sincronizar los cambios; los registros nuevos fueron deshechos para evitar inconsistencias.'
          )
        }

        if (failed.length > 0) {
          console.warn(
            'Some delete operations failed after successful create; keeping new records and continuing.',
            failed.map(({ op, result }) => ({ id: op.id, type: op.type, error: (result as PromiseRejectedResult).reason }))
          )
        }
      }

      if (editingId) {
        try {
          await update.mutateAsync({ id: editingId, data: form })
        } catch (e) {
          console.error('Error updating profesor after related record changes:', e)
          await Promise.allSettled([
            ...createdDisp.map((id) => deleteDisp.mutateAsync(id)),
            ...createdPM.map((id) => deletePM.mutateAsync(id)),
          ])

          const deletedDispIdsSucceeded = editingId
            ? deletedDispIds.filter((_, index) => deleteSettled[index]?.status === 'fulfilled')
            : []
          const deletedPMIdsSucceeded = editingId
            ? deletedPMIds.filter((_, index) => deleteSettled[deletedDispIds.length + index]?.status === 'fulfilled')
            : []

          await Promise.allSettled([
            ...oldDispRecords
              .filter((record) => deletedDispIdsSucceeded.includes(record.id))
              .map((record) =>
                createDisp.mutateAsync({
                  profesorId,
                  dia: record.dia,
                  horaInicio: record.horaInicio,
                  horaFin: record.horaFin,
                  esBloqueo: record.esBloqueo,
                })
              ),
            ...oldPMRecords
              .filter((record) => deletedPMIdsSucceeded.includes(record.id))
              .map((record) =>
                createPM.mutateAsync({
                  profesorId,
                  materiaId: record.materiaId,
                  nivelDominio: record.nivelDominio,
                })
              ),
          ])

          throw e
        }
      }

      // Refresh data
      qc.invalidateQueries({ queryKey: ['profesores'] })
      qc.invalidateQueries({ queryKey: ['disponibilidades'] })
      qc.invalidateQueries({ queryKey: ['profesor-materias'] })

      setModalOpen(false)
    } catch (e: unknown) {
      let message = 'Error al guardar'
      if (e instanceof Error) {
        message = e.message
      } else {
        const errorResponse = e as { response?: { data?: { error?: string } } }
        if (errorResponse?.response?.data?.error) {
          message = errorResponse.response.data.error
        }
      }
      alert(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (p: Profesor) => {
    if (!confirm(`¿Eliminar a ${p.nombre} ${p.apellido}?`)) return
    try {
      // Delete related records first
      if (p.disponibilidad) {
        for (const d of p.disponibilidad) await deleteDisp.mutateAsync(d.id)
      }
      if (p.materias) {
        for (const pm of p.materias) await deletePM.mutateAsync(pm.id)
      }
      await remove.mutateAsync(p.id)
    } catch (e: unknown) {
      const message =
        (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Error al eliminar'
      alert(message)
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Profesores"
        description="Carga docente, disponibilidad y asignaciones"
        actions={
          <button
            onClick={openCreate}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-status-warning px-4 text-sm font-semibold text-white hover:bg-status-warning/90"
          >
            <Plus className="h-4 w-4" /> Nuevo Profesor
          </button>
        }
      />

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => <SkeletonStatCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total" value={String(profesores.length)} icon={GraduationCap} accent="warning" />
          <StatCard label="Activos" value={String(activos)} icon={GraduationCap} accent="success" />
          <StatCard label="Inactivos" value={String(profesores.length - activos)} icon={GraduationCap} accent="info" />
          <StatCard label="Tiempo completo" value={String(tiempoCompleto)} icon={GraduationCap} accent="critical" />
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar profesor..."
          className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm focus:border-status-warning/50 focus:outline-none"
        />
      </div>

      {/* Cards grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => <SkeletonCard key={i} className="h-48" />)}
        </div>
      ) : error ? (
        <EmptyState
          icon={AlertTriangle}
          title="Error al cargar profesores"
          description="Verifica tu conexión e intenta de nuevo"
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title={profesores.length === 0 ? 'Aún no hay profesores registrados' : 'No hay resultados para la búsqueda'}
          description={profesores.length === 0 ? 'Agrega el primer profesor para gestionar la carga docente' : 'Intenta buscar con otros términos'}
          action={profesores.length === 0 ? (
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-status-warning px-4 py-2 text-sm font-semibold text-white hover:bg-status-warning/90"
            >
              <Plus className="h-4 w-4" /> Nuevo Profesor
            </button>
          ) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {filtered.map((p) => (
            <ProfesorCard
              key={p.id}
              profesor={p}
              materias={materias}
              onEdit={() => openEdit(p)}
              onDelete={() => handleDelete(p)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {modalOpen && (
        <ProfesorModal
          editingId={editingId}
          form={form}
          setForm={setForm}
          scheduleBlocks={scheduleBlocks}
          setScheduleBlocks={setScheduleBlocks}
          subjectSelections={subjectSelections}
          setSubjectSelections={setSubjectSelections}
          materias={materias}
          saving={saving}
          onClose={() => setModalOpen(false)}
          onSubmit={submit}
        />
      )}
    </div>
  )
}

// ── Professor Card ──

function ProfesorCard({
  profesor: p,
  materias,
  onEdit,
  onDelete,
}: {
  profesor: Profesor
  materias: Materia[]
  onEdit: () => void
  onDelete: () => void
}) {
  const primarySubjects = (p.materias ?? []).filter((pm) => pm.nivelDominio >= 4)
  const secondarySubjects = (p.materias ?? []).filter((pm) => pm.nivelDominio < 4)

  // Calculate total work hours from availability
  const workBlocks = (p.disponibilidad ?? []).filter((d) => !d.esBloqueo)
  const totalWorkHours = workBlocks.reduce((sum, d) => {
    try {
      const start = parseTime(d.horaInicio)
      const end = parseTime(d.horaFin)
      return sum + (end - start)
    } catch (e) {
      console.warn('Invalid time format in disponibilidad:', d, e)
      return sum
    }
  }, 0)

  // For now, assigned class hours = 0 (would come from sections in full implementation)
  const assignedHours = 0
  const hoursPct = p.maxHorasSemana > 0 ? (assignedHours / p.maxHorasSemana) * 100 : 0

  return (
    <Card className="group transition-all duration-200 hover:border-status-warning/30 hover:shadow-lg hover:shadow-status-warning/5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-status-warning to-amber-500 text-sm font-bold text-white transition-transform duration-200 group-hover:scale-105">
          {(p.nombre?.[0] ?? '?') + (p.apellido?.[0] ?? '')}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-base font-semibold text-foreground">
              {p.nombre} {p.apellido}
            </p>
            <div className="flex items-center gap-1.5">
              <Badge variant={p.activo ? 'success' : 'muted'}>
                {p.activo ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono">{p.codigo}</span>
            <span className="text-border">·</span>
            <span>{CONTRATO_LABEL[p.tipoContrato]}</span>
          </div>
        </div>
      </div>

      {/* Contact + Pay */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Mail className="h-3 w-3" /> {p.email}
        </span>
        {p.telefono && (
          <span className="flex items-center gap-1">
            <Phone className="h-3 w-3" /> {p.telefono}
          </span>
        )}
        <span className="flex items-center gap-1 font-semibold text-status-warning">
          <DollarSign className="h-3 w-3" /> {formatCost(p.costoHora, p.tipoContrato)}
        </span>
      </div>

      {/* Hours progress */}
      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">
            Horas clase: {assignedHours}/{p.maxHorasSemana} hrs/sem
          </span>
          <span className="text-muted-foreground">Máx {p.maxHorasDia} hrs/día</span>
        </div>
        <ProgressBar value={hoursPct} accent={hoursPct > 90 ? 'critical' : hoursPct > 70 ? 'warning' : 'success'} />
      </div>

      {/* Subjects */}
      {(primarySubjects.length > 0 || secondarySubjects.length > 0) && (
        <div className="mt-3 space-y-1.5">
          {primarySubjects.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Principal:
              </span>
              {primarySubjects.map((pm) => {
                const m = pm.materia ?? materias.find((x) => x.id === pm.materiaId)
                return (
                  <span
                    key={pm.id}
                    className="rounded-md bg-status-warning/15 px-1.5 py-0.5 text-[10px] font-medium text-status-warning"
                  >
                    {m?.codigo ?? pm.materiaId}
                  </span>
                )
              })}
            </div>
          )}
          {secondarySubjects.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Secundaria:
              </span>
              {secondarySubjects.map((pm) => {
                const m = pm.materia ?? materias.find((x) => x.id === pm.materiaId)
                return (
                  <span
                    key={pm.id}
                    className="rounded-md bg-status-info/15 px-1.5 py-0.5 text-[10px] font-medium text-status-info"
                  >
                    {m?.codigo ?? pm.materiaId}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Mini schedule */}
      {workBlocks.length > 0 && (
        <div className="mt-3">
          <MiniSchedule disponibilidad={workBlocks} />
        </div>
      )}

      {/* Actions */}
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="text-[11px] text-muted-foreground">
          <Calendar className="mr-1 inline h-3 w-3" />
          {totalWorkHours.toFixed(1)} hrs laborales/sem
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Editar profesor"
          >
            <Edit3 className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-status-critical/10 hover:text-status-critical"
            aria-label="Eliminar profesor"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Card>
  )
}

// ── Mini schedule display on card ──

function MiniSchedule({ disponibilidad }: { disponibilidad: DisponibilidadProfesor[] }) {
  const byDay = useMemo(() => {
    const map = new Map<DiaSemana, DisponibilidadProfesor[]>()
    for (const d of disponibilidad) {
      const arr = map.get(d.dia) ?? []
      arr.push(d)
      map.set(d.dia, arr)
    }
    return map
  }, [disponibilidad])

  return (
    <div className="flex gap-1">
      {DIAS.map((dia) => {
        const blocks = byDay.get(dia) ?? []
        return (
          <div key={dia} className="flex-1">
            <div className="mb-0.5 text-center text-[9px] font-medium text-muted-foreground">
              {DIA_SHORT[dia]}
            </div>
            <div className="relative h-10 rounded-sm bg-muted/50">
              {blocks.map((b, i) => {
                try {
                  const startPct = ((parseTime(b.horaInicio) - 7) / 14) * 100
                  const endPct = ((parseTime(b.horaFin) - 7) / 14) * 100
                  return (
                    <div
                      key={i}
                      className="absolute inset-x-0.5 rounded-sm bg-status-warning/30"
                      style={{
                        top: `${startPct}%`,
                        height: `${Math.max(endPct - startPct, 4)}%`,
                      }}
                      title={`${b.horaInicio} – ${b.horaFin}`}
                    />
                  )
                } catch (e) {
                  console.warn('Invalid time format in block:', b, e)
                  return null
                }
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Full Create/Edit Modal ──

function ProfesorModal({
  editingId,
  form,
  setForm,
  scheduleBlocks,
  setScheduleBlocks,
  subjectSelections,
  setSubjectSelections,
  materias,
  saving,
  onClose,
  onSubmit,
}: {
  editingId: string | null
  form: ProfesorForm
  setForm: (f: ProfesorForm) => void
  scheduleBlocks: ScheduleBlock[]
  setScheduleBlocks: (b: ScheduleBlock[]) => void
  subjectSelections: SubjectSelection[]
  setSubjectSelections: (s: SubjectSelection[]) => void
  materias: Materia[]
  saving: boolean
  onClose: () => void
  onSubmit: () => void
}) {
  const [activeTab, setActiveTab] = useState<'info' | 'schedule' | 'subjects'>('info')

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-[5vh]">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-lg font-semibold text-foreground">
            {editingId ? 'Editar Profesor' : 'Nuevo Profesor'}
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {(['info', 'schedule', 'subjects'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-status-warning text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'info' && 'Información'}
              {tab === 'schedule' && 'Horario Laboral'}
              {tab === 'subjects' && 'Materias'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5">
          {activeTab === 'info' && (
            <InfoTab form={form} setForm={setForm} />
          )}
          {activeTab === 'schedule' && (
            <ScheduleTab blocks={scheduleBlocks} setBlocks={setScheduleBlocks} />
          )}
          {activeTab === 'subjects' && (
            <SubjectsTab
              selections={subjectSelections}
              setSelections={setSubjectSelections}
              materias={materias}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-muted"
          >
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            disabled={saving}
            className="rounded-lg bg-status-warning px-4 py-2 text-sm font-semibold text-white hover:bg-status-warning/90 disabled:opacity-60"
          >
            {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear Profesor'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Tab 1: Basic Info ──

function InfoTab({
  form,
  setForm,
}: {
  form: ProfesorForm
  setForm: (f: ProfesorForm) => void
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Código">
          <input
            className={inputClass}
            value={form.codigo}
            onChange={(e) => setForm({ ...form, codigo: e.target.value })}
            placeholder="PROF-001"
            required
          />
        </Field>
        <Field label="Email">
          <input
            type="email"
            className={inputClass}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nombre">
          <input
            className={inputClass}
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            required
          />
        </Field>
        <Field label="Apellido">
          <input
            className={inputClass}
            value={form.apellido}
            onChange={(e) => setForm({ ...form, apellido: e.target.value })}
            required
          />
        </Field>
      </div>
      <Field label="Teléfono">
        <input
          className={inputClass}
          value={form.telefono}
          onChange={(e) => setForm({ ...form, telefono: e.target.value })}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Tipo de contrato">
          <select
            className={inputClass}
            value={form.tipoContrato}
            onChange={(e) => setForm({ ...form, tipoContrato: e.target.value as TipoContrato })}
          >
            {TIPOS_CONTRATO.map((t) => (
              <option key={t} value={t}>
                {CONTRATO_LABEL[t]}
              </option>
            ))}
          </select>
        </Field>
        <Field label={`Costo (${form.tipoContrato === 'POR_HORA' ? 'USD/hr' : 'USD/mes'})`}>
          <input
            type="number"
            step="0.01"
            min={0}
            className={inputClass}
            value={form.costoHora}
            onChange={(e) => setForm({ ...form, costoHora: +e.target.value })}
            required
          />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Máx horas clase/día">
          <input
            type="number"
            min={1}
            max={14}
            className={inputClass}
            value={form.maxHorasDia}
            onChange={(e) => setForm({ ...form, maxHorasDia: +e.target.value })}
            required
          />
        </Field>
        <Field label="Máx horas clase/semana">
          <input
            type="number"
            min={1}
            max={60}
            className={inputClass}
            value={form.maxHorasSemana}
            onChange={(e) => setForm({ ...form, maxHorasSemana: +e.target.value })}
            required
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 pt-1 text-sm text-foreground">
        <input
          type="checkbox"
          checked={form.activo}
          onChange={(e) => setForm({ ...form, activo: e.target.checked })}
        />
        Activo
      </label>
    </div>
  )
}

// ── Tab 2: Schedule Grid ──

const TOTAL_HALF_HOURS = 28 // 7am-9pm = 14hrs * 2 = 28 half-hour slots

function ScheduleTab({
  blocks,
  setBlocks,
}: {
  blocks: ScheduleBlock[]
  setBlocks: (b: ScheduleBlock[]) => void
}) {
  // Convert blocks to a painted set for fast lookup
  const painted = useMemo(() => {
    const set = new Set<string>()
    for (const b of blocks) {
      try {
        const startSlot = timeToSlot(b.horaInicio)
        const endSlot = timeToSlot(b.horaFin)
        for (let s = startSlot; s < endSlot; s++) {
          set.add(`${b.dia}:${s}`)
        }
      } catch (e) {
        console.warn('Invalid time format in block:', b, e)
      }
    }
    return set
  }, [blocks])

  // Keyboard navigation state: currently focused cell (dia, slot)
  const [focusedCell, setFocusedCell] = useState<{ dia: DiaSemana; slot: number } | null>(null)
  const cellRefs = useRef<Map<string, HTMLDivElement | null>>(new Map())

  useEffect(() => {
    const focusedKey = focusedCell ? `${focusedCell.dia}:${focusedCell.slot}` : 'LUNES:0'
    const cell = cellRefs.current.get(focusedKey)
    if (cell) {
      cell.focus()
    }
  }, [focusedCell])

  // Drag-paint state
  const painting = useRef<{ active: boolean; adding: boolean }>({ active: false, adding: true })
  const touchedSlots = useRef<Set<string>>(new Set())

  const rebuildBlocks = useCallback(
    (nextPainted: Set<string>) => {
      // Convert painted cells back into continuous blocks
      const newBlocks: ScheduleBlock[] = []
      for (const dia of DIAS) {
        let startSlot: number | null = null
        for (let s = 0; s <= TOTAL_HALF_HOURS; s++) {
          const key = `${dia}:${s}`
          const isPainted = nextPainted.has(key)
          if (isPainted && startSlot === null) {
            startSlot = s
          } else if (!isPainted && startSlot !== null) {
            newBlocks.push({
              dia,
              horaInicio: slotToTime(startSlot),
              horaFin: slotToTime(s),
            })
            startSlot = null
          }
        }
      }
      setBlocks(newBlocks)
    },
    [setBlocks]
  )

  const handlePointerDown = (dia: DiaSemana, slot: number) => {
    const key = `${dia}:${slot}`
    const adding = !painted.has(key)
    painting.current = { active: true, adding }
    touchedSlots.current = new Set([key])

    const next = new Set(painted)
    if (adding) next.add(key)
    else next.delete(key)
    rebuildBlocks(next)
  }

  const handlePointerEnter = (dia: DiaSemana, slot: number) => {
    if (!painting.current.active) return
    const key = `${dia}:${slot}`
    if (touchedSlots.current.has(key)) return
    touchedSlots.current.add(key)

    const next = new Set(painted)
    if (painting.current.adding) next.add(key)
    else next.delete(key)
    rebuildBlocks(next)
  }

  const handlePointerUp = () => {
    painting.current.active = false
    touchedSlots.current.clear()
  }

  // Keyboard navigation and toggle handler
  const handleCellKeyDown = (dia: DiaSemana, slot: number, event: React.KeyboardEvent) => {
    const key = event.key
    const diaIndex = DIAS.indexOf(dia)

    // Handle arrow key navigation
    if (key === 'ArrowUp' && slot > 0) {
      event.preventDefault()
      setFocusedCell({ dia, slot: slot - 1 })
    } else if (key === 'ArrowDown' && slot < TOTAL_HALF_HOURS - 1) {
      event.preventDefault()
      setFocusedCell({ dia, slot: slot + 1 })
    } else if (key === 'ArrowLeft' && diaIndex > 0) {
      event.preventDefault()
      setFocusedCell({ dia: DIAS[diaIndex - 1], slot })
    } else if (key === 'ArrowRight' && diaIndex < DIAS.length - 1) {
      event.preventDefault()
      setFocusedCell({ dia: DIAS[diaIndex + 1], slot })
    } else if (key === ' ' || key === 'Enter') {
      // Toggle selection on Space or Enter
      event.preventDefault()
      handlePointerDown(dia, slot)
    }
  }

  // Compute total painted hours
  const totalHours = painted.size / 2

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Arrastra para pintar el horario laboral del profesor
        </p>
        <span className="text-xs font-semibold text-foreground">{totalHours} hrs/sem</span>
      </div>

      <div
        className="select-none"
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        role="grid"
        aria-label="Horario laboral del profesor - Usa flechas para navegar, Espacio/Enter para seleccionar"
      >
        <div
          className="grid gap-px"
          style={{ gridTemplateColumns: '40px repeat(6, 1fr)' }}
        >
          {/* Header row */}
          <div />
          {DIAS.map((d, diaIndex) => (
            <div
              key={d}
              className="pb-1 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
              role="columnheader"
              aria-colindex={diaIndex + 2}
            >
              {DIA_SHORT[d]}
            </div>
          ))}

          {/* Time rows (one per half-hour) */}
          {Array.from({ length: TOTAL_HALF_HOURS }, (_, slot) => {
            const isHour = slot % 2 === 0
            return (
              <div key={slot} className="contents">
                {/* Time label */}
                <div className="flex items-center justify-end pr-1.5 text-[9px] text-muted-foreground/60" role="rowheader" aria-rowindex={slot + 2}>
                  {isHour ? `${Math.floor(slot / 2) + 7}:00` : ''}
                </div>
                {/* Day cells */}
                {DIAS.map((dia, diaIndex) => {
                  const key = `${dia}:${slot}`
                  const isPainted = painted.has(key)
                  const isFirstCell = diaIndex === 0 && slot === 0
                  const isFocused = focusedCell
                    ? focusedCell.dia === dia && focusedCell.slot === slot
                    : isFirstCell
                  return (
                    <div
                      key={key}
                      ref={(el) => {
                        if (el) {
                          cellRefs.current.set(key, el)
                        } else {
                          cellRefs.current.delete(key)
                        }
                      }}
                      tabIndex={isFocused ? 0 : -1}
                      role="gridcell"
                      aria-selected={isPainted}
                      aria-rowindex={slot + 2}
                      aria-colindex={diaIndex + 2}
                      onPointerDown={() => handlePointerDown(dia, slot)}
                      onPointerEnter={() => handlePointerEnter(dia, slot)}
                      onKeyDown={(e) => handleCellKeyDown(dia, slot, e)}
                      onFocus={() => setFocusedCell({ dia, slot })}
                      className={`h-3 cursor-pointer border-b border-r transition-colors ${
                        isHour ? 'border-b-border/30' : 'border-b-border/10'
                      } border-r-border/10 ${
                        isPainted
                          ? 'bg-status-warning/40 hover:bg-status-warning/50'
                          : 'bg-muted/20 hover:bg-muted/40'
                      } ${
                        isFocused ? 'ring-2 ring-status-warning ring-offset-0' : ''
                      }`}
                    />
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {blocks.length > 0 && (
        <div className="mt-3 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Bloques definidos
          </p>
          <div className="flex flex-wrap gap-1">
            {blocks.map((b, i) => (
              <span
                key={i}
                className="rounded bg-status-warning/15 px-1.5 py-0.5 text-[10px] font-medium text-status-warning"
              >
                {DIA_SHORT[b.dia]} {b.horaInicio}–{b.horaFin}
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setBlocks([])}
        className="mt-3 text-xs text-muted-foreground hover:text-status-critical"
      >
        Limpiar horario
      </button>
    </div>
  )
}

// ── Tab 3: Subject Selector ──

function SubjectsTab({
  selections,
  setSelections,
  materias,
}: {
  selections: SubjectSelection[]
  setSelections: (s: SubjectSelection[]) => void
  materias: Materia[]
}) {
  const [search, setSearch] = useState('')

  const primaryIds = new Set(selections.filter((s) => s.nivelDominio >= 4).map((s) => s.materiaId))
  const secondaryIds = new Set(
    selections.filter((s) => s.nivelDominio < 4).map((s) => s.materiaId)
  )

  const filteredMaterias = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q
      ? materias.filter((m) => m.codigo.toLowerCase().includes(q) || m.nombre.toLowerCase().includes(q))
      : materias
  }, [materias, search])

  const toggle = (materiaId: string, level: 'primary' | 'secondary') => {
    const nivelDominio = level === 'primary' ? 5 : 3
    const existing = selections.find((s) => s.materiaId === materiaId)

    if (existing) {
      if (existing.nivelDominio === nivelDominio) {
        // Remove
        setSelections(selections.filter((s) => s.materiaId !== materiaId))
      } else {
        // Switch level
        setSelections(
          selections.map((s) => (s.materiaId === materiaId ? { ...s, nivelDominio } : s))
        )
      }
    } else {
      // Add
      setSelections([...selections, { materiaId, nivelDominio }])
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar materia..."
            className="h-8 w-full rounded-lg border border-border bg-background pl-8 pr-3 text-xs focus:border-status-warning/50 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-status-warning" /> Principal ({primaryIds.size})
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-status-info" /> Secundaria ({secondaryIds.size})
          </span>
        </div>
      </div>

      <div className="max-h-[300px] overflow-y-auto rounded-lg border border-border">
        {filteredMaterias.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            {materias.length === 0 ? 'No hay materias registradas' : 'Sin resultados'}
          </p>
        ) : (
          filteredMaterias.map((m) => {
            const isPrimary = primaryIds.has(m.id)
            const isSecondary = secondaryIds.has(m.id)
            return (
              <div
                key={m.id}
                className={`flex items-center justify-between border-b border-border/40 px-3 py-2 last:border-0 ${
                  isPrimary
                    ? 'bg-status-warning/5'
                    : isSecondary
                      ? 'bg-status-info/5'
                      : ''
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-muted-foreground">{m.codigo}</span>
                    <span className="truncate text-xs font-medium text-foreground">{m.nombre}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggle(m.id, 'primary')}
                    className={`rounded px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                      isPrimary
                        ? 'bg-status-warning text-white'
                        : 'bg-muted text-muted-foreground hover:bg-status-warning/20 hover:text-status-warning'
                    }`}
                  >
                    P
                  </button>
                  <button
                    onClick={() => toggle(m.id, 'secondary')}
                    className={`rounded px-2 py-0.5 text-[10px] font-semibold transition-colors ${
                      isSecondary
                        ? 'bg-status-info text-white'
                        : 'bg-muted text-muted-foreground hover:bg-status-info/20 hover:text-status-info'
                    }`}
                  >
                    S
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Selected summary */}
      {selections.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {primaryIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Principales:
              </span>
              {Array.from(primaryIds).map((id) => {
                const m = materias.find((x) => x.id === id)
                return (
                  <span
                    key={id}
                    className="rounded-md bg-status-warning/15 px-1.5 py-0.5 text-[10px] font-medium text-status-warning"
                  >
                    {m?.codigo ?? id}
                  </span>
                )
              })}
            </div>
          )}
          {secondaryIds.size > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Secundarias:
              </span>
              {Array.from(secondaryIds).map((id) => {
                const m = materias.find((x) => x.id === id)
                return (
                  <span
                    key={id}
                    className="rounded-md bg-status-info/15 px-1.5 py-0.5 text-[10px] font-medium text-status-info"
                  >
                    {m?.codigo ?? id}
                  </span>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Helpers ──

function parseTime(time: string): number {
  // Validate time format: must be exactly "HH:MM"
  if (!time || typeof time !== 'string') {
    throw new Error(`Invalid time format: expected "HH:MM", got "${time}"`)
  }
  const parts = time.split(':')
  if (parts.length !== 2) {
    throw new Error(`Invalid time format: "${time}" must contain exactly one colon`)
  }
  const h = Number(parts[0])
  const m = Number(parts[1])
  if (isNaN(h) || isNaN(m)) {
    throw new Error(`Invalid time format: "${time}" contains non-numeric parts`)
  }
  if (h < 0 || h > 23 || m < 0 || m > 59) {
    throw new Error(`Invalid time values: hours must be 0-23, minutes must be 0-59, got ${h}:${m}`)
  }
  return h + m / 60
}

function validateEmail(email: string): boolean {
  // Simple email validation regex
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}
