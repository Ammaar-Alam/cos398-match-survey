import { NextRequest, NextResponse } from 'next/server'
import { pool } from '../../../lib/db'
import questionsRaw from '../../../data/questions.json'

export const runtime = 'nodejs'

const QUESTION_IDS = (questionsRaw as { id: string }[]).map(q => q.id)

export async function GET(req: NextRequest) {
  const participantId = req.nextUrl.searchParams.get('participantId')?.trim()
  if (!participantId) {
    return NextResponse.json({ error: 'participantId required' }, { status: 400 })
  }

  const participant = await pool.query('SELECT completed_at FROM participants WHERE id = $1 LIMIT 1', [participantId])
  if (participant.rows.length === 0) {
    return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
  }
  const completedAt: Date | null = participant.rows[0].completed_at ?? null

  const answers = await pool.query('SELECT question_id FROM responses WHERE participant_id = $1', [participantId])
  const answeredSet = new Set<string>(answers.rows.map((row: any) => row.question_id))
  const total = QUESTION_IDS.length
  const answered = Math.min(answeredSet.size, total)

  let nextIdx = QUESTION_IDS.findIndex(id => !answeredSet.has(id))
  if (nextIdx === -1) nextIdx = total - 1

  const status = completedAt
    ? 'completed'
    : answered === 0
      ? 'not_started'
      : answered >= total
        ? 'completed'
        : 'in_progress'

  const nextIndex = status === 'completed'
    ? total
    : Math.min(nextIdx + 1, total)

  const resumePath = status === 'completed' ? '/done' : `/survey/${Math.max(1, nextIndex)}`

  return NextResponse.json({
    status,
    answered,
    total,
    nextIndex,
    resumePath,
    completedAt
  })
}
