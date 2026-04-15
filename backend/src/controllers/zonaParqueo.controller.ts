import { Request, Response } from 'express'
import { Prisma } from '../generated/prisma/client'
import { prisma } from '../db'

export const getAllZonasParqueo = async (req: Request, res: Response) => {
  try {
    const zonas = await prisma.zonaParqueo.findMany({
      orderBy: { codigo: 'asc' },
    })
    res.json(zonas)
  } catch (error) {
    console.error('Error al obtener zonas de parqueo:', error)
    res.status(500).json({ error: 'Error al obtener zonas de parqueo' })
  }
}

export const getZonaParqueoById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    const zona = await prisma.zonaParqueo.findUnique({
      where: { id },
      include: { registros: true },
    })
    if (!zona) {
      return res.status(404).json({ error: 'Zona de parqueo no encontrada' })
    }
    res.json(zona)
  } catch (error) {
    console.error('Error al obtener zona de parqueo:', error)
    res.status(500).json({ error: 'Error al obtener zona de parqueo' })
  }
}

export const createZonaParqueo = async (req: Request, res: Response) => {
  try {
    const { codigo, nombre, tipo, capacidadTotal, activo } = req.body

    // Validation
    if (!codigo || typeof codigo !== 'string' || codigo.trim() === '') {
      return res.status(400).json({ error: 'El código es requerido' })
    }
    if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
      return res.status(400).json({ error: 'El nombre es requerido' })
    }
    if (capacidadTotal && (typeof capacidadTotal !== 'number' || capacidadTotal < 1)) {
      return res.status(400).json({ error: 'La capacidad debe ser un número positivo' })
    }

    const zona = await prisma.zonaParqueo.create({
      data: {
        codigo: codigo.trim(),
        nombre: nombre.trim(),
        tipo,
        capacidadTotal,
        activo,
      },
    })
    res.status(201).json(zona)
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json({ error: 'Ya existe una zona con ese código' })
    } else {
      console.error('Error al crear zona de parqueo:', error)
      res.status(500).json({ error: 'Error al crear zona de parqueo' })
    }
  }
}

export const updateZonaParqueo = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    const { codigo, nombre, tipo, capacidadTotal, activo } = req.body
    const zona = await prisma.zonaParqueo.update({
      where: { id },
      data: { codigo, nombre, tipo, capacidadTotal, activo },
    })
    res.json(zona)
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404).json({ error: 'Zona de parqueo no encontrada' })
    } else if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json({ error: 'Ya existe otra zona con ese código' })
    } else {
      console.error('Error al actualizar zona de parqueo:', error)
      res.status(500).json({ error: 'Error al actualizar zona de parqueo' })
    }
  }
}

export const deleteZonaParqueo = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    await prisma.zonaParqueo.delete({ where: { id } })
    res.status(204).send()
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404).json({ error: 'Zona de parqueo no encontrada' })
    } else if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      res.status(409).json({ error: 'No se puede eliminar la zona porque tiene registros de parqueo asociados' })
    } else {
      console.error('Error al eliminar zona de parqueo:', error)
      res.status(500).json({ error: 'Error al eliminar zona de parqueo' })
    }
  }
}
