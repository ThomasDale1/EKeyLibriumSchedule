import { Request, Response } from 'express'
import { prisma } from '../db'

export const getAllProfesorMaterias = async (req: Request, res: Response) => {
  try {
    const { profesorId, materiaId } = req.query
    const items = await prisma.profesorMateria.findMany({
      where: {
        profesorId: profesorId ? String(profesorId) : undefined,
        materiaId: materiaId ? String(materiaId) : undefined,
      },
      include: { profesor: true, materia: true },
    })
    res.json(items)
  } catch (error) {
    console.error('Error al obtener competencias:', error)
    res.status(500).json({ error: 'Error al obtener competencias' })
  }
}

export const getProfesorMateriaById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    const item = await prisma.profesorMateria.findUnique({
      where: { id },
      include: { profesor: true, materia: true },
    })
    if (!item) {
      return res.status(404).json({ error: 'Competencia no encontrada' })
    }
    res.json(item)
  } catch (error) {
    console.error('Error al obtener competencia:', error)
    res.status(500).json({ error: 'Error al obtener competencia' })
  }
}

export const createProfesorMateria = async (req: Request, res: Response) => {
  try {
    const { profesorId, materiaId, nivelDominio } = req.body
    const item = await prisma.profesorMateria.create({
      data: { profesorId, materiaId, nivelDominio },
    })
    res.status(201).json(item)
  } catch (error) {
    console.error('Error al crear competencia:', error)
    res.status(500).json({ error: 'Error al crear competencia' })
  }
}

export const updateProfesorMateria = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    const { nivelDominio } = req.body
    const item = await prisma.profesorMateria.update({
      where: { id },
      data: { nivelDominio },
    })
    res.json(item)
  } catch (error) {
    console.error('Error al actualizar competencia:', error)
    res.status(500).json({ error: 'Error al actualizar competencia' })
  }
}

export const deleteProfesorMateria = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    await prisma.profesorMateria.delete({ where: { id } })
    res.status(204).send()
  } catch (error) {
    console.error('Error al eliminar competencia:', error)
    res.status(500).json({ error: 'Error al eliminar competencia' })
  }
}
