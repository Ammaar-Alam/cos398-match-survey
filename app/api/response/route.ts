
import { NextRequest, NextResponse } from 'next/server'
import { pool } from '../../../lib/db'
import { z } from 'zod'
import { randomUUID } from 'crypto'

const ResponseSchema = z.object({
  participantId: z.string().min(1),
  questionId: z.string().min(1),
  selfAnswer: z.string().min(1),
  acceptable: z.string().optional().default(''),
  importance: z.union([
    z.literal(0), z.literal(1), z.literal(10), z.literal(50), z.literal(250)
  ]).optional().default(1)
  ,final: z.boolean().optional().default(false)
})

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = ResponseSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 })
  }
  const { participantId, questionId, selfAnswer, acceptable, importance } = parsed.data
  const id = randomUUID()
  await pool.query(
    `INSERT INTO responses (id, participant_id, question_id, self_answer, acceptable, importance, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW())
     ON CONFLICT (participant_id, question_id)
     DO UPDATE SET self_answer = EXCLUDED.self_answer, acceptable = EXCLUDED.acceptable, importance = EXCLUDED.importance, updated_at = NOW()`,
    [id, participantId, questionId, String(selfAnswer), String(acceptable || ''), Number(importance ?? 1)]
  )
  // only check completion if this is final submission to avoid per-item overhead
  if (parsed.data.final) {
    const total = ITEMS_TOTAL
    const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM responses WHERE participant_id = $1', [participantId])
    const answered = rows[0]?.n ?? 0
    if (answered >= total && total > 0) {
      await pool.query('UPDATE participants SET completed_at = NOW() WHERE id = $1', [participantId])
    }
  }
  return NextResponse.json({ ok: true })
}

export async function GET(req: NextRequest) {
  const participantId = req.nextUrl.searchParams.get('participantId') || ''
  const questionId = req.nextUrl.searchParams.get('questionId') || ''
  if (!participantId || !questionId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  const { rows } = await pool.query(
    'SELECT participant_id, question_id, self_answer, acceptable, importance FROM responses WHERE participant_id = $1 AND question_id = $2',
    [participantId, questionId]
  )
  if (rows.length === 0) return NextResponse.json(null)
  return NextResponse.json({
    participantId: rows[0].participant_id,
    questionId: rows[0].question_id,
    selfAnswer: rows[0].self_answer,
    acceptable: rows[0].acceptable,
    importance: rows[0].importance
  })
}

// import once to compute number of items
import questionsRaw from '../../../data/questions.json'
const ITEMS_TOTAL = (questionsRaw as any[]).length
