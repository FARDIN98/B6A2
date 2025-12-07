import pool from '../config/database'

export function startAutoReturnJob() {
  const intervalMs = 10 * 1000
  async function run() {
    try {
      const res = await pool.query(
        `SELECT id, vehicle_id FROM bookings WHERE status = 'active' AND rent_end_date < NOW()`
      )
      for (const row of res.rows) {
        await pool.query(`UPDATE bookings SET status = 'returned' WHERE id = $1`, [row.id])
        await pool.query(`UPDATE vehicles SET availability_status = 'available' WHERE id = $1`, [row.vehicle_id])
      }
    } catch (_err) {
    }
  }
  run()
  setInterval(run, intervalMs)
}
