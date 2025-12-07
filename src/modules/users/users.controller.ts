import { Request, Response, NextFunction } from 'express'
import * as service from './users.service'

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function getUsers(_req: Request, res: Response, next: NextFunction) {
  try {
    const list = await service.getUsers()
    return res.status(200).json({ success: true, message: 'Users retrieved successfully', data: list })
  } catch (err) {
    return next(err)
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.userId)
    if (!Number.isInteger(id) || id <= 0) {
      return next({ status: 400, message: 'Validation error', errors: 'userId must be a valid integer' })
    }

    const requester = (req as any).user as { userId: number; email: string; role: 'admin' | 'customer' }
    const body = req.body || {}

    if (requester.role === 'customer' && body.role !== undefined) {
      return next({ status: 400, message: 'Customers cannot change their role', errors: 'Role change not allowed' })
    }

    if (body.email !== undefined) {
      if (typeof body.email !== 'string' || !isValidEmail(body.email)) {
        return next({ status: 400, message: 'Validation error', errors: 'Invalid email format' })
      }
      body.email = String(body.email).toLowerCase()
    }

    const updated = await service.updateUser(id, body, requester.role)
    if (!updated) {
      return res.status(404).json({ success: false, message: 'User not found' })
    }
    return res.status(200).json({ success: true, message: 'User updated successfully', data: updated })
  } catch (err) {
    return next(err)
  }
}

export async function deleteUser(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.userId)
    if (!Number.isInteger(id) || id <= 0) {
      return next({ status: 400, message: 'Validation error', errors: 'userId must be a valid integer' })
    }
    await service.deleteUser(id)
    return res.status(200).json({ success: true, message: 'User deleted successfully' })
  } catch (err) {
    return next(err)
  }
}

