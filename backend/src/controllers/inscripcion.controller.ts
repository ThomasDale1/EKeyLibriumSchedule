import { Request, Response } from 'express'
import { prisma } from '../db'

export const getAllInscripciones = async (req: Request, res: Response) => {
  try {
    const { estudianteId, seccionId, cicloId, estado } = req.query
    const inscripciones = await prisma.inscripcion.findMany({
      where: {
        estudianteId: estudianteId ? String(estudianteId) : undefined,
        seccionId: seccionId ? String(seccionId) : undefined,
        cicloId: cicloId ? String(cicloId) : undefined,
        estado: estado ? (estado as any) : undefined,
      },
      include: { estudiante: true, seccion: true, ciclo: true },
    })
    res.json(inscripciones)
  } catch (error) {
    console.error('Error al obtener inscripciones:', error)
    res.status(500).json({ error: 'Error al obtener inscripciones' })
  }
}

export const getInscripcionById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    const inscripcion = await prisma.inscripcion.findUnique({
      where: { id },
      include: {
        estudiante: true,
        seccion: { include: { materia: true, profesor: true } },
        ciclo: true,
      },
    })
    if (!inscripcion) {
      return res.status(404).json({ error: 'Inscripción no encontrada' })
    }
    res.json(inscripcion)
  } catch (error) {
    console.error('Error al obtener inscripción:', error)
    res.status(500).json({ error: 'Error al obtener inscripción' })
  }
}

export const createInscripcion = async (req: Request, res: Response) => {
  try {
    const {
      estudianteId,
      seccionId,
      cicloId,
      estado,
      posicionEspera,
      notaFinal,
    } = req.body

    const inscripcion = await prisma.inscripcion.create({
      data: {
        estudianteId,
        seccionId,
        cicloId,
        estado,
        posicionEspera,
        notaFinal,
      },
    })
    res.status(201).json(inscripcion)
  } catch (error) {
    console.error('Error al crear inscripción:', error)
    res.status(500).json({ error: 'Error al crear inscripción' })
  }
}

export const updateInscripcion = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    const { estado, posicionEspera, notaFinal } = req.body
    const inscripcion = await prisma.inscripcion.update({
      where: { id },
      data: { estado, posicionEspera, notaFinal },
    })
    res.json(inscripcion)
  } catch (error) {
    console.error('Error al actualizar inscripción:', error)
    res.status(500).json({ error: 'Error al actualizar inscripción' })
  }
}

export const deleteInscripcion = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    await prisma.inscripcion.delete({ where: { id } })
    res.status(204).send()
  } catch (error) {
    console.error('Error al eliminar inscripción:', error)
    res.status(500).json({ error: 'Error al eliminar inscripción' })
  }
}
