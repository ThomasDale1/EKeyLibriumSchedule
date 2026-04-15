import { Router } from 'express'
import { getMe, promoteToAdmin } from '../controllers/auth.controller'

const router = Router()

router.get('/me', getMe)
router.post('/promote-admin', promoteToAdmin)

export default router
