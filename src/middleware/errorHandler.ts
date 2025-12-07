import { Request, Response, NextFunction } from 'express'

export default function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = err?.status || 500
  const message = err?.message || 'Internal server error'
  const errors = err?.errors || 'Unexpected error'
  res.status(status).json({ success: false, message, errors })
}

