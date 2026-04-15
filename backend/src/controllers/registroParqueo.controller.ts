import { Request, Response } from 'express'
import { prisma } from '../db'

export const getAllRegistrosParqueo = async (req: Request, res: Response) => {
  try {
    const { zonaId } = req.query
    const registros = await prisma.registroParqueo.findMany({
      where: zonaId ? { zonaId: String(zonaId) } : undefined,
      include: { zona: true },
      orderBy: { fecha: 'desc' },
    })
    res.json(registros)
  } catch (error) {
    console.error('Error al obtener registros de parqueo:', error)
    res.status(500).json({ error: 'Error al obtener registros de parqueo' })
  }
}

export const getRegistroParqueoById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    const registro = await prisma.registroParqueo.findUnique({
      where: { id },
      include: { zona: true },
    })
    if (!registro) {
      return res.status(404).json({ error: 'Registro no encontrado' })
    }
    res.json(registro)
  } catch (error) {
    console.error('Error al obtener registro de parqueo:', error)
    res.status(500).json({ error: 'Error al obtener registro de parqueo' })
  }
}

export const createRegistroParqueo = async (req: Request, res: Response) => {
  try {
    const { fecha, ocupacionMax, ocupacionProm, zonaId } = req.body
    const registro = await prisma.registroParqueo.create({
      data: {
        fecha: new Date(fecha),
        ocupacionMax,
        ocupacionProm,
        zonaId,
      },
    })
    res.status(201).json(registro)
  } catch (error) {
    console.error('Error al crear registro de parqueo:', error)
    res.status(500).json({ error: 'Error al crear registro de parqueo' })
  }
}

export const updateRegistroParqueo = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    const { fecha, ocupacionMax, ocupacionProm, zonaId } = req.body
    const registro = await prisma.registroParqueo.update({
      where: { id },
      data: {
        fecha: fecha ? new Date(fecha) : undefined,
        ocupacionMax,
        ocupacionProm,
        zonaId,
      },
    })
    res.json(registro)
  } catch (error) {
    console.error('Error al actualizar registro de parqueo:', error)
    res.status(500).json({ error: 'Error al actualizar registro de parqueo' })
  }
}

export const deleteRegistroParqueo = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    await prisma.registroParqueo.delete({ where: { id } })
    res.status(204).send()
  } catch (error) {
    console.error('Error al eliminar registro de parqueo:', error)
    res.status(500).json({ error: 'Error al eliminar registro de parqueo' })
  }
}
