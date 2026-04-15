import { Router } from 'express'
import {
  getAllMateriasAprobadas,
  getMateriaAprobadaById,
  createMateriaAprobada,
  updateMateriaAprobada,
  deleteMateriaAprobada,
} from '../controllers/materiaAprobada.controller'

const router = Router()

router.get('/', getAllMateriasAprobadas)
router.get('/:id', getMateriaAprobadaById)
router.post('/', createMateriaAprobada)
router.put('/:id', updateMateriaAprobada)
router.delete('/:id', deleteMateriaAprobada)

export default router
