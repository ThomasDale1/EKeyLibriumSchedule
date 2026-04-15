import { Request, Response, NextFunction } from 'express'
import { clerkClient, getAuth } from '@clerk/express'
import { prisma } from '../db'

// Este middleware verifica que el usuario esté logueado
// Se usará en todas las rutas protegidas
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = getAuth(req)

    if (!userId) {
      return res.status(401).json({
        error: 'No autorizado',
        message: 'Debes iniciar sesión para acceder',
      })
    }

    // Busca el usuario en nuestra base de datos
    const usuario = await prisma.usuario.findUnique({
      where: { clerkUserId: userId },
    })

    if (!usuario || !usuario.activo) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Tu cuenta no está activa en el sistema',
      })
    }

    // Agrega el usuario al request para usarlo en los controllers
    ;(req as any).usuario = usuario
    next()
  } catch (error) {
    console.error('Error en middleware de auth:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// Middleware para verificar que el usuario es Admin
export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await requireAuth(req, res, async () => {
    const usuario = (req as any).usuario
    if (usuario.rol !== 'ADMIN') {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Necesitas permisos de administrador',
      })
    }
    next()
  })
}

// Middleware para verificar que el usuario es Profesor o Admin
export const requireProfesorOAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await requireAuth(req, res, async () => {
    const usuario = (req as any).usuario
    if (!['ADMIN', 'PROFESOR'].includes(usuario.rol)) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Necesitas permisos de profesor o administrador',
      })
    }
    next()
  })
}