import { Request, Response } from 'express'
import { prisma } from '../db'

export const getAllCiclos = async (req: Request, res: Response) => {
  try {
    const ciclos = await prisma.cicloAcademico.findMany({
      orderBy: [{ anio: 'desc' }, { numeroCiclo: 'desc' }],
    })
    res.json(ciclos)
  } catch (error) {
    console.error('Error al obtener ciclos:', error)
    res.status(500).json({ error: 'Error al obtener ciclos' })
  }
}

export const getCicloById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    const ciclo = await prisma.cicloAcademico.findUnique({
      where: { id },
      include: { secciones: true, inscripciones: true, horarios: true },
    })
    if (!ciclo) {
      return res.status(404).json({ error: 'Ciclo no encontrado' })
    }
    res.json(ciclo)
  } catch (error) {
    console.error('Error al obtener ciclo:', error)
    res.status(500).json({ error: 'Error al obtener ciclo' })
  }
}

export const createCiclo = async (req: Request, res: Response) => {
  try {
    const { nombre, anio, numeroCiclo, fechaInicio, fechaFin, estado, activo } =
      req.body
    const ciclo = await prisma.cicloAcademico.create({
      data: {
        nombre,
        anio,
        numeroCiclo,
        fechaInicio: new Date(fechaInicio),
        fechaFin: new Date(fechaFin),
        estado,
        activo,
      },
    })
    res.status(201).json(ciclo)
  } catch (error) {
    console.error('Error al crear ciclo:', error)
    res.status(500).json({ error: 'Error al crear ciclo' })
  }
}

export const updateCiclo = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    const { nombre, anio, numeroCiclo, fechaInicio, fechaFin, estado, activo } =
      req.body
    const ciclo = await prisma.cicloAcademico.update({
      where: { id },
      data: {
        nombre,
        anio,
        numeroCiclo,
        fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
        fechaFin: fechaFin ? new Date(fechaFin) : undefined,
        estado,
        activo,
      },
    })
    res.json(ciclo)
  } catch (error) {
    console.error('Error al actualizar ciclo:', error)
    res.status(500).json({ error: 'Error al actualizar ciclo' })
  }
}

export const deleteCiclo = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    await prisma.cicloAcademico.delete({ where: { id } })
    res.status(204).send()
  } catch (error) {
    console.error('Error al eliminar ciclo:', error)
    res.status(500).json({ error: 'Error al eliminar ciclo' })
  }
}
