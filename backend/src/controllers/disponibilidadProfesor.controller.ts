import { Request, Response } from 'express'
import { prisma } from '../db'

export const getAllDisponibilidades = async (req: Request, res: Response) => {
  try {
    const { profesorId } = req.query
    const items = await prisma.disponibilidadProfesor.findMany({
      where: profesorId ? { profesorId: String(profesorId) } : undefined,
      include: { profesor: true },
      orderBy: [{ dia: 'asc' }, { horaInicio: 'asc' }],
    })
    res.json(items)
  } catch (error) {
    console.error('Error al obtener disponibilidades:', error)
    res.status(500).json({ error: 'Error al obtener disponibilidades' })
  }
}

export const getDisponibilidadById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    const item = await prisma.disponibilidadProfesor.findUnique({
      where: { id },
      include: { profesor: true },
    })
    if (!item) {
      return res.status(404).json({ error: 'Disponibilidad no encontrada' })
    }
    res.json(item)
  } catch (error) {
    console.error('Error al obtener disponibilidad:', error)
    res.status(500).json({ error: 'Error al obtener disponibilidad' })
  }
}

export const createDisponibilidad = async (req: Request, res: Response) => {
  try {
    const { profesorId, dia, horaInicio, horaFin, esBloqueo, esDefinidoPorIA } =
      req.body
    const item = await prisma.disponibilidadProfesor.create({
      data: { profesorId, dia, horaInicio, horaFin, esBloqueo, esDefinidoPorIA },
    })
    res.status(201).json(item)
  } catch (error) {
    console.error('Error al crear disponibilidad:', error)
    res.status(500).json({ error: 'Error al crear disponibilidad' })
  }
}

export const updateDisponibilidad = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    const { dia, horaInicio, horaFin, esBloqueo, esDefinidoPorIA } = req.body
    const item = await prisma.disponibilidadProfesor.update({
      where: { id },
      data: { dia, horaInicio, horaFin, esBloqueo, esDefinidoPorIA },
    })
    res.json(item)
  } catch (error) {
    console.error('Error al actualizar disponibilidad:', error)
    res.status(500).json({ error: 'Error al actualizar disponibilidad' })
  }
}

export const deleteDisponibilidad = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    await prisma.disponibilidadProfesor.delete({ where: { id } })
    res.status(204).send()
  } catch (error) {
    console.error('Error al eliminar disponibilidad:', error)
    res.status(500).json({ error: 'Error al eliminar disponibilidad' })
  }
}
