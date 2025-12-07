export interface User {
  id: number
  name: string
  email: string
  password: string
  phone: string
  role: 'admin' | 'customer'
}

export interface Vehicle {
  id: number
  vehicle_name: string
  type: 'car' | 'bike' | 'van' | 'SUV'
  registration_number: string
  daily_rent_price: string
  availability_status: 'available' | 'booked'
}

export interface Booking {
  id: number
  customer_id: number
  vehicle_id: number
  rent_start_date: string
  rent_end_date: string
  total_price: string
  status: 'active' | 'cancelled' | 'returned'
}

