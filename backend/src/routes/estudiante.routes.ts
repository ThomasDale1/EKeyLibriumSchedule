import { Router } from 'express'
import {
  getAllEstudiantes,
  getEstudianteById,
  createEstudiante,
  updateEstudiante,
  deleteEstudiante,
} from '../controllers/estudiante.controller'

const router = Router()

router.get('/', getAllEstudiantes)
router.get('/:id', getEstudianteById)
router.post('/', createEstudiante)
router.put('/:id', updateEstudiante)
router.delete('/:id', deleteEstudiante)

export default router
