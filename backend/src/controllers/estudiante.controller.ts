import { Request, Response } from 'express'
import { Prisma } from '../generated/prisma/client'
import { prisma } from '../db'

export const getAllEstudiantes = async (req: Request, res: Response) => {
  try {
    const { carreraId, estado } = req.query
    const estudiantes = await prisma.estudiante.findMany({
      where: {
        carreraId: carreraId ? String(carreraId) : undefined,
        estado: estado ? (estado as any) : undefined,
      },
      include: { carrera: true, materiasAprobadas: true },
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
      mensualidad,
      estado,
      tieneVehiculo,
      carreraId,
    } = req.body

    // Validation
    if (!clerkUserId || typeof clerkUserId !== 'string') {
      return res.status(400).json({ error: 'El clerkUserId es requerido' })
    }
    if (!codigoEstudiante || typeof codigoEstudiante !== 'string') {
      return res.status(400).json({ error: 'El código de estudiante es requerido' })
    }
    if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
      return res.status(400).json({ error: 'El nombre es requerido' })
    }
    if (!apellido || typeof apellido !== 'string' || apellido.trim() === '') {
      return res.status(400).json({ error: 'El apellido es requerido' })
    }
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'El email debe ser válido' })
    }
    if (!carreraId || typeof carreraId !== 'string') {
      return res.status(400).json({ error: 'La carreraId es requerida' })
    }

    const estudiante = await prisma.estudiante.create({
      data: {
        clerkUserId: clerkUserId.trim(),
        codigoEstudiante: codigoEstudiante.trim(),
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: email.trim(),
        telefono,
        carnetDUI,
        cicloActual,
        promedioGPA,
        mensualidad,
        estado,
        tieneVehiculo,
        carreraId,
      },
    })
    res.status(201).json(estudiante)
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json({ error: 'El email o clerkUserId especificado ya está registrado' })
    } else if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      res.status(409).json({ error: 'La carrera especificada no existe' })
    } else {
      console.error('Error al crear estudiante:', error)
      res.status(500).json({ error: 'Error al crear estudiante' })
    }
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
      mensualidad,
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
        mensualidad,
        estado,
        tieneVehiculo,
        carreraId,
      },
    })
    res.json(estudiante)
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404).json({ error: 'Estudiante no encontrado' })
    } else if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      res.status(409).json({ error: 'La carrera especificada no existe' })
    } else if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json({ error: 'Ya existe otro estudiante con ese código, email o clerkUserId' })
    } else {
      console.error('Error al actualizar estudiante:', error)
      res.status(500).json({ error: 'Error al actualizar estudiante' })
    }
  }
}

export const deleteEstudiante = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    await prisma.estudiante.delete({ where: { id } })
    res.status(204).send()
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404).json({ error: 'Estudiante no encontrado' })
    } else if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      res.status(409).json({ error: 'No se puede eliminar el estudiante porque tiene registros relacionados' })
    } else {
      console.error('Error al eliminar estudiante:', error)
      res.status(500).json({ error: 'Error al eliminar estudiante' })
    }
  }
}
