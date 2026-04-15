import { Request, Response } from 'express'
import { prisma } from '../db'

export const getAllEstudiantes = async (req: Request, res: Response) => {
  try {
    const { carreraId, estado } = req.query
    const estudiantes = await prisma.estudiante.findMany({
      where: {
        carreraId: carreraId ? String(carreraId) : undefined,
        estado: estado ? (estado as any) : undefined,
      },
      include: { carrera: true },
      orderBy: { apellido: 'asc' },
    })
    res.json(estudiantes)
  } catch (error) {
    console.error('Error al obtener estudiantes:', error)
    res.status(500).json({ error: 'Error al obtener estudiantes' })
  }
}

export const getEstudianteById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    const estudiante = await prisma.estudiante.findUnique({
      where: { id },
      include: {
        carrera: true,
        inscripciones: { include: { seccion: true } },
        materiasAprobadas: true,
      },
    })
    if (!estudiante) {
      return res.status(404).json({ error: 'Estudiante no encontrado' })
    }
    res.json(estudiante)
  } catch (error) {
    console.error('Error al obtener estudiante:', error)
    res.status(500).json({ error: 'Error al obtener estudiante' })
  }
}

export const createEstudiante = async (req: Request, res: Response) => {
  try {
    const {
      clerkUserId,
      codigoEstudiante,
      nombre,
      apellido,
      email,
      telefono,
      carnetDUI,
      cicloActual,
      promedioGPA,
      estado,
      tieneVehiculo,
      carreraId,
    } = req.body

    const estudiante = await prisma.estudiante.create({
      data: {
        clerkUserId,
        codigoEstudiante,
        nombre,
        apellido,
        email,
        telefono,
        carnetDUI,
        cicloActual,
        promedioGPA,
        estado,
        tieneVehiculo,
        carreraId,
      },
    })
    res.status(201).json(estudiante)
  } catch (error) {
    console.error('Error al crear estudiante:', error)
    res.status(500).json({ error: 'Error al crear estudiante' })
  }
}

export const updateEstudiante = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    const {
      codigoEstudiante,
      nombre,
      apellido,
      email,
      telefono,
      carnetDUI,
      cicloActual,
      promedioGPA,
      estado,
      tieneVehiculo,
      carreraId,
    } = req.body

    const estudiante = await prisma.estudiante.update({
      where: { id },
      data: {
        codigoEstudiante,
        nombre,
        apellido,
        email,
        telefono,
        carnetDUI,
        cicloActual,
        promedioGPA,
        estado,
        tieneVehiculo,
        carreraId,
      },
    })
    res.json(estudiante)
  } catch (error) {
    console.error('Error al actualizar estudiante:', error)
    res.status(500).json({ error: 'Error al actualizar estudiante' })
  }
}

export const deleteEstudiante = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    await prisma.estudiante.delete({ where: { id } })
    res.status(204).send()
  } catch (error) {
    console.error('Error al eliminar estudiante:', error)
    res.status(500).json({ error: 'Error al eliminar estudiante' })
  }
}
