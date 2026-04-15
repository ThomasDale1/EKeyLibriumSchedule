import { Request, Response } from 'express'
import { Prisma } from '../generated/prisma/client'
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

    // Validation
    if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
      return res.status(400).json({ error: 'El nombre del ciclo es requerido' })
    }
    if (!anio || typeof anio !== 'number' || anio < 1900) {
      return res.status(400).json({ error: 'El año debe ser un número válido' })
    }
    if (!numeroCiclo || typeof numeroCiclo !== 'number' || numeroCiclo < 1) {
      return res.status(400).json({ error: 'El número de ciclo debe ser positivo' })
    }
    if (!fechaInicio) {
      return res.status(400).json({ error: 'La fecha de inicio es requerida' })
    }
    if (!fechaFin) {
      return res.status(400).json({ error: 'La fecha de fin es requerida' })
    }

    const inicio = new Date(fechaInicio)
    const fin = new Date(fechaFin)
    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      return res.status(400).json({ error: 'Las fechas deben ser formatos válidos ISO 8601' })
    }

    const ciclo = await prisma.cicloAcademico.create({
      data: {
        nombre: nombre.trim(),
        anio,
        numeroCiclo,
        fechaInicio: inicio,
        fechaFin: fin,
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
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404).json({ error: 'Ciclo académico no encontrado' })
    } else {
      console.error('Error al actualizar ciclo:', error)
      res.status(500).json({ error: 'Error al actualizar ciclo' })
    }
  }
}

export const deleteCiclo = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    await prisma.cicloAcademico.delete({ where: { id } })
    res.status(204).send()
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404).json({ error: 'Ciclo académico no encontrado' })
    } else if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      res.status(409).json({ error: 'No se puede eliminar el ciclo porque tiene secciones, inscripciones u horarios asociados' })
    } else {
      console.error('Error al eliminar ciclo:', error)
      res.status(500).json({ error: 'Error al eliminar ciclo' })
    }
  }
}
