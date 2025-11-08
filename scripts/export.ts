
import { prisma } from '../lib/db'
import fs from 'fs'
import path from 'path'

/**
 * Exports wide CSV with columns:
 * participantId, coupleCode, fullName, netId, SELF_Q1..50, ACC_Q1..50, IMP_Q1..50
 */
async function main() {
  const participants = await prisma.participant.findMany({ include: { couple: true, responses: true } })
  const questions = await prisma.question.findMany({ orderBy: { order: 'asc' } })
  const qids = questions.map(q => q.id)

  const header = [
    'participantId','coupleCode','fullName','netId',
    ...qids.map(q => `SELF_${q}`),
    ...qids.map(q => `ACC_${q}`),
    ...qids.map(q => `IMP_${q}`)
  ]
  const rows: string[][] = []

  for (const p of participants) {
    const map = new Map(p.responses.map(r => [r.questionId, r]))
    const row: string[] = [p.id, p.couple?.code || '', p.fullName, p.netId]
    for (const q of qids) {
      const r = map.get(q)
      row.push(r?.selfAnswer ?? '')
    }
    for (const q of qids) {
      const r = map.get(q)
      row.push(r?.acceptable ?? '')
    }
    for (const q of qids) {
      const r = map.get(q)
      row.push(r ? String(r.importance) : '')
    }
    rows.push(row)
  }

  const outPath = path.join(process.cwd(), 'export.csv')
  const csv = [header.join(','), ...rows.map(r => r.map(v => `"${(v||'').replace(/"/g,'""')}"`).join(','))].join('\n')
  fs.writeFileSync(outPath, csv, 'utf8')
  console.log(`Wrote ${outPath}`)
}

main().catch(e => { console.error(e); process.exit(1) }).finally(async () => { await prisma.$disconnect() })
