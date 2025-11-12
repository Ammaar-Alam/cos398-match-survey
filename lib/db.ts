import { Pool, PoolClient } from 'pg'

// Resolve a connection string from multiple env names for portability (Vercel/Supabase)
const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  ''

// Enable SSL when requested or when connecting to Supabase/remote hosts
// consider any Supabase DSN (direct or pooler) as requiring TLS, even if sslmode is omitted
const needsSsl =
  process.env.DATABASE_SSL === 'true' ||
  /sslmode=require/i.test(connectionString) ||
  /supabase\.(co|com)/i.test(connectionString) ||
  /pooler\.supabase\.com/i.test(connectionString)

const ssl = needsSsl ? { rejectUnauthorized: false } : undefined

const globalForPool = global as unknown as { pgPool?: Pool; pgPoolTimezoneHooked?: boolean }

if (!connectionString) {
  throw new Error('DATABASE_URL/POSTGRES_URL is not set')
}

const dbTimezone = process.env.DB_TIMEZONE || 'America/New_York'
const timezoneLiteral = dbTimezone?.replace(/'/g, "''") ?? ''

const poolInstance: Pool = globalForPool.pgPool || new Pool({ connectionString, ssl })

function applyTimezone(client: PoolClient) {
  if (!dbTimezone) return
  client
    .query(`SET TIME ZONE '${timezoneLiteral}'`)
    .catch(err => {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`Failed to enforce DB time zone (${dbTimezone})`, err)
      }
    })
}

if (!globalForPool.pgPoolTimezoneHooked && dbTimezone) {
  poolInstance.on('connect', applyTimezone)
  globalForPool.pgPoolTimezoneHooked = true
}

export const pool: Pool = poolInstance

if (process.env.NODE_ENV !== 'production') {
  globalForPool.pgPool = poolInstance
}

export async function query(text: string, params?: any[]): Promise<any> {
  return pool.query(text, params)
}
// Optional global override for environments with corporate/self-signed proxies.
if (process.env.ALLOW_SELF_SIGNED === 'true') {
  // eslint-disable-next-line no-process-env
  (process as any).env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
}
