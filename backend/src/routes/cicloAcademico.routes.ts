import { Router } from 'express'
import {
  getAllCiclos,
  getCicloById,
  createCiclo,
  updateCiclo,
  deleteCiclo,
} from '../controllers/cicloAcademico.controller'

const router = Router()

router.get('/', getAllCiclos)
router.get('/:id', getCicloById)
router.post('/', createCiclo)
router.put('/:id', updateCiclo)
router.delete('/:id', deleteCiclo)

export default router
