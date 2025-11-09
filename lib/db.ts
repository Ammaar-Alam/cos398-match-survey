
import { Pool } from 'pg'

// Resolve a connection string from multiple env names for portability (Vercel/Supabase)
const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  ''

// Enable SSL when requested or when connecting to Supabase/remote hosts
const needsSsl =
  process.env.DATABASE_SSL === 'true' ||
  /sslmode=require/.test(connectionString) ||
  /supabase\.co/.test(connectionString)

const ssl = needsSsl ? { rejectUnauthorized: false } : undefined

const globalForPool = global as unknown as { pgPool?: Pool }

if (!connectionString) {
  throw new Error('DATABASE_URL/POSTGRES_URL is not set')
}

export const pool: Pool = globalForPool.pgPool || new Pool({ connectionString, ssl })

if (process.env.NODE_ENV !== 'production') {
  globalForPool.pgPool = pool
}

export async function query(text: string, params?: any[]): Promise<any> {
  return pool.query(text, params)
}
