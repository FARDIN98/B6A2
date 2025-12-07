import { Request, Response, NextFunction } from 'express'
import * as service from './bookings.service'

function parseDate(value: string) {
  return new Date(value)
}

export async function createBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const body = req.body || {}
    const required = ['customer_id', 'vehicle_id', 'rent_start_date', 'rent_end_date']
    for (const f of required) {
      if (body[f] === undefined) {
        return next({ status: 400, message: 'Validation error', errors: `Missing field: ${f}` })
      }
    }

    const start = parseDate(String(body.rent_start_date))
    const end = parseDate(String(body.rent_end_date))
    if (!(start instanceof Date) || !(end instanceof Date) || isNaN(start.getTime()) || isNaN(end.getTime())) {
      return next({ status: 400, message: 'Validation error', errors: 'Invalid date format' })
    }
    if (end <= start) {
      return next({ status: 400, message: 'Validation error', errors: 'End date must be after start date' })
    }

    const requester = (req as any).user as { userId: number; email: string; role: 'admin' | 'customer' }
    const data = await service.createBooking({
      customer_id: Number(body.customer_id),
      vehicle_id: Number(body.vehicle_id),
      rent_start_date: String(body.rent_start_date),
      rent_end_date: String(body.rent_end_date),
    }, requester)

    return res.status(201).json({ success: true, message: 'Booking created successfully', data })
  } catch (err) {
    return next(err)
  }
}

export async function getBookings(req: Request, res: Response, next: NextFunction) {
  try {
    const requester = (req as any).user as { userId: number; email: string; role: 'admin' | 'customer' }
    if (requester.role === 'admin') {
      const list = await service.getBookingsForAdmin()
      return res.status(200).json({ success: true, message: 'Bookings retrieved successfully', data: list })
    } else {
      const list = await service.getBookingsForCustomer(requester.userId)
      return res.status(200).json({ success: true, message: 'Your bookings retrieved successfully', data: list })
    }
  } catch (err) {
    return next(err)
  }
}

export async function updateBooking(req: Request, res: Response, next: NextFunction) {
  try {
    const bookingId = Number(req.params.bookingId)
    if (!Number.isInteger(bookingId) || bookingId <= 0) {
      return next({ status: 400, message: 'Validation error', errors: 'bookingId must be a valid integer' })
    }

    const body = req.body || {}
    const status = String(body.status || '')
    if (status !== 'cancelled' && status !== 'returned') {
      return next({ status: 400, message: "Invalid status. Use 'cancelled' or 'returned'", errors: "Invalid status. Use 'cancelled' or 'returned'" })
    }

    const requester = (req as any).user as { userId: number; email: string; role: 'admin' | 'customer' }
    const result = await service.updateBooking(bookingId, status, requester)

    if (status === 'cancelled') {
      return res.status(200).json({ success: true, message: 'Booking cancelled successfully', data: result })
    }
    return res.status(200).json({ success: true, message: 'Booking marked as returned. Vehicle is now available', data: result })
  } catch (err) {
    return next(err)
  }
}
