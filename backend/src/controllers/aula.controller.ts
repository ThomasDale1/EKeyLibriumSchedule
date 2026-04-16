import { Request, Response } from 'express'
import { Prisma } from '../generated/prisma/client'
import { prisma } from '../db'
import { z } from 'zod'

// Validation schema for createAula
const createAulaSchema = z.object({
  codigo: z.string().min(1, 'Código es requerido'),
  nombre: z.string().min(1, 'Nombre es requerido'),
  capacidad: z.coerce.number().int({ message: 'Capacidad debe ser un número entero' }).min(1, 'Capacidad debe ser mayor a 0'),
  tipo: z.enum(['TEORIA', 'LABORATORIO_COMPUTO', 'LABORATORIO_CIENCIAS', 'AUDITORIO'], { message: 'Tipo de aula no válido' }),
  edificio: z.string().min(1, 'Edificio es requerido'),
  piso: z.coerce.number().int({ message: 'Piso debe ser un número entero' }),
  tieneProyector: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const normalized = val.trim().toLowerCase()
        if (normalized === 'false' || normalized === '0' || normalized === '') return false
        if (normalized === 'true' || normalized === '1') return true
      }
      return val
    },
    z.boolean()
  ),
  tieneAC: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const normalized = val.trim().toLowerCase()
        if (normalized === 'false' || normalized === '0' || normalized === '') return false
        if (normalized === 'true' || normalized === '1') return true
      }
      return val
    },
    z.boolean()
  ),
  tieneInternet: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const normalized = val.trim().toLowerCase()
        if (normalized === 'false' || normalized === '0' || normalized === '') return false
        if (normalized === 'true' || normalized === '1') return true
      }
      return val
    },
    z.boolean()
  ),
  activa: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const normalized = val.trim().toLowerCase()
        if (normalized === 'false' || normalized === '0' || normalized === '') return false
        if (normalized === 'true' || normalized === '1') return true
      }
      return val
    },
    z.boolean()
  ),
})

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
    // Validate input
    const validationResult = createAulaSchema.safeParse(req.body)
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validación fallida',
        details: validationResult.error.errors.map((e: z.ZodIssue) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      })
    }

    const validatedData = validationResult.data as Prisma.AulaCreateInput

    const aula = await prisma.aula.create({
      data: validatedData,
    })
    res.status(201).json(aula)
  } catch (error) {
    // Handle Prisma unique constraint error
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = (error.meta?.target as string[] | undefined)?.[0] ?? 'único'
      return res.status(409).json({
        error: `Ya existe un aula con este ${target}`,
        details: { field: target },
      })
    }
    console.error('Error al crear aula:', error)
    res.status(500).json({ error: 'Error al crear aula' })
  }
}

// Validation schema for updateAula (partial fields)
const updateAulaSchema = createAulaSchema.partial()

export const updateAula = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)

    // Validate input
    const validationResult = updateAulaSchema.safeParse(req.body)
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validación fallida',
        details: validationResult.error.errors.map((e: z.ZodIssue) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      })
    }

    const validatedData = validationResult.data as Prisma.AulaUpdateInput

    const aula = await prisma.aula.update({
      where: { id },
      data: validatedData,
    })
    res.json(aula)
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Aula no encontrada' })
      } else if (error.code === 'P2002') {
        const target = (error.meta?.target as string[] | undefined)?.[0] ?? 'único'
        return res.status(409).json({
          error: `Ya existe un aula con este ${target}`,
          details: { field: target },
        })
      }
    }
    console.error('Error al actualizar aula:', error)
    res.status(500).json({ error: 'Error al actualizar aula' })
  }
}

export const deleteAula = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    await prisma.aula.delete({ where: { id } })
    res.status(204).send()
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Aula no encontrada' })
      } else if (error.code === 'P2003') {
        return res.status(409).json({ error: 'No se puede eliminar el aula porque tiene registros relacionados' })
      }
    }
    console.error('Error al eliminar aula:', error)
    res.status(500).json({ error: 'Error al eliminar aula' })
  }
}
