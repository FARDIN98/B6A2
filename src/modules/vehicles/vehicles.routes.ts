import { Router } from 'express'
import { authenticateToken, authorizeAdmin } from '../../middleware/auth.middleware'
import { createVehicle, getVehicles, getVehicleById, updateVehicle, deleteVehicle } from './vehicles.controller'

const router = Router()

router.post('/', authenticateToken, authorizeAdmin, createVehicle)
router.get('/', getVehicles)
router.get('/:vehicleId', getVehicleById)
router.put('/:vehicleId', authenticateToken, authorizeAdmin, updateVehicle)
router.delete('/:vehicleId', authenticateToken, authorizeAdmin, deleteVehicle)

export default router

