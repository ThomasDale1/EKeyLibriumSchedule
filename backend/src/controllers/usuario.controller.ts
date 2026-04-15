import { Request, Response } from 'express'
import { Prisma } from '../generated/prisma/client'
import type { RolUsuario } from '../generated/prisma/enums'
import { prisma } from '../db'

export const getAllUsuarios = async (req: Request, res: Response) => {
  try {
    const { rol } = req.query
    const usuarios = await prisma.usuario.findMany({
      where: rol ? { rol: rol as any } : undefined,
      orderBy: { apellido: 'asc' },
    })
    res.json(usuarios)
  } catch (error) {
    console.error('Error al obtener usuarios:', error)
    res.status(500).json({ error: 'Error al obtener usuarios' })
  }
}

export const getUsuarioById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    const usuario = await prisma.usuario.findUnique({
      where: { id },
    })
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }
    res.json(usuario)
  } catch (error) {
    console.error('Error al obtener usuario:', error)
    res.status(500).json({ error: 'Error al obtener usuario' })
  }
}

export const createUsuario = async (req: Request, res: Response) => {
  try {
    const { clerkUserId, email, nombre, apellido, rol, activo } = req.body

    // Validation
    if (!clerkUserId || typeof clerkUserId !== 'string') {
      return res.status(400).json({ error: 'El clerkUserId es requerido' })
    }
    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'El email debe ser válido' })
    }
    if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
      return res.status(400).json({ error: 'El nombre es requerido' })
    }
    if (!apellido || typeof apellido !== 'string' || apellido.trim() === '') {
      return res.status(400).json({ error: 'El apellido es requerido' })
    }
    if (!rol || typeof rol !== 'string') {
      return res.status(400).json({ error: 'El rol es requerido' })
    }

    const usuario = await prisma.usuario.create({
      data: {
        clerkUserId: clerkUserId.trim(),
        email: email.trim(),
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        rol: rol as RolUsuario,
        activo,
      },
    })
    res.status(201).json(usuario)
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json({ error: 'Ya existe un usuario con ese email o clerkUserId' })
    } else {
      console.error('Error al crear usuario:', error)
      res.status(500).json({ error: 'Error al crear usuario' })
    }
  }
}

export const updateUsuario = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    const { email, nombre, apellido, rol, activo } = req.body
    const usuario = await prisma.usuario.update({
      where: { id },
      data: { email, nombre, apellido, rol: rol as RolUsuario | undefined, activo },
    })
    res.json(usuario)
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404).json({ error: 'Usuario no encontrado' })
    } else if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      res.status(409).json({ error: 'Ya existe otro usuario con ese email' })
    } else {
      console.error('Error al actualizar usuario:', error)
      res.status(500).json({ error: 'Error al actualizar usuario' })
    }
  }
}

export const deleteUsuario = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    await prisma.usuario.delete({ where: { id } })
    res.status(204).send()
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404).json({ error: 'Usuario no encontrado' })
    } else if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      res.status(409).json({ error: 'No se puede eliminar el usuario porque tiene registros relacionados' })
    } else {
      console.error('Error al eliminar usuario:', error)
      res.status(500).json({ error: 'Error al eliminar usuario' })
    }
  }
}
