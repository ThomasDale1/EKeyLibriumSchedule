import { Request, Response } from 'express'
import { Prisma } from '../generated/prisma/client'
import { prisma } from '../db'

export const getAllProfesores = async (req: Request, res: Response) => {
  try {
    const profesores = await prisma.profesor.findMany({
      orderBy: { apellido: 'asc' },
    })
    res.json(profesores)
  } catch (error) {
    console.error('Error al obtener profesores:', error)
    res.status(500).json({ error: 'Error al obtener profesores' })
  }
}

export const getProfesorById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    const profesor = await prisma.profesor.findUnique({
      where: { id },
      include: {
        disponibilidad: true,
        materias: { include: { materia: true } },
        secciones: true,
      },
    })
    if (!profesor) {
      return res.status(404).json({ error: 'Profesor no encontrado' })
    }
    res.json(profesor)
  } catch (error) {
    console.error('Error al obtener profesor:', error)
    res.status(500).json({ error: 'Error al obtener profesor' })
  }
}

export const createProfesor = async (req: Request, res: Response) => {
  try {
    const {
      clerkUserId,
      codigo,
      nombre,
      apellido,
      email,
      telefono,
      tipoContrato,
      costoHora,
      maxHorasDia,
      maxHorasSemana,
      modoHorario,
      activo,
    } = req.body

    // Validation
    if (!clerkUserId || typeof clerkUserId !== 'string') {
      return res.status(400).json({ error: 'El clerkUserId es requerido' })
    }
    if (!codigo || typeof codigo !== 'string') {
      return res.status(400).json({ error: 'El código del profesor es requerido' })
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

    const profesor = await prisma.profesor.create({
      data: {
        clerkUserId: clerkUserId.trim(),
        codigo: codigo.trim(),
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        email: email.trim(),
        telefono,
        tipoContrato,
        costoHora,
        maxHorasDia,
        maxHorasSemana,
        modoHorario,
        activo,
      },
    })
    res.status(201).json(profesor)
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json({ error: 'Ya existe un profesor con ese código, email o clerkUserId' })
    } else {
      console.error('Error al crear profesor:', error)
      res.status(500).json({ error: 'Error al crear profesor' })
    }
  }
}

export const updateProfesor = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    const {
      codigo,
      nombre,
      apellido,
      email,
      telefono,
      tipoContrato,
      costoHora,
      maxHorasDia,
      maxHorasSemana,
      modoHorario,
      activo,
    } = req.body

    const profesor = await prisma.profesor.update({
      where: { id },
      data: {
        codigo,
        nombre,
        apellido,
        email,
        telefono,
        tipoContrato,
        costoHora,
        maxHorasDia,
        maxHorasSemana,
        modoHorario,
        activo,
      },
    })
    res.json(profesor)
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404).json({ error: 'Profesor no encontrado' })
    } else if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json({ error: 'Ya existe otro profesor con ese código o email' })
    } else {
      console.error('Error al actualizar profesor:', error)
      res.status(500).json({ error: 'Error al actualizar profesor' })
    }
  }
}

export const deleteProfesor = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    await prisma.profesor.delete({ where: { id } })
    res.status(204).send()
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404).json({ error: 'Profesor no encontrado' })
    } else if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      res.status(409).json({ error: 'No se puede eliminar el profesor porque tiene secciones, disponibilidades o competencias asociadas' })
    } else {
      console.error('Error al eliminar profesor:', error)
      res.status(500).json({ error: 'Error al eliminar profesor' })
    }
  }
}
