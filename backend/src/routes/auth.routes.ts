import { Router } from 'express'
import { getMe, promoteToAdmin } from '../controllers/auth.controller'
import { requireAuth, requireAdmin } from '../middleware/auth'

const router = Router()

router.get('/me', requireAuth, getMe)
router.post('/promote-admin', requireAuth, requireAdmin, promoteToAdmin)

export default router
