import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = (req.headers.authorization as string) || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized - Token required/invalid', errors: 'Missing token' })
  }

  const secret = process.env.JWT_SECRET
  if (!secret) {
    return res.status(500).json({ success: false, message: 'Internal server error', errors: 'Missing JWT_SECRET' })
  }

  try {
    const decoded = jwt.verify(token, secret) as { userId: number; email: string; role: 'admin' | 'customer' }
    ;(req as any).user = decoded
    return next()
  } catch (_err) {
    return res.status(401).json({ success: false, message: 'Unauthorized - Token required/invalid', errors: 'Invalid token' })
  }
}

export function authorizeAdmin(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user
  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized - Token required/invalid', errors: 'Missing token' })
  }
  if (user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden - Admin access required', errors: 'Forbidden' })
  }
  return next()
}

export function authorizeAdminOrOwner(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user
  if (!user) {
    return res.status(401).json({ success: false, message: 'Unauthorized - Token required/invalid', errors: 'Missing token' })
  }
  const paramIdStr = req.params?.userId
  const paramId = paramIdStr ? parseInt(paramIdStr, 10) : NaN
  if (user.role === 'admin' || (!Number.isNaN(paramId) && user.userId === paramId)) {
    return next()
  }
  return res.status(403).json({ success: false, message: 'Forbidden - You can only update your own profile', errors: 'Forbidden' })
}
