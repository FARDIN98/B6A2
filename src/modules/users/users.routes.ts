import { Router } from 'express'
import { authenticateToken, authorizeAdmin, authorizeAdminOrOwner } from '../../middleware/auth.middleware'
import { getUsers, updateUser, deleteUser } from './users.controller'

const router = Router()

router.get('/', authenticateToken, authorizeAdmin, getUsers)
router.put('/:userId', authenticateToken, authorizeAdminOrOwner, updateUser)
router.delete('/:userId', authenticateToken, authorizeAdmin, deleteUser)

export default router

