import { Request, Response } from 'express'
import { clerkClient, getAuth } from '@clerk/express'
import { prisma } from '../db'
import { Prisma } from '../generated/prisma/client'
import type { RolUsuario } from '../generated/prisma/enums'

// Emails that are automatically promoted to ADMIN when created
const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
)

// Validate that admin emails are configured if they're required
if (!process.env.ADMIN_EMAILS) {
  console.warn('Warning: ADMIN_EMAILS environment variable is not set. Only the first user will be promoted to admin.')
}

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
        clerkUser.emailAddresses[0]?.emailAddress
      
      // Handle missing email: explicit error
      if (!email) {
        return res.status(400).json({ error: 'Usuario debe tener un email registrado en Clerk' })
      }
      
      const nombre = clerkUser.firstName ?? 'Usuario'
      const apellido = clerkUser.lastName ?? '—'

      // Use transaction with serializable isolation level to prevent race condition
      const MAX_RETRIES = 3
      let lastError: unknown
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          usuario = await prisma.$transaction(
            async (tx) => {
              // Check if any users exist
              const total = await tx.usuario.count()
              const esAdmin = total === 0 || ADMIN_EMAILS.has(email.toLowerCase())
              const rol: RolUsuario = esAdmin ? ('ADMIN' as RolUsuario) : ('ESTUDIANTE' as RolUsuario)

              // Create user (atomic within transaction)
              return await tx.usuario.create({
                data: {
                  clerkUserId: userId,
                  email,
                  nombre,
                  apellido,
                  rol,
                  activo: true,
                },
              })
            },
            {
              isolationLevel: 'Serializable',
            }
          )
          break // Success, exit retry loop
        } catch (error: unknown) {
          lastError = error
          // Check if it's a serialization failure
          if ((error as { code?: string })?.code === 'P2034') {
            // Serialization failure, retry after short delay
            if (attempt < MAX_RETRIES - 1) {
              await new Promise((resolve) => setTimeout(resolve, 100 * Math.pow(2, attempt)))
              continue
            }
          } else if ((error as { code?: string })?.code === 'P2002') {
            // Unique constraint - user already created by concurrent request
            usuario = await prisma.usuario.findUnique({ where: { clerkUserId: userId } })
            if (!usuario) throw error
            break
          } else {
            throw error
          }
        }
      }
      if (!usuario) throw lastError ?? new Error('Authentication failed: no usuario and no error captured')
    }

    res.json(usuario)
  } catch (error) {
    console.error('Error en getMe:', error)
    res.status(500).json({ error: 'Error al obtener el usuario actual' })
  }
}

export const promoteToAdmin = async (req: Request, res: Response) => {
  try {
    const { userId: callerId } = getAuth(req)
    if (!callerId) return res.status(401).json({ error: 'No autenticado' })

    // Get target userId from request body
    const { userId: targetUserId } = req.body as { userId?: string }
    if (!targetUserId) {
      return res.status(400).json({ error: 'userId en body es requerido' })
    }

    // Fetch caller info and verify is admin
    const caller = await prisma.usuario.findUnique({ where: { clerkUserId: callerId } })
    if (!caller || caller.rol !== 'ADMIN') {
      return res.status(403).json({ error: 'Solo admins pueden promover usuarios' })
    }

    // Promote target user to admin
    try {
      const usuario = await prisma.usuario.update({
        where: { clerkUserId: targetUserId },
        data: { rol: 'ADMIN' as RolUsuario },
      })
      res.json(usuario)
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return res.status(404).json({ error: 'Usuario no encontrado' })
      }
      throw error
    }
  } catch (error) {
    console.error('Error en promoteToAdmin:', error)
    res.status(500).json({ error: 'Error al promover usuario' })
  }
}
