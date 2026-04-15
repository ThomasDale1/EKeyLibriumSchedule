import { Request, Response } from 'express'
import { Prisma } from '../generated/prisma/client'
import { prisma } from '../db'

export const getAllCarreras = async (req: Request, res: Response) => {
  try {
    const carreras = await prisma.carrera.findMany({
      include: { materias: true, estudiantes: true },
      orderBy: { nombre: 'asc' },
    })
    res.json(carreras)
  } catch (error) {
    console.error('Error al obtener carreras:', error)
    res.status(500).json({ error: 'Error al obtener carreras' })
  }
}

export const getCarreraById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    const carrera = await prisma.carrera.findUnique({
      where: { id },
      include: { materias: true, estudiantes: true },
    })
    if (!carrera) {
      return res.status(404).json({ error: 'Carrera no encontrada' })
    }
    res.json(carrera)
  } catch (error) {
    console.error('Error al obtener carrera:', error)
    res.status(500).json({ error: 'Error al obtener carrera' })
  }
}

export const createCarrera = async (req: Request, res: Response) => {
  try {
    const { nombre, codigo, descripcion, duracionCiclos, activa } = req.body

    // Validation
    if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
      return res.status(400).json({ error: 'El nombre de la carrera es requerido y debe ser texto' })
    }
    if (!codigo || typeof codigo !== 'string' || codigo.trim() === '') {
      return res.status(400).json({ error: 'El código de la carrera es requerido y debe ser texto' })
    }
    if (duracionCiclos && (typeof duracionCiclos !== 'number' || duracionCiclos < 1)) {
      return res.status(400).json({ error: 'La duración en ciclos debe ser un número positivo' })
    }

    const carrera = await prisma.carrera.create({
      data: { nombre: nombre.trim(), codigo: codigo.trim(), descripcion, duracionCiclos, activa },
    })
    res.status(201).json(carrera)
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json({ error: 'Ya existe una carrera con ese código' })
    } else {
      console.error('Error al crear carrera:', error)
      res.status(500).json({ error: 'Error al crear carrera' })
    }
  }
}

export const updateCarrera = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    const { nombre, codigo, descripcion, duracionCiclos, activa } = req.body
    const carrera = await prisma.carrera.update({
      where: { id },
      data: { nombre, codigo, descripcion, duracionCiclos, activa },
    })
    res.json(carrera)
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404).json({ error: 'Carrera no encontrada' })
    } else if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json({ error: 'Ya existe una carrera con ese código' })
    } else {
      console.error('Error al actualizar carrera:', error)
      res.status(500).json({ error: 'Error al actualizar carrera' })
    }
  }
}

export const deleteCarrera = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    await prisma.carrera.delete({ where: { id } })
    res.status(204).send()
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404).json({ error: 'Carrera no encontrada' })
    } else if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      res.status(409).json({ error: 'No se puede eliminar la carrera porque tiene estudiantes o materias asociadas' })
    } else {
      console.error('Error al eliminar carrera:', error)
      res.status(500).json({ error: 'Error al eliminar carrera' })
    }
  }
}
