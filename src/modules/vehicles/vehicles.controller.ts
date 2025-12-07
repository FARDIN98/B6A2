import { Request, Response, NextFunction } from 'express'
import * as service from './vehicles.service'

export async function createVehicle(req: Request, res: Response, next: NextFunction) {
  try {
    const { vehicle_name, type, registration_number, daily_rent_price, availability_status } = req.body
    if (!vehicle_name || !type || !registration_number || daily_rent_price === undefined || !availability_status) {
      return next({ status: 400, message: 'Validation error', errors: 'All fields are required' })
    }
    const vehicle = await service.createVehicle({ vehicle_name, type, registration_number, daily_rent_price, availability_status })
    return res.status(201).json({ success: true, message: 'Vehicle created successfully', data: vehicle })
  } catch (err) {
    return next(err)
  }
}

export async function getVehicles(_req: Request, res: Response, next: NextFunction) {
  try {
    const list = await service.getVehicles()
    if (list.length === 0) {
      return res.status(200).json({ success: true, message: 'No vehicles found', data: [] })
    }
    return res.status(200).json({ success: true, message: 'Vehicles retrieved successfully', data: list })
  } catch (err) {
    return next(err)
  }
}

export async function getVehicleById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.vehicleId)
    if (!Number.isInteger(id) || id <= 0) {
      return next({ status: 400, message: 'Validation error', errors: 'vehicleId must be a valid integer' })
    }
    const vehicle = await service.getVehicleById(id)
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' })
    }
    return res.status(200).json({ success: true, message: 'Vehicle retrieved successfully', data: vehicle })
  } catch (err) {
    return next(err)
  }
}

export async function updateVehicle(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.vehicleId)
    if (!Number.isInteger(id) || id <= 0) {
      return next({ status: 400, message: 'Validation error', errors: 'vehicleId must be a valid integer' })
    }
    const updated = await service.updateVehicle(id, req.body)
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' })
    }
    return res.status(200).json({ success: true, message: 'Vehicle updated successfully', data: updated })
  } catch (err) {
    return next(err)
  }
}

export async function deleteVehicle(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.vehicleId)
    if (!Number.isInteger(id) || id <= 0) {
      return next({ status: 400, message: 'Validation error', errors: 'vehicleId must be a valid integer' })
    }
    await service.deleteVehicle(id)
    return res.status(200).json({ success: true, message: 'Vehicle deleted successfully' })
  } catch (err) {
    return next(err)
  }
}

