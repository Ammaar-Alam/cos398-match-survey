
import { NextRequest, NextResponse } from 'next/server'
import { pool } from '../../../lib/db'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'

const RegisterSchema = z.object({
  coupleCode: z.string().min(1),
  fullName: z.string().min(1),
  netId: z.string().optional(),
  email: z.string().email().optional().or(z.literal('').transform(() => undefined)),
  monthsTogether: z.coerce.number().int().min(0).optional()
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = RegisterSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 })
  }
  const { coupleCode, fullName, netId, email, monthsTogether } = parsed.data

  // upsert couple by code
  const coupleId = uuidv4()
  const inserted = await pool.query(
    'INSERT INTO couples (id, code, months_together, created_at) VALUES ($1,$2,$3,NOW()) ON CONFLICT (code) DO NOTHING RETURNING id',
    [coupleId, String(coupleCode), monthsTogether ?? null]
  )
  let cid = inserted.rows[0]?.id
  if (!cid) {
    const r = await pool.query('SELECT id FROM couples WHERE code = $1', [String(coupleCode)])
    cid = r.rows[0].id
  }

  // find existing participant by couple + full name (resume session)
  const existing = await pool.query('SELECT id FROM participants WHERE couple_id=$1 AND full_name=$2 LIMIT 1', [cid, String(fullName)])
  if (existing.rows.length > 0) {
    return NextResponse.json({ participantId: existing.rows[0].id })
  }

  // create participant
  const participantId = uuidv4()
  await pool.query(
    'INSERT INTO participants (id, couple_id, full_name, net_id, email, started_at) VALUES ($1,$2,$3,$4,$5,NOW())',
    [participantId, cid, String(fullName), netId ? String(netId) : null, email ?? null]
  )

  return NextResponse.json({ participantId })
}
