import { Request, Response } from 'express'
import { Prisma } from '../generated/prisma/client'
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

    // Validation
    if (!estudianteId || typeof estudianteId !== 'string') {
      return res.status(400).json({ error: 'El estudianteId es requerido' })
    }
    if (!materiaId || typeof materiaId !== 'string') {
      return res.status(400).json({ error: 'El materiaId es requerido' })
    }
    if (nota !== undefined && (typeof nota !== 'number' || nota < 0 || nota > 10)) {
      return res.status(400).json({ error: 'La nota debe estar entre 0 y 10' })
    }

    const item = await prisma.materiaAprobada.create({
      data: { estudianteId, materiaId, nota, cicloAprobado },
    })
    res.status(201).json(item)
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      res.status(409).json({ error: 'El estudiante o materia especificado no existe' })
    } else {
      console.error('Error al crear materia aprobada:', error)
      res.status(500).json({ error: 'Error al crear materia aprobada' })
    }
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
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404).json({ error: 'Registro no encontrado' })
    } else {
      console.error('Error al actualizar materia aprobada:', error)
      res.status(500).json({ error: 'Error al actualizar materia aprobada' })
    }
  }
}

export const deleteMateriaAprobada = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    await prisma.materiaAprobada.delete({ where: { id } })
    res.status(204).send()
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404).json({ error: 'Materia aprobada no encontrada' })
    } else if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      res.status(409).json({ error: 'No se puede eliminar el registro porque tiene relaciones activas' })
    } else {
      console.error('Error al eliminar materia aprobada:', error)
      res.status(500).json({ error: 'Error al eliminar materia aprobada' })
    }
  }
}
