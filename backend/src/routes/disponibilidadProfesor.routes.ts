import { Router } from 'express'
import {
  getAllDisponibilidades,
  getDisponibilidadById,
  createDisponibilidad,
  updateDisponibilidad,
  deleteDisponibilidad,
} from '../controllers/disponibilidadProfesor.controller'

const router = Router()

router.get('/', getAllDisponibilidades)
router.get('/:id', getDisponibilidadById)
router.post('/', createDisponibilidad)
router.put('/:id', updateDisponibilidad)
router.delete('/:id', deleteDisponibilidad)

export default router
