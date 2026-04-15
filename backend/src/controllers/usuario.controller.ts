import { Request, Response } from 'express'
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
    const usuario = await prisma.usuario.create({
      data: { clerkUserId, email, nombre, apellido, rol, activo },
    })
    res.status(201).json(usuario)
  } catch (error) {
    console.error('Error al crear usuario:', error)
    res.status(500).json({ error: 'Error al crear usuario' })
  }
}

export const updateUsuario = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    const { email, nombre, apellido, rol, activo } = req.body
    const usuario = await prisma.usuario.update({
      where: { id },
      data: { email, nombre, apellido, rol, activo },
    })
    res.json(usuario)
  } catch (error) {
    console.error('Error al actualizar usuario:', error)
    res.status(500).json({ error: 'Error al actualizar usuario' })
  }
}

export const deleteUsuario = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id)
    await prisma.usuario.delete({ where: { id } })
    res.status(204).send()
  } catch (error) {
    console.error('Error al eliminar usuario:', error)
    res.status(500).json({ error: 'Error al eliminar usuario' })
  }
}
