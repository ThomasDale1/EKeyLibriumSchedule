export type RolUsuario = 'ADMIN' | 'PROFESOR' | 'ESTUDIANTE'
export type EstadoEstudiante = 'ACTIVO' | 'INACTIVO' | 'GRADUADO' | 'SUSPENDIDO'
export type TipoContrato = 'TIEMPO_COMPLETO' | 'MEDIO_TIEMPO' | 'POR_HORA'
export type TipoAula = 'TEORIA' | 'LABORATORIO_COMPUTO' | 'LABORATORIO_CIENCIAS' | 'AUDITORIO'
export type DiaSemana = 'LUNES' | 'MARTES' | 'MIERCOLES' | 'JUEVES' | 'VIERNES' | 'SABADO'

export type Usuario = {
  id: string
  clerkUserId: string
  email: string
  nombre: string
  apellido: string
  rol: RolUsuario
  activo: boolean
}

export type Carrera = {
  id: string
  nombre: string
  codigo: string
  descripcion?: string | null
  duracionCiclos: number
  activa: boolean
}

export type Materia = {
  id: string
  codigo: string
  nombre: string
  creditos: number
  horasSemanales: number
  ciclo: number
  tipoAula: TipoAula
  descripcion?: string | null
  activa: boolean
  carreraId: string
  carrera?: Carrera
  prerequisitos?: { id: string; codigo: string; nombre: string }[]
}

export type DisponibilidadProfesor = {
  id: string
  profesorId: string
  dia: DiaSemana
  horaInicio: string
  horaFin: string
  esBloqueo: boolean
  esDefinidoPorIA: boolean
}

export type ProfesorMateria = {
  id: string
  profesorId: string
  materiaId: string
  nivelDominio: number
  materia?: Materia
}

export type Profesor = {
  id: string
  clerkUserId: string
  codigo: string
  nombre: string
  apellido: string
  email: string
  telefono?: string | null
  tipoContrato: TipoContrato
  costoHora: number
  maxHorasDia: number
  maxHorasSemana: number
  activo: boolean
  disponibilidad?: DisponibilidadProfesor[]
  materias?: ProfesorMateria[]
}

export type MateriaAprobada = {
  id: string
  estudianteId: string
  materiaId: string
  nota: number
  cicloAprobado: string
}

export type Estudiante = {
  id: string
  clerkUserId: string
  codigoEstudiante: string
  nombre: string
  apellido: string
  email: string
  telefono?: string | null
  cicloActual: number
  promedioGPA?: number | null
  mensualidad: number
  estado: EstadoEstudiante
  tieneVehiculo: boolean
  carreraId: string
  carrera?: Carrera
  materiasAprobadas?: MateriaAprobada[]
}

export type EstadoPlan = 'BORRADOR' | 'PUBLICADO' | 'ARCHIVADO'

export type PlanHorario = {
  id: string
  nombre: string
  estado: EstadoPlan
  bloques: unknown
  notas: string | null
  creadoEn: string
  actualizadoEn: string
  cicloId: string | null
}

export type Aula = {
  id: string
  codigo: string
  nombre: string
  capacidad: number
  tipo: TipoAula
  edificio?: string | null
  piso?: number | null
  tieneProyector: boolean
  tieneAC: boolean
  tieneInternet: boolean
  activa: boolean
}
