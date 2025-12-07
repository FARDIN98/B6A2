import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../../config/database'
import { User } from '../../types/db'


type Role = 'admin' | 'customer'

interface SignupInput {
  name: string
  email: string
  password: string
  phone: string
  role?: Role
}

interface SigninInput {
  email: string
  password: string
}

export async function registerUser(input: SignupInput) {
  const email = String(input.email).toLowerCase()
  const role: Role = input.role ? (input.role as Role) : 'customer'

  if (role !== 'admin' && role !== 'customer') {
    throw { status: 400, message: 'Invalid role', errors: 'Role must be admin or customer' }
  }

  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email])
  if (existing.rows.length > 0) {
    throw { status: 400, message: 'Email already in use', errors: 'Duplicate email' }
  }

  const saltRounds = 10
  const hashed = await bcrypt.hash(input.password, saltRounds)

  const insert = await pool.query(
    `INSERT INTO users (name, email, password, phone, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, name, email, phone, role`,
    [input.name, email, hashed, input.phone, role]
  )

  return insert.rows[0] as Omit<User, 'password'>
}

export async function loginUser(input: SigninInput) {
  const email = String(input.email).toLowerCase()

  const res = await pool.query('SELECT id, name, email, phone, role, password FROM users WHERE email = $1', [email])
  if (res.rows.length === 0) {
    throw { status: 401, message: 'Invalid email or password', errors: 'Unauthorized' }
  }

  const row = res.rows[0] as User
  const ok = await bcrypt.compare(input.password, row.password)
  if (!ok) {
    throw { status: 401, message: 'Invalid email or password', errors: 'Unauthorized' }
  }

  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw { status: 500, message: 'Server configuration error', errors: 'Missing JWT_SECRET' }
  }

  const payload = { userId: row.id, email: row.email, role: row.role }
  const token = jwt.sign(payload, secret, { expiresIn: '7d' })

  const user = { id: row.id, name: row.name, email: row.email, phone: row.phone, role: row.role }
  return { token, user }
}
