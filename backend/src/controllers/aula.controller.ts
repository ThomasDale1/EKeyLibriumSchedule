import { Request, Response } from 'express'
import { Prisma } from '../generated/prisma/client'
import { prisma } from '../db'

export const getAllAulas = async (req: Request, res: Response) => {
  try {
    const aulas = await prisma.aula.findMany({
      orderBy: { codigo: 'asc' },
    })
    res.json(aulas)
  } catch (error) {
    console.error('Error al obtener aulas:', error)
    res.status(500).json({ error: 'Error al obtener aulas' })
  }
}

export const getAulaById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    const aula = await prisma.aula.findUnique({
      where: { id },
      include: { secciones: true },
    })
    if (!aula) {
      return res.status(404).json({ error: 'Aula no encontrada' })
    }
    res.json(aula)
  } catch (error) {
    console.error('Error al obtener aula:', error)
    res.status(500).json({ error: 'Error al obtener aula' })
  }
}

export const createAula = async (req: Request, res: Response) => {
  try {
    const {
      codigo,
      nombre,
      capacidad,
      tipo,
      edificio,
      piso,
      tieneProyector,
      tieneAC,
      tieneInternet,
      activa,
    } = req.body

    const aula = await prisma.aula.create({
      data: {
        codigo,
        nombre,
        capacidad,
        tipo,
        edificio,
        piso,
        tieneProyector,
        tieneAC,
        tieneInternet,
        activa,
      },
    })
    res.status(201).json(aula)
  } catch (error) {
    console.error('Error al crear aula:', error)
    res.status(500).json({ error: 'Error al crear aula' })
  }
}

export const updateAula = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    const {
      codigo,
      nombre,
      capacidad,
      tipo,
      edificio,
      piso,
      tieneProyector,
      tieneAC,
      tieneInternet,
      activa,
    } = req.body

    const aula = await prisma.aula.update({
      where: { id },
      data: {
        codigo,
        nombre,
        capacidad,
        tipo,
        edificio,
        piso,
        tieneProyector,
        tieneAC,
        tieneInternet,
        activa,
      },
    })
    res.json(aula)
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404).json({ error: 'Aula no encontrada' })
    } else {
      console.error('Error al actualizar aula:', error)
      res.status(500).json({ error: 'Error al actualizar aula' })
    }
  }
}

export const deleteAula = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    await prisma.aula.delete({ where: { id } })
    res.status(204).send()
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404).json({ error: 'Aula no encontrada' })
    } else if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      res.status(409).json({ error: 'No se puede eliminar el aula porque tiene registros relacionados' })
    } else {
      console.error('Error al eliminar aula:', error)
      res.status(500).json({ error: 'Error al eliminar aula' })
    }
  }
}
