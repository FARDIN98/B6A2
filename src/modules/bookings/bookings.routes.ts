import { Router } from 'express'
import { authenticateToken } from '../../middleware/auth.middleware'
import { createBooking, getBookings, updateBooking } from './bookings.controller'

const router = Router()

router.post('/', authenticateToken, createBooking)
router.get('/', authenticateToken, getBookings)
router.put('/:bookingId', authenticateToken, updateBooking)

export default router

