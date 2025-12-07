import pool from '../../config/database'

type VehicleType = 'car' | 'bike' | 'van' | 'SUV'
type Availability = 'available' | 'booked'

interface CreateVehicleInput {
  vehicle_name: string
  type: VehicleType
  registration_number: string
  daily_rent_price: number
  availability_status: Availability
}

interface UpdateVehicleInput {
  vehicle_name?: string
  type?: VehicleType
  registration_number?: string
  daily_rent_price?: number
  availability_status?: Availability
}

function isValidType(v: any): v is VehicleType {
  return v === 'car' || v === 'bike' || v === 'van' || v === 'SUV'
}

function isValidAvailability(v: any): v is Availability {
  return v === 'available' || v === 'booked'
}

export async function createVehicle(input: CreateVehicleInput) {
  if (!isValidType(input.type)) {
    throw { status: 400, message: 'Validation error', errors: 'Invalid vehicle type' }
  }
  if (!isValidAvailability(input.availability_status)) {
    throw { status: 400, message: 'Validation error', errors: 'Invalid availability status' }
  }
  if (typeof input.daily_rent_price !== 'number' || input.daily_rent_price <= 0) {
    throw { status: 400, message: 'Validation error', errors: 'daily_rent_price must be > 0' }
  }

  const dup = await pool.query('SELECT id FROM vehicles WHERE registration_number = $1', [input.registration_number])
  if (dup.rows.length > 0) {
    throw { status: 400, message: 'Validation error', errors: 'Duplicate registration_number' }
  }

  const res = await pool.query(
    `INSERT INTO vehicles (vehicle_name, type, registration_number, daily_rent_price, availability_status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, vehicle_name, type, registration_number, daily_rent_price, availability_status`,
    [input.vehicle_name, input.type, input.registration_number, input.daily_rent_price, input.availability_status]
  )
  return res.rows[0]
}

export async function getVehicles() {
  const res = await pool.query('SELECT id, vehicle_name, type, registration_number, daily_rent_price, availability_status FROM vehicles ORDER BY id ASC')
  return res.rows
}

export async function getVehicleById(id: number) {
  const res = await pool.query('SELECT id, vehicle_name, type, registration_number, daily_rent_price, availability_status FROM vehicles WHERE id = $1', [id])
  return res.rows[0]
}

export async function updateVehicle(id: number, input: UpdateVehicleInput) {
  const exists = await pool.query('SELECT id FROM vehicles WHERE id = $1', [id])
  if (exists.rows.length === 0) {
    return null
  }

  const fields: string[] = []
  const values: any[] = []
  let idx = 1

  if (input.vehicle_name !== undefined) {
    fields.push(`vehicle_name = $${idx++}`)
    values.push(input.vehicle_name)
  }
  if (input.type !== undefined) {
    if (!isValidType(input.type)) {
      throw { status: 400, message: 'Validation error', errors: 'Invalid vehicle type' }
    }
    fields.push(`type = $${idx++}`)
    values.push(input.type)
  }
  if (input.registration_number !== undefined) {
    const dup = await pool.query('SELECT id FROM vehicles WHERE registration_number = $1 AND id <> $2', [input.registration_number, id])
    if (dup.rows.length > 0) {
      throw { status: 400, message: 'Validation error', errors: 'Duplicate registration_number' }
    }
    fields.push(`registration_number = $${idx++}`)
    values.push(input.registration_number)
  }
  if (input.daily_rent_price !== undefined) {
    if (typeof input.daily_rent_price !== 'number' || input.daily_rent_price <= 0) {
      throw { status: 400, message: 'Validation error', errors: 'daily_rent_price must be > 0' }
    }
    fields.push(`daily_rent_price = $${idx++}`)
    values.push(input.daily_rent_price)
  }
  if (input.availability_status !== undefined) {
    if (!isValidAvailability(input.availability_status)) {
      throw { status: 400, message: 'Validation error', errors: 'Invalid availability status' }
    }
    fields.push(`availability_status = $${idx++}`)
    values.push(input.availability_status)
  }

  if (fields.length === 0) {
    const res0 = await pool.query('SELECT id, vehicle_name, type, registration_number, daily_rent_price, availability_status FROM vehicles WHERE id = $1', [id])
    return res0.rows[0]
  }

  values.push(id)
  const res = await pool.query(
    `UPDATE vehicles SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, vehicle_name, type, registration_number, daily_rent_price, availability_status`,
    values
  )
  return res.rows[0]
}

export async function deleteVehicle(id: number) {
  const exists = await pool.query('SELECT id FROM vehicles WHERE id = $1', [id])
  if (exists.rows.length === 0) {
    throw { status: 404, message: 'Vehicle not found', errors: 'Not found' }
  }

  const active = await pool.query('SELECT id FROM bookings WHERE vehicle_id = $1 AND status = $2 LIMIT 1', [id, 'active'])
  if (active.rows.length > 0) {
    throw { status: 400, message: 'Cannot delete vehicle with active bookings', errors: 'Active bookings exist' }
  }

  await pool.query('DELETE FROM vehicles WHERE id = $1', [id])
}

