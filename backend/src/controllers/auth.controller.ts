import { Request, Response } from 'express'
import { clerkClient, getAuth } from '@clerk/express'
import { prisma } from '../db'
import type { RolUsuario } from '../generated/prisma/enums'

// Emails que se promueven automáticamente a ADMIN al crearse
const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS ?? 'dalethomas1212@gmail.com')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
)

export const getMe = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req)
    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' })
    }

    let usuario = await prisma.usuario.findUnique({ where: { clerkUserId: userId } })

    if (!usuario) {
      // Primera vez: creamos el registro espejo en nuestra DB
      const clerkUser = await clerkClient.users.getUser(userId)
      const email =
        clerkUser.primaryEmailAddress?.emailAddress ??
        clerkUser.emailAddresses[0]?.emailAddress ??
        ''
      const nombre = clerkUser.firstName ?? 'Usuario'
      const apellido = clerkUser.lastName ?? '—'

      // Si no hay ningún usuario aún, el primero es admin. También los emails en ADMIN_EMAILS.
      const total = await prisma.usuario.count()
      const esAdmin = total === 0 || ADMIN_EMAILS.has(email.toLowerCase())
      const rol: RolUsuario = esAdmin ? ('ADMIN' as RolUsuario) : ('ESTUDIANTE' as RolUsuario)

      usuario = await prisma.usuario.create({
        data: {
          clerkUserId: userId,
          email,
          nombre,
          apellido,
          rol,
          activo: true,
        },
      })
    }

    res.json(usuario)
  } catch (error) {
    console.error('Error en getMe:', error)
    res.status(500).json({ error: 'Error al obtener el usuario actual' })
  }
}

export const promoteToAdmin = async (req: Request, res: Response) => {
  try {
    const { userId } = getAuth(req)
    if (!userId) return res.status(401).json({ error: 'No autenticado' })

    const usuario = await prisma.usuario.update({
      where: { clerkUserId: userId },
      data: { rol: 'ADMIN' as RolUsuario },
    })
    res.json(usuario)
  } catch (error) {
    console.error('Error en promoteToAdmin:', error)
    res.status(500).json({ error: 'Error al promover usuario' })
  }
}
