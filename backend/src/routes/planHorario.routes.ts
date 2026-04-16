import { Router } from 'express'
import {
  getAllPlanes,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  duplicatePlan,
} from '../controllers/planHorario.controller'

const router = Router()

router.get('/', getAllPlanes)
router.get('/:id', getPlanById)
router.post('/', createPlan)
router.put('/:id', updatePlan)
router.delete('/:id', deletePlan)
router.post('/:id/duplicate', duplicatePlan)

export default router
