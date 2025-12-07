import express from 'express'
import path from 'path'
import dotenv from 'dotenv'
import authRoutes from './modules/auth/auth.routes'
import vehicleRoutes from './modules/vehicles/vehicles.routes'
import userRoutes from './modules/users/users.routes'
import bookingRoutes from './modules/bookings/bookings.routes'
import errorHandler from './middleware/errorHandler'

dotenv.config({ path: path.join(process.cwd(), '.env') })

const app = express()

app.use(express.json())

app.get('/', (_req, res) => {
  res.send('Vehicle Rental System API')
})

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/vehicles', vehicleRoutes)
app.use('/api/v1/users', userRoutes)
app.use('/api/v1/bookings', bookingRoutes)

app.use(errorHandler)

export default app
