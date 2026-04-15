import { Router } from 'express'
import {
  getAllProfesorMaterias,
  getProfesorMateriaById,
  createProfesorMateria,
  updateProfesorMateria,
  deleteProfesorMateria,
} from '../controllers/profesorMateria.controller'

const router = Router()

router.get('/', getAllProfesorMaterias)
router.get('/:id', getProfesorMateriaById)
router.post('/', createProfesorMateria)
router.put('/:id', updateProfesorMateria)
router.delete('/:id', deleteProfesorMateria)

export default router
