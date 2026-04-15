import { Router } from 'express'
import {
  getAllInscripciones,
  getInscripcionById,
  createInscripcion,
  updateInscripcion,
  deleteInscripcion,
} from '../controllers/inscripcion.controller'

const router = Router()

router.get('/', getAllInscripciones)
router.get('/:id', getInscripcionById)
router.post('/', createInscripcion)
router.put('/:id', updateInscripcion)
router.delete('/:id', deleteInscripcion)

export default router
