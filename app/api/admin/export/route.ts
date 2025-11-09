
import { NextRequest, NextResponse } from 'next/server'
import { pool } from '../../../../lib/db'
import questionsRaw from '../../../../data/questions.json'

export async function GET(req: NextRequest) {
  const key = req.headers.get('x-admin-key') || req.nextUrl.searchParams.get('key')
  if (key !== process.env.ADMIN_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const items = (questionsRaw as any[]).sort((a,b) => (a.order ?? 0) - (b.order ?? 0))
  const qids = items.map(q => q.id)

  const header = [
    'participantId','coupleCode','fullName','netId',
    ...qids.map(q => `SELF_${q}`),
    ...qids.map(q => `ACC_${q}`),
    ...qids.map(q => `IMP_${q}`)
  ]

  const { rows: participants } = await pool.query(
    `SELECT p.id, p.full_name, p.net_id, COALESCE(c.code,'') AS couple_code
       FROM participants p LEFT JOIN couples c ON c.id = p.couple_id
       ORDER BY p.started_at ASC`
  )

  const { rows: responses } = await pool.query(
    `SELECT participant_id, question_id, self_answer, acceptable, importance FROM responses`
  )
  const respByPid = new Map<string, Map<string, {self:string, acc:string, imp:number}>>()
  for (const r of responses as any[]) {
    const m = respByPid.get(r.participant_id) || new Map()
    m.set(r.question_id, { self: r.self_answer ?? '', acc: r.acceptable ?? '', imp: Number(r.importance ?? '') })
    respByPid.set(r.participant_id, m)
  }

  const rows = (participants as any[]).map(p => {
    const m = respByPid.get(p.id) || new Map()
    const row = [p.id, p.couple_code, p.full_name, p.net_id]
    for (const q of qids) row.push(m.get(q)?.self ?? '')
    for (const q of qids) row.push(m.get(q)?.acc ?? '')
    for (const q of qids) row.push(m.get(q) ? String(m.get(q)!.imp) : '')
    return row.map(v => `"${(v||'').replace(/"/g,'""')}"`).join(',')
  })

  const csv = [header.join(','), ...rows].join('\n')
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="export.csv"'
    }
  })
}
