import pool from '../../config/database'

type Role = 'admin' | 'customer'

interface UpdateUserInput {
  name?: string
  email?: string
  phone?: string
  role?: Role
}

export async function getUsers() {
  const res = await pool.query('SELECT id, name, email, phone, role FROM users ORDER BY id ASC')
  return res.rows
}

export async function updateUser(userId: number, input: UpdateUserInput, requesterRole: Role) {
  const exists = await pool.query('SELECT id FROM users WHERE id = $1', [userId])
  if (exists.rows.length === 0) {
    return null
  }

  if (input.role !== undefined && requesterRole !== 'admin') {
    throw { status: 400, message: 'Customers cannot change their role', errors: 'Role change not allowed' }
  }

  if (input.email !== undefined) {
    const dup = await pool.query('SELECT id FROM users WHERE email = $1 AND id <> $2', [input.email, userId])
    if (dup.rows.length > 0) {
      throw { status: 400, message: 'Validation error', errors: 'Email already in use' }
    }
  }

  const fields: string[] = []
  const values: any[] = []
  let idx = 1

  if (input.name !== undefined) {
    fields.push(`name = $${idx++}`)
    values.push(input.name)
  }
  if (input.email !== undefined) {
    fields.push(`email = $${idx++}`)
    values.push(input.email)
  }
  if (input.phone !== undefined) {
    fields.push(`phone = $${idx++}`)
    values.push(input.phone)
  }
  if (input.role !== undefined) {
    fields.push(`role = $${idx++}`)
    values.push(input.role)
  }

  if (fields.length === 0) {
    const res0 = await pool.query('SELECT id, name, email, phone, role FROM users WHERE id = $1', [userId])
    return res0.rows[0]
  }

  values.push(userId)
  const res = await pool.query(
    `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, name, email, phone, role`,
    values
  )
  return res.rows[0]
}

export async function deleteUser(userId: number) {
  const exists = await pool.query('SELECT id FROM users WHERE id = $1', [userId])
  if (exists.rows.length === 0) {
    throw { status: 404, message: 'User not found', errors: 'Not found' }
  }

  const active = await pool.query("SELECT COUNT(*)::int AS count FROM bookings WHERE customer_id = $1 AND status = 'active'", [userId])
  const count = Number(active.rows[0]?.count || 0)
  if (count > 0) {
    throw { status: 400, message: 'Cannot delete user with active bookings', errors: 'Active bookings exist' }
  }

  await pool.query('DELETE FROM users WHERE id = $1', [userId])
}

