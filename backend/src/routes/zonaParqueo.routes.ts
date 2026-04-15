import { Router } from 'express'
import {
  getAllZonasParqueo,
  getZonaParqueoById,
  createZonaParqueo,
  updateZonaParqueo,
  deleteZonaParqueo,
} from '../controllers/zonaParqueo.controller'

const router = Router()

router.get('/', getAllZonasParqueo)
router.get('/:id', getZonaParqueoById)
router.post('/', createZonaParqueo)
router.put('/:id', updateZonaParqueo)
router.delete('/:id', deleteZonaParqueo)

export default router
