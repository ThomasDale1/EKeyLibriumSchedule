import { useEffect, useMemo } from 'react'
import { useScheduleStore } from './store'
import { Materias, Profesores, Aulas } from '@/hooks/useApiQueries'
import type { Materia, Profesor as ApiProfesor, Aula } from '@/lib/types'
import type { Subject, Professor, Room, SubjectColor } from './types'

const SUBJECT_COLORS: SubjectColor[] = [
  'warning', 'info', 'success', 'critical', 'accent', 'violet', 'pink', 'teal',
]

function materiaToSubject(m: Materia, index: number): Subject {
  return {
    id: m.id,
    codigo: m.codigo,
    nombre: m.nombre,
    creditos: m.creditos,
    horasSemanales: m.horasSemanales,
    tipoAula: m.tipoAula,
    ciclo: m.ciclo,
    color: SUBJECT_COLORS[index % SUBJECT_COLORS.length],
  }
}

function profesorToProfessor(p: ApiProfesor): Professor {
  return {
    id: p.id,
    codigo: p.codigo,
    nombre: p.nombre,
    apellido: p.apellido,
    maxHorasDia: p.maxHorasDia,
    maxHorasSemana: p.maxHorasSemana,
  }
}

function aulaToRoom(a: Aula): Room {
  return {
    id: a.id,
    codigo: a.codigo,
    nombre: a.nombre,
    capacidad: a.capacidad,
    tipo: a.tipo,
    edificio: a.edificio ?? '',
  }
}

export function useSchedulerData() {
  const { data: materias, isLoading: loadingMat, isError: errorMat } = Materias.useList()
  const { data: profesores, isLoading: loadingProf, isError: errorProf } = Profesores.useList()
  const { data: aulas, isLoading: loadingAulas, isError: errorAulas } = Aulas.useList()

  const setSubjects = useScheduleStore((s) => s.setSubjects)
  const setProfessors = useScheduleStore((s) => s.setProfessors)
  const setRooms = useScheduleStore((s) => s.setRooms)

  const subjects = useMemo(
    () => (materias ?? []).filter((m) => m.activa).map(materiaToSubject),
    [materias],
  )

  const professors = useMemo(
    () => (profesores ?? []).filter((p) => p.activo).map(profesorToProfessor),
    [profesores],
  )

  const rooms = useMemo(
    () => (aulas ?? []).filter((a) => a.activa).map(aulaToRoom),
    [aulas],
  )

  useEffect(() => { setSubjects(subjects) }, [subjects, setSubjects])
  useEffect(() => { setProfessors(professors) }, [professors, setProfessors])
  useEffect(() => { setRooms(rooms) }, [rooms, setRooms])

  return {
    isLoading: loadingMat || loadingProf || loadingAulas,
    isError: errorMat || errorProf || errorAulas,
    subjects,
    professors,
    rooms,
  }
}
