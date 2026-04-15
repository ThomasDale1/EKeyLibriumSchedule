import { Router } from 'express'
import {
  getAllAulas,
  getAulaById,
  createAula,
  updateAula,
  deleteAula,
} from '../controllers/aula.controller'

const router = Router()

router.get('/', getAllAulas)
router.get('/:id', getAulaById)
router.post('/', createAula)
router.put('/:id', updateAula)
router.delete('/:id', deleteAula)

export default router
