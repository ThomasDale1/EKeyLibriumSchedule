import { Request, Response } from 'express'
import { prisma } from '../db'

export const getAllMateriasAprobadas = async (req: Request, res: Response) => {
  try {
    const { estudianteId } = req.query
    const items = await prisma.materiaAprobada.findMany({
      where: estudianteId ? { estudianteId: String(estudianteId) } : undefined,
      include: { estudiante: true },
    })
    res.json(items)
  } catch (error) {
    console.error('Error al obtener materias aprobadas:', error)
    res.status(500).json({ error: 'Error al obtener materias aprobadas' })
  }
}

export const getMateriaAprobadaById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    const item = await prisma.materiaAprobada.findUnique({
      where: { id },
      include: { estudiante: true },
    })
    if (!item) {
      return res.status(404).json({ error: 'Registro no encontrado' })
    }
    res.json(item)
  } catch (error) {
    console.error('Error al obtener materia aprobada:', error)
    res.status(500).json({ error: 'Error al obtener materia aprobada' })
  }
}

export const createMateriaAprobada = async (req: Request, res: Response) => {
  try {
    const { estudianteId, materiaId, nota, cicloAprobado } = req.body
    const item = await prisma.materiaAprobada.create({
      data: { estudianteId, materiaId, nota, cicloAprobado },
    })
    res.status(201).json(item)
  } catch (error) {
    console.error('Error al crear materia aprobada:', error)
    res.status(500).json({ error: 'Error al crear materia aprobada' })
  }
}

export const updateMateriaAprobada = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    const { nota, cicloAprobado } = req.body
    const item = await prisma.materiaAprobada.update({
      where: { id },
      data: { nota, cicloAprobado },
    })
    res.json(item)
  } catch (error) {
    console.error('Error al actualizar materia aprobada:', error)
    res.status(500).json({ error: 'Error al actualizar materia aprobada' })
  }
}

export const deleteMateriaAprobada = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    await prisma.materiaAprobada.delete({ where: { id } })
    res.status(204).send()
  } catch (error) {
    console.error('Error al eliminar materia aprobada:', error)
    res.status(500).json({ error: 'Error al eliminar materia aprobada' })
  }
}
