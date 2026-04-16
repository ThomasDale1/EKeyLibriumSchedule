import type { Professor, Room, ScheduleBlock, Subject } from './types'

export const MOCK_SUBJECTS: Subject[] = [
  { id: 's1', codigo: 'MAT201', nombre: 'Matemática Discreta', creditos: 4, horasSemanales: 4, tipoAula: 'TEORIA', ciclo: 3, color: 'warning' },
  { id: 's2', codigo: 'BDD310', nombre: 'Bases de Datos II', creditos: 4, horasSemanales: 5, tipoAula: 'LABORATORIO_COMPUTO', ciclo: 4, color: 'info' },
  { id: 's3', codigo: 'ALG220', nombre: 'Algoritmos', creditos: 4, horasSemanales: 4, tipoAula: 'TEORIA', ciclo: 3, color: 'success' },
  { id: 's4', codigo: 'RED401', nombre: 'Redes de Computadoras', creditos: 3, horasSemanales: 4, tipoAula: 'LABORATORIO_COMPUTO', ciclo: 5, color: 'critical' },
  { id: 's5', codigo: 'FIS102', nombre: 'Física II', creditos: 4, horasSemanales: 5, tipoAula: 'LABORATORIO_CIENCIAS', ciclo: 2, color: 'violet' },
  { id: 's6', codigo: 'IA501', nombre: 'Inteligencia Artificial', creditos: 4, horasSemanales: 4, tipoAula: 'LABORATORIO_COMPUTO', ciclo: 6, color: 'accent' },
  { id: 's7', codigo: 'SWE310', nombre: 'Ingeniería de Software', creditos: 4, horasSemanales: 4, tipoAula: 'TEORIA', ciclo: 4, color: 'teal' },
  { id: 's8', codigo: 'SO320', nombre: 'Sistemas Operativos', creditos: 4, horasSemanales: 5, tipoAula: 'LABORATORIO_COMPUTO', ciclo: 4, color: 'pink' },
]

export const MOCK_PROFESSORS: Professor[] = [
  { id: 'p1', codigo: 'EM-001', nombre: 'Elena', apellido: 'Martínez', maxHorasDia: 6, maxHorasSemana: 24 },
  { id: 'p2', codigo: 'CR-002', nombre: 'Carlos', apellido: 'Ramírez', maxHorasDia: 8, maxHorasSemana: 30 },
  { id: 'p3', codigo: 'AS-003', nombre: 'Ana', apellido: 'Soriano', maxHorasDia: 6, maxHorasSemana: 20 },
  { id: 'p4', codigo: 'JM-004', nombre: 'Jorge', apellido: 'Morales', maxHorasDia: 8, maxHorasSemana: 32 },
  { id: 'p5', codigo: 'LV-005', nombre: 'Laura', apellido: 'Vega', maxHorasDia: 6, maxHorasSemana: 24 },
]

export const MOCK_ROOMS: Room[] = [
  { id: 'r1', codigo: 'A-204', nombre: 'Aula A-204', capacidad: 40, tipo: 'TEORIA', edificio: 'A' },
  { id: 'r2', codigo: 'A-110', nombre: 'Aula A-110', capacidad: 50, tipo: 'TEORIA', edificio: 'A' },
  { id: 'r3', codigo: 'B-101', nombre: 'Aula B-101', capacidad: 35, tipo: 'TEORIA', edificio: 'B' },
  { id: 'r4', codigo: 'LAB-1', nombre: 'Lab 1', capacidad: 25, tipo: 'LABORATORIO_COMPUTO', edificio: 'C' },
  { id: 'r5', codigo: 'LAB-2', nombre: 'Lab 2', capacidad: 25, tipo: 'LABORATORIO_COMPUTO', edificio: 'C' },
  { id: 'r6', codigo: 'LAB-3', nombre: 'Lab 3', capacidad: 30, tipo: 'LABORATORIO_COMPUTO', edificio: 'C' },
  { id: 'r7', codigo: 'LAB-F', nombre: 'Lab Física', capacidad: 20, tipo: 'LABORATORIO_CIENCIAS', edificio: 'D' },
  { id: 'r8', codigo: 'AUD-1', nombre: 'Auditorio 1', capacidad: 120, tipo: 'AUDITORIO', edificio: 'A' },
]

export const MOCK_INITIAL_BLOCKS: ScheduleBlock[] = [
  { id: 'b1', subjectId: 's1', sectionLabel: '01', professorId: 'p1', roomId: 'r1', day: 0, startSlot: 2, duration: 4, locked: false, studentsExpected: 28 },
  { id: 'b2', subjectId: 's2', sectionLabel: '01', professorId: 'p2', roomId: 'r6', day: 0, startSlot: 10, duration: 4, locked: false, studentsExpected: 22 },
  { id: 'b3', subjectId: 's3', sectionLabel: '01', professorId: 'p3', roomId: 'r3', day: 1, startSlot: 4, duration: 4, locked: false, studentsExpected: 30 },
  { id: 'b4', subjectId: 's4', sectionLabel: '01', professorId: 'p4', roomId: 'r4', day: 2, startSlot: 0, duration: 4, locked: false, studentsExpected: 24 },
  { id: 'b5', subjectId: 's5', sectionLabel: '01', professorId: 'p5', roomId: 'r7', day: 2, startSlot: 10, duration: 5, locked: false, studentsExpected: 18 },
  { id: 'b6', subjectId: 's1', sectionLabel: '02', professorId: 'p1', roomId: 'r1', day: 3, startSlot: 2, duration: 4, locked: false, studentsExpected: 26 },
  { id: 'b7', subjectId: 's6', sectionLabel: '01', professorId: 'p2', roomId: 'r5', day: 4, startSlot: 6, duration: 4, locked: true, studentsExpected: 20 },
]
