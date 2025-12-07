import pool from '../../config/database'

type Role = 'admin' | 'customer'

interface CreateInput {
  customer_id: number
  vehicle_id: number
  rent_start_date: string
  rent_end_date: string
}

function daysBetween(startISO: string, endISO: string) {
  const start = new Date(startISO)
  const end = new Date(endISO)
  const msPerDay = 24 * 60 * 60 * 1000
  const diff = end.getTime() - start.getTime()
  return Math.ceil(diff / msPerDay)
}

export async function createBooking(input: CreateInput, requester: { userId: number; role: Role }) {
  if (requester.role === 'customer' && Number(input.customer_id) !== requester.userId) {
    throw { status: 403, message: 'Forbidden - You can only manage your own bookings', errors: 'Forbidden' }
  }

  const vres = await pool.query('SELECT id, vehicle_name, daily_rent_price, availability_status FROM vehicles WHERE id = $1', [input.vehicle_id])
  if (vres.rows.length === 0) {
    throw { status: 404, message: 'Vehicle not found', errors: 'Not found' }
  }
  const vehicle = vres.rows[0]
  if (vehicle.availability_status !== 'available') {
    throw { status: 400, message: 'Vehicle not available', errors: 'Vehicle not available' }
  }

  const days = daysBetween(input.rent_start_date, input.rent_end_date)
  if (days <= 0) {
    throw { status: 400, message: 'Validation error', errors: 'End date must be after start date' }
  }

  const pricePerDay = Number(vehicle.daily_rent_price)
  const total = Number((days * pricePerDay).toFixed(2))

  const insert = await pool.query(
    `INSERT INTO bookings (customer_id, vehicle_id, rent_start_date, rent_end_date, total_price, status)
     VALUES ($1, $2, $3, $4, $5, 'active')
     RETURNING id, customer_id, vehicle_id, rent_start_date, rent_end_date, total_price, status`,
    [input.customer_id, input.vehicle_id, input.rent_start_date, input.rent_end_date, total]
  )

  await pool.query("UPDATE vehicles SET availability_status = 'booked' WHERE id = $1", [input.vehicle_id])

  const row = insert.rows[0]
  return {
    ...row,
    vehicle: { vehicle_name: vehicle.vehicle_name, daily_rent_price: pricePerDay },
  }
}

export async function getBookingsForAdmin() {
  const res = await pool.query(
    `SELECT b.id, b.customer_id, b.vehicle_id, b.rent_start_date, b.rent_end_date, b.total_price, b.status,
            u.name AS customer_name, u.email AS customer_email,
            v.vehicle_name, v.registration_number
     FROM bookings b
     JOIN users u ON b.customer_id = u.id
     JOIN vehicles v ON b.vehicle_id = v.id
     ORDER BY b.id DESC`
  )
  return res.rows.map((r: any) => ({
    id: r.id,
    customer_id: r.customer_id,
    vehicle_id: r.vehicle_id,
    rent_start_date: r.rent_start_date,
    rent_end_date: r.rent_end_date,
    total_price: Number(r.total_price),
    status: r.status,
    customer: { name: r.customer_name, email: r.customer_email },
    vehicle: { vehicle_name: r.vehicle_name, registration_number: r.registration_number },
  }))
}

export async function getBookingsForCustomer(userId: number) {
  const res = await pool.query(
    `SELECT b.id, b.vehicle_id, b.rent_start_date, b.rent_end_date, b.total_price, b.status,
            v.vehicle_name, v.registration_number, v.type
     FROM bookings b
     JOIN vehicles v ON b.vehicle_id = v.id
     WHERE b.customer_id = $1
     ORDER BY b.id DESC`,
    [userId]
  )
  return res.rows.map((r: any) => ({
    id: r.id,
    vehicle_id: r.vehicle_id,
    rent_start_date: r.rent_start_date,
    rent_end_date: r.rent_end_date,
    total_price: Number(r.total_price),
    status: r.status,
    vehicle: { vehicle_name: r.vehicle_name, registration_number: r.registration_number, type: r.type },
  }))
}

export async function updateBooking(bookingId: number, status: 'cancelled' | 'returned', requester: { userId: number; role: Role }) {
  const res = await pool.query(
    'SELECT id, customer_id, vehicle_id, rent_start_date, rent_end_date, total_price, status FROM bookings WHERE id = $1',
    [bookingId]
  )
  if (res.rows.length === 0) {
    throw { status: 404, message: 'Booking not found', errors: 'Not found' }
  }
  const booking = res.rows[0]

  if (requester.role === 'customer') {
    if (status === 'returned') {
      throw { status: 400, message: 'Only admins can mark bookings as returned', errors: 'Invalid action' }
    }
    if (Number(booking.customer_id) !== requester.userId) {
      throw { status: 403, message: 'Forbidden - You can only manage your own bookings', errors: 'Forbidden' }
    }
    if (booking.status !== 'active') {
      throw { status: 400, message: 'Cannot cancel booking that has started or already completed', errors: 'Invalid action' }
    }
    const today = new Date()
    const start = new Date(booking.rent_start_date)
    if (!(start > today)) {
      throw { status: 400, message: 'Cannot cancel booking that has started or already completed', errors: 'Invalid action' }
    }
    const upd = await pool.query(
      `UPDATE bookings SET status = 'cancelled' WHERE id = $1
       RETURNING id, customer_id, vehicle_id, rent_start_date, rent_end_date, total_price, status`,
      [bookingId]
    )
    await pool.query("UPDATE vehicles SET availability_status = 'available' WHERE id = $1", [booking.vehicle_id])
    return upd.rows[0]
  }

  // Admin path
  const upd = await pool.query(
    `UPDATE bookings SET status = 'returned' WHERE id = $1
     RETURNING id, customer_id, vehicle_id, rent_start_date, rent_end_date, total_price, status`,
    [bookingId]
  )
  await pool.query("UPDATE vehicles SET availability_status = 'available' WHERE id = $1", [booking.vehicle_id])
  const row = upd.rows[0]
  return { ...row, vehicle: { availability_status: 'available' } }
}
