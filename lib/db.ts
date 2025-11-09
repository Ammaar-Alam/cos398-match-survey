
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL

// optional ssl toggle for managed DBs
const ssl = process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined

const globalForPool = global as unknown as { pgPool?: Pool }

export const pool: Pool = globalForPool.pgPool || new Pool({ connectionString, ssl })

if (process.env.NODE_ENV !== 'production') {
  globalForPool.pgPool = pool
}

export async function query(text: string, params?: any[]): Promise<any> {
  return pool.query(text, params)
}
