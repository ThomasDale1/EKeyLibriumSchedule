import { Request, Response } from 'express'
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
    const carrera = await prisma.carrera.create({
      data: { nombre, codigo, descripcion, duracionCiclos, activa },
    })
    res.status(201).json(carrera)
  } catch (error) {
    console.error('Error al crear carrera:', error)
    res.status(500).json({ error: 'Error al crear carrera' })
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
  } catch (error) {
    console.error('Error al actualizar carrera:', error)
    res.status(500).json({ error: 'Error al actualizar carrera' })
  }
}

export const deleteCarrera = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    await prisma.carrera.delete({ where: { id } })
    res.status(204).send()
  } catch (error) {
    console.error('Error al eliminar carrera:', error)
    res.status(500).json({ error: 'Error al eliminar carrera' })
  }
}
