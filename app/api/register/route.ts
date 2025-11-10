
import { NextRequest, NextResponse } from 'next/server'
import { pool } from '../../../lib/db'
import { z } from 'zod'
import { randomUUID } from 'crypto'

export const runtime = 'nodejs'

const RegisterSchema = z.object({
  coupleCode: z.string().min(1),
  fullName: z.string().min(1),
  netId: z.string().optional(),
  email: z.string().email().optional().or(z.literal('').transform(() => undefined)),
  monthsTogether: z.coerce.number().int().min(12).optional()
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = RegisterSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 })
  }
  const { coupleCode, fullName, netId, email, monthsTogether } = parsed.data
  const canonical = (s: string) => s.replace(/\s+/g,' ').trim()
  const full = canonical(fullName)

  // Optional env allowlist: ALLOWED_COUPLE_CODES="CODE1,CODE2"
  const allowlist = (process.env.ALLOWED_COUPLE_CODES || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
  if (allowlist.length > 0 && !allowlist.includes(coupleCode.toLowerCase())) {
    return NextResponse.json({ error: 'Couple code not permitted' }, { status: 403 })
  }

  // upsert couple by code
  const strict = process.env.REQUIRE_PREISSUED_CODES === 'true'
  let cid: string | undefined
  if (strict) {
    // require that couple code already exists (pre-issued)
    const r = await pool.query('SELECT id FROM couples WHERE code = $1 LIMIT 1', [String(coupleCode)])
    cid = r.rows[0]?.id
    if (!cid) {
      return NextResponse.json({ error: 'Invalid couple code. This study is invitation-only. Please contact the researcher to request a code.' }, { status: 404 })
    }
  } else {
    const coupleId = randomUUID()
    const inserted = await pool.query(
      'INSERT INTO couples (id, code, months_together, created_at) VALUES ($1,$2,$3,NOW()) ON CONFLICT (code) DO NOTHING RETURNING id',
      [coupleId, String(coupleCode), monthsTogether ?? null]
    )
    cid = inserted.rows[0]?.id
    if (!cid) {
      const r = await pool.query('SELECT id FROM couples WHERE code = $1', [String(coupleCode)])
      cid = r.rows[0].id
    }
  }

  // find existing participant by couple + full name (resume session)
  const existing = await pool.query(
    'SELECT id FROM participants WHERE couple_id=$1 AND lower(trim(full_name))=lower(trim($2)) LIMIT 1',
    [cid, String(full)]
  )
  if (existing.rows.length > 0) {
    return NextResponse.json({ participantId: existing.rows[0].id })
  }

  // create participant
  const participantId = randomUUID()
  await pool.query(
    'INSERT INTO participants (id, couple_id, full_name, net_id, email, started_at) VALUES ($1,$2,$3,$4,$5,NOW())',
    [participantId, cid, String(full), netId ? String(netId) : null, email ?? null]
  )

  return NextResponse.json({ participantId })
}
