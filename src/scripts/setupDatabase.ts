import pool from '../config/database'

async function setupDatabase() {
  
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        role VARCHAR(20) DEFAULT 'customer' NOT NULL,
        CONSTRAINT role_check CHECK (role IN ('admin', 'customer'))
      )
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id SERIAL PRIMARY KEY,
        vehicle_name VARCHAR(255) NOT NULL,
        type VARCHAR(20) NOT NULL,
        registration_number VARCHAR(50) UNIQUE NOT NULL,
        daily_rent_price DECIMAL(10, 2) NOT NULL,
        availability_status VARCHAR(20) DEFAULT 'available' NOT NULL,
        CONSTRAINT vehicle_type_check CHECK (type IN ('car', 'bike', 'van', 'SUV')),
        CONSTRAINT rent_price_positive CHECK (daily_rent_price > 0),
        CONSTRAINT availability_status_check CHECK (availability_status IN ('available', 'booked'))
      )
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
        rent_start_date DATE NOT NULL,
        rent_end_date DATE NOT NULL,
        total_price DECIMAL(10, 2) NOT NULL,
        status VARCHAR(20) DEFAULT 'active' NOT NULL,
        CONSTRAINT booking_price_positive CHECK (total_price > 0),
        CONSTRAINT booking_status_check CHECK (status IN ('active', 'cancelled', 'returned')),
        CONSTRAINT rent_dates_check CHECK (rent_end_date > rent_start_date)
      )
    `)

    await pool.query(`ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_customer_id_fkey`)
    await pool.query(`ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_vehicle_id_fkey`)
    await pool.query(`ALTER TABLE bookings ADD CONSTRAINT bookings_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE`)
    await pool.query(`ALTER TABLE bookings ADD CONSTRAINT bookings_vehicle_id_fkey FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE`)

  } catch (err) {
    console.error('Database setup failed', err)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

setupDatabase()
