import { Request, Response, NextFunction } from 'express'
import * as authService from './auth.service'

export async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, email, password, phone, role } = req.body

    if (!name || !email || !password || !phone) {
      return next({ status: 400, message: 'Missing required fields', errors: 'name, email, password, phone are required' })
    }

    if (typeof password !== 'string' || password.length < 6) {
      return next({ status: 400, message: 'Password too short', errors: 'Password must be at least 6 characters' })
    }

    const user = await authService.registerUser({
      name,
      email,
      password,
      phone,
      role,
    })

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: user,
    })
  } catch (err) {
    return next(err)
  }
}

export async function signin(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return next({ status: 400, message: 'Missing required fields', errors: 'email and password are required' })
    }

    const result = await authService.loginUser({ email, password })

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
    })
  } catch (err) {
    return next(err)
  }
}
