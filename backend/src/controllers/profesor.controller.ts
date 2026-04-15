import { Request, Response } from 'express'
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

    const profesor = await prisma.profesor.create({
      data: {
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
      },
    })
    res.status(201).json(profesor)
  } catch (error) {
    console.error('Error al crear profesor:', error)
    res.status(500).json({ error: 'Error al crear profesor' })
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
  } catch (error) {
    console.error('Error al actualizar profesor:', error)
    res.status(500).json({ error: 'Error al actualizar profesor' })
  }
}

export const deleteProfesor = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    await prisma.profesor.delete({ where: { id } })
    res.status(204).send()
  } catch (error) {
    console.error('Error al eliminar profesor:', error)
    res.status(500).json({ error: 'Error al eliminar profesor' })
  }
}
