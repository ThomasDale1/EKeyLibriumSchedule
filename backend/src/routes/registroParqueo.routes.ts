import { Router } from 'express'
import {
  getAllRegistrosParqueo,
  getRegistroParqueoById,
  createRegistroParqueo,
  updateRegistroParqueo,
  deleteRegistroParqueo,
} from '../controllers/registroParqueo.controller'

const router = Router()

router.get('/', getAllRegistrosParqueo)
router.get('/:id', getRegistroParqueoById)
router.post('/', createRegistroParqueo)
router.put('/:id', updateRegistroParqueo)
router.delete('/:id', deleteRegistroParqueo)

export default router
