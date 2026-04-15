import { Router } from 'express'
import {
  getAllProfesores,
  getProfesorById,
  createProfesor,
  updateProfesor,
  deleteProfesor,
} from '../controllers/profesor.controller'

const router = Router()

router.get('/', getAllProfesores)
router.get('/:id', getProfesorById)
router.post('/', createProfesor)
router.put('/:id', updateProfesor)
router.delete('/:id', deleteProfesor)

export default router
