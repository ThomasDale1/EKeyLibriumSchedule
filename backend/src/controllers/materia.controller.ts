import { Request, Response } from 'express'
import { prisma } from '../db'

export const getAllMaterias = async (req: Request, res: Response) => {
  try {
    const { carreraId } = req.query
    const materias = await prisma.materia.findMany({
      where: carreraId ? { carreraId: String(carreraId) } : undefined,
      include: { carrera: true, prerequisitos: true },
      orderBy: { codigo: 'asc' },
    })
    res.json(materias)
  } catch (error) {
    console.error('Error al obtener materias:', error)
    res.status(500).json({ error: 'Error al obtener materias' })
  }
}

export const getMateriaById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    const materia = await prisma.materia.findUnique({
      where: { id },
      include: {
        carrera: true,
        prerequisitos: true,
        esPrerequisitoDe: true,
        secciones: true,
        competencias: { include: { profesor: true } },
      },
    })
    if (!materia) {
      return res.status(404).json({ error: 'Materia no encontrada' })
    }
    res.json(materia)
  } catch (error) {
    console.error('Error al obtener materia:', error)
    res.status(500).json({ error: 'Error al obtener materia' })
  }
}

export const createMateria = async (req: Request, res: Response) => {
  try {
    const {
      codigo,
      nombre,
      creditos,
      horasSemanales,
      tipoAula,
      descripcion,
      activa,
      carreraId,
      prerequisitosIds,
    } = req.body

    const materia = await prisma.materia.create({
      data: {
        codigo,
        nombre,
        creditos,
        horasSemanales,
        tipoAula,
        descripcion,
        activa,
        carreraId,
        prerequisitos: prerequisitosIds
          ? { connect: prerequisitosIds.map((pid: string) => ({ id: pid })) }
          : undefined,
      },
    })
    res.status(201).json(materia)
  } catch (error) {
    console.error('Error al crear materia:', error)
    res.status(500).json({ error: 'Error al crear materia' })
  }
}

export const updateMateria = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    const {
      codigo,
      nombre,
      creditos,
      horasSemanales,
      tipoAula,
      descripcion,
      activa,
      carreraId,
      prerequisitosIds,
    } = req.body

    const materia = await prisma.materia.update({
      where: { id },
      data: {
        codigo,
        nombre,
        creditos,
        horasSemanales,
        tipoAula,
        descripcion,
        activa,
        carreraId,
        prerequisitos: prerequisitosIds
          ? { set: prerequisitosIds.map((pid: string) => ({ id: pid })) }
          : undefined,
      },
    })
    res.json(materia)
  } catch (error) {
    console.error('Error al actualizar materia:', error)
    res.status(500).json({ error: 'Error al actualizar materia' })
  }
}

export const deleteMateria = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    await prisma.materia.delete({ where: { id } })
    res.status(204).send()
  } catch (error) {
    console.error('Error al eliminar materia:', error)
    res.status(500).json({ error: 'Error al eliminar materia' })
  }
}
