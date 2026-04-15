import { Request, Response } from 'express'
import { prisma } from '../db'

export const getAllHorarios = async (req: Request, res: Response) => {
  try {
    const { seccionId, cicloId } = req.query
    const horarios = await prisma.horario.findMany({
      where: {
        seccionId: seccionId ? String(seccionId) : undefined,
        cicloId: cicloId ? String(cicloId) : undefined,
      },
      include: { seccion: true, ciclo: true },
      orderBy: [{ dia: 'asc' }, { horaInicio: 'asc' }],
    })
    res.json(horarios)
  } catch (error) {
    console.error('Error al obtener horarios:', error)
    res.status(500).json({ error: 'Error al obtener horarios' })
  }
}

export const getHorarioById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    const horario = await prisma.horario.findUnique({
      where: { id },
      include: { seccion: true, ciclo: true },
    })
    if (!horario) {
      return res.status(404).json({ error: 'Horario no encontrado' })
    }
    res.json(horario)
  } catch (error) {
    console.error('Error al obtener horario:', error)
    res.status(500).json({ error: 'Error al obtener horario' })
  }
}

export const createHorario = async (req: Request, res: Response) => {
  try {
    const { dia, horaInicio, horaFin, seccionId, cicloId } = req.body
    const horario = await prisma.horario.create({
      data: { dia, horaInicio, horaFin, seccionId, cicloId },
    })
    res.status(201).json(horario)
  } catch (error) {
    console.error('Error al crear horario:', error)
    res.status(500).json({ error: 'Error al crear horario' })
  }
}

export const updateHorario = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    const { dia, horaInicio, horaFin, seccionId, cicloId } = req.body
    const horario = await prisma.horario.update({
      where: { id },
      data: { dia, horaInicio, horaFin, seccionId, cicloId },
    })
    res.json(horario)
  } catch (error) {
    console.error('Error al actualizar horario:', error)
    res.status(500).json({ error: 'Error al actualizar horario' })
  }
}

export const deleteHorario = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    await prisma.horario.delete({ where: { id } })
    res.status(204).send()
  } catch (error) {
    console.error('Error al eliminar horario:', error)
    res.status(500).json({ error: 'Error al eliminar horario' })
  }
}
