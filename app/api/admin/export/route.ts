
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db'

export async function GET(req: NextRequest) {
  const key = req.headers.get('x-admin-key') || req.nextUrl.searchParams.get('key')
  if (key !== process.env.ADMIN_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const participants = await prisma.participant.findMany({ include: { couple: true, responses: true } })
  const questions = await prisma.question.findMany({ orderBy: { order: 'asc' } })
  const qids = questions.map(q => q.id)

  const header = [
    'participantId','coupleCode','fullName','netId',
    ...qids.map(q => `SELF_${q}`),
    ...qids.map(q => `ACC_${q}`),
    ...qids.map(q => `IMP_${q}`)
  ]

  const rows = participants.map(p => {
    const map = new Map(p.responses.map(r => [r.questionId, r]))
    const row = [p.id, p.couple?.code || '', p.fullName, p.netId]
    for (const q of qids) row.push(map.get(q)?.selfAnswer ?? '')
    for (const q of qids) row.push(map.get(q)?.acceptable ?? '')
    for (const q of qids) row.push(map.get(q) ? String(map.get(q)!.importance) : '')
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
