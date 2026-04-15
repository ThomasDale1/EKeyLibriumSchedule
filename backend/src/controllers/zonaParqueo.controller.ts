import { Request, Response } from 'express'
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
    const zona = await prisma.zonaParqueo.create({
      data: { codigo, nombre, tipo, capacidadTotal, activo },
    })
    res.status(201).json(zona)
  } catch (error) {
    console.error('Error al crear zona de parqueo:', error)
    res.status(500).json({ error: 'Error al crear zona de parqueo' })
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
  } catch (error) {
    console.error('Error al actualizar zona de parqueo:', error)
    res.status(500).json({ error: 'Error al actualizar zona de parqueo' })
  }
}

export const deleteZonaParqueo = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    await prisma.zonaParqueo.delete({ where: { id } })
    res.status(204).send()
  } catch (error) {
    console.error('Error al eliminar zona de parqueo:', error)
    res.status(500).json({ error: 'Error al eliminar zona de parqueo' })
  }
}
