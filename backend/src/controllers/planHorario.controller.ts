import { Request, Response } from 'express'
import { Prisma } from '../generated/prisma/client'
import { prisma } from '../db'

export const getAllPlanes = async (req: Request, res: Response) => {
  try {
    const { cicloId, estado } = req.query
    const planes = await prisma.planHorario.findMany({
      where: {
        cicloId: cicloId ? String(cicloId) : undefined,
        estado: estado ? (String(estado) as any) : undefined,
      },
      orderBy: { actualizadoEn: 'desc' },
    })
    res.json(planes)
  } catch (error) {
    console.error('Error al obtener planes de horario:', error)
    res.status(500).json({ error: 'Error al obtener planes de horario' })
  }
}

export const getPlanById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    const plan = await prisma.planHorario.findUnique({
      where: { id },
      include: { ciclo: true },
    })
    if (!plan) {
      return res.status(404).json({ error: 'Plan de horario no encontrado' })
    }
    res.json(plan)
  } catch (error) {
    console.error('Error al obtener plan de horario:', error)
    res.status(500).json({ error: 'Error al obtener plan de horario' })
  }
}

export const createPlan = async (req: Request, res: Response) => {
  try {
    const { nombre, estado, bloques, notas, cicloId } = req.body
    const plan = await prisma.planHorario.create({
      data: {
        nombre,
        estado,
        bloques: bloques ?? [],
        notas,
        cicloId,
      },
    })
    res.status(201).json(plan)
  } catch (error) {
    console.error('Error al crear plan de horario:', error)
    res.status(500).json({ error: 'Error al crear plan de horario' })
  }
}

export const updatePlan = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    const { nombre, estado, bloques, notas, cicloId } = req.body
    const plan = await prisma.planHorario.update({
      where: { id },
      data: {
        nombre,
        estado,
        bloques,
        notas,
        cicloId,
      },
    })
    res.json(plan)
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404).json({ error: 'Plan de horario no encontrado' })
    } else if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      res.status(409).json({ error: 'El ciclo académico especificado no existe' })
    } else {
      console.error('Error al actualizar plan de horario:', error)
      res.status(500).json({ error: 'Error al actualizar plan de horario' })
    }
  }
}

export const deletePlan = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    await prisma.planHorario.delete({ where: { id } })
    res.status(204).send()
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404).json({ error: 'Plan de horario no encontrado' })
    } else {
      console.error('Error al eliminar plan de horario:', error)
      res.status(500).json({ error: 'Error al eliminar plan de horario' })
    }
  }
}

export const duplicatePlan = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    const original = await prisma.planHorario.findUnique({ where: { id } })
    if (!original) {
      return res.status(404).json({ error: 'Plan de horario no encontrado' })
    }
    const { nombre } = req.body
    const copy = await prisma.planHorario.create({
      data: {
        nombre: nombre ?? `${original.nombre} (copia)`,
        estado: 'BORRADOR',
        bloques: original.bloques ?? [],
        notas: original.notas,
        cicloId: original.cicloId,
      },
    })
    res.status(201).json(copy)
  } catch (error) {
    console.error('Error al duplicar plan de horario:', error)
    res.status(500).json({ error: 'Error al duplicar plan de horario' })
  }
}
