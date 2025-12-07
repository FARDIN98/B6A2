import dotenv from 'dotenv'
import { Pool } from 'pg'

dotenv.config()

const connectionString = process.env.CONNECTION_STR

if (!connectionString) {
  console.error('Missing CONNECTION_STR in environment')
  process.exit(1)
}

export default new Pool({ connectionString })
