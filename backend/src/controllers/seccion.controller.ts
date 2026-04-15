import { Request, Response } from 'express'
import { prisma } from '../db'

export const getAllSecciones = async (req: Request, res: Response) => {
  try {
    const { cicloId, materiaId, profesorId } = req.query
    const secciones = await prisma.seccion.findMany({
      where: {
        cicloId: cicloId ? String(cicloId) : undefined,
        materiaId: materiaId ? String(materiaId) : undefined,
        profesorId: profesorId ? String(profesorId) : undefined,
      },
      include: { materia: true, profesor: true, aula: true, ciclo: true },
      orderBy: { codigo: 'asc' },
    })
    res.json(secciones)
  } catch (error) {
    console.error('Error al obtener secciones:', error)
    res.status(500).json({ error: 'Error al obtener secciones' })
  }
}

export const getSeccionById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    const seccion = await prisma.seccion.findUnique({
      where: { id },
      include: {
        materia: true,
        profesor: true,
        aula: true,
        ciclo: true,
        horarios: true,
        inscripciones: { include: { estudiante: true } },
      },
    })
    if (!seccion) {
      return res.status(404).json({ error: 'Sección no encontrada' })
    }
    res.json(seccion)
  } catch (error) {
    console.error('Error al obtener sección:', error)
    res.status(500).json({ error: 'Error al obtener sección' })
  }
}

export const createSeccion = async (req: Request, res: Response) => {
  try {
    const {
      codigo,
      capacidadMax,
      capacidadActual,
      estado,
      materiaId,
      profesorId,
      aulaId,
      cicloId,
    } = req.body

    const seccion = await prisma.seccion.create({
      data: {
        codigo,
        capacidadMax,
        capacidadActual,
        estado,
        materiaId,
        profesorId,
        aulaId,
        cicloId,
      },
    })
    res.status(201).json(seccion)
  } catch (error) {
    console.error('Error al crear sección:', error)
    res.status(500).json({ error: 'Error al crear sección' })
  }
}

export const updateSeccion = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    const {
      codigo,
      capacidadMax,
      capacidadActual,
      estado,
      materiaId,
      profesorId,
      aulaId,
      cicloId,
    } = req.body

    const seccion = await prisma.seccion.update({
      where: { id },
      data: {
        codigo,
        capacidadMax,
        capacidadActual,
        estado,
        materiaId,
        profesorId,
        aulaId,
        cicloId,
      },
    })
    res.json(seccion)
  } catch (error) {
    console.error('Error al actualizar sección:', error)
    res.status(500).json({ error: 'Error al actualizar sección' })
  }
}

export const deleteSeccion = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    await prisma.seccion.delete({ where: { id } })
    res.status(204).send()
  } catch (error) {
    console.error('Error al eliminar sección:', error)
    res.status(500).json({ error: 'Error al eliminar sección' })
  }
}
