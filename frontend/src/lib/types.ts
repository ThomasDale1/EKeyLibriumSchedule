export type RolUsuario = 'ADMIN' | 'PROFESOR' | 'ESTUDIANTE'
export type EstadoEstudiante = 'ACTIVO' | 'INACTIVO' | 'GRADUADO' | 'SUSPENDIDO'
export type TipoContrato = 'TIEMPO_COMPLETO' | 'MEDIO_TIEMPO' | 'POR_HORA'
export type TipoAula = 'TEORIA' | 'LABORATORIO_COMPUTO' | 'LABORATORIO_CIENCIAS' | 'AUDITORIO'

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
  tipoAula: TipoAula
  descripcion?: string | null
  activa: boolean
  carreraId: string
  carrera?: Carrera
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
  costoHora: string | number
  maxHorasDia: number
  maxHorasSemana: number
  activo: boolean
}

export type Estudiante = {
  id: string
  clerkUserId: string
  codigoEstudiante: string
  nombre: string
  apellido: string
  email: string
  cicloActual: number
  estado: EstadoEstudiante
  carreraId: string
  carrera?: Carrera
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
