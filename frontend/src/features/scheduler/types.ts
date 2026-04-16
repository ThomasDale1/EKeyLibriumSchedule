import type { TipoAula } from '@/lib/types'

export type Subject = {
  id: string
  codigo: string
  nombre: string
  creditos: number
  horasSemanales: number
  tipoAula: TipoAula
  ciclo: number
  color: SubjectColor
}

export type SubjectColor = 'warning' | 'info' | 'success' | 'critical' | 'accent' | 'violet' | 'pink' | 'teal'

export type Professor = {
  id: string
  codigo: string
  nombre: string
  apellido: string
  maxHorasDia: number
  maxHorasSemana: number
}

export type Room = {
  id: string
  codigo: string
  nombre: string
  capacidad: number
  tipo: TipoAula
  edificio: string
}

export type ScheduleBlock = {
  id: string
  subjectId: string
  sectionLabel: string
  professorId: string | null
  roomId: string | null
  day: number
  startSlot: number
  duration: number
  locked: boolean
  studentsExpected: number
}

export type ConflictKind =
  | 'time-overlap'
  | 'professor-busy'
  | 'room-busy'
  | 'capacity-exceeded'
  | 'room-type-mismatch'

export type Conflict = {
  kind: ConflictKind
  message: string
  otherBlockId?: string
}

export type ConflictMap = Map<string, Conflict[]>

export type PaletteDragData = {
  type: 'palette'
  subjectId: string
}

export type BlockDragData = {
  type: 'block'
  blockId: string
  altKey: boolean
}

export type DragData = PaletteDragData | BlockDragData

export type DropCellData = {
  type: 'cell'
  day: number
  slot: number
}
