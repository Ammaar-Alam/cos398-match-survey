
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/db'

export async function GET(req: NextRequest) {
  const items = await prisma.question.findMany({
    orderBy: { order: 'asc' },
    include: { options: { orderBy: { ord: 'asc' } } }
  })
  const out = items.map(q => ({
    id: q.id, text: q.text, responseType: q.responseType,
    options: q.options.map(o => ({ label: o.label, value: o.value }))
  }))
  return NextResponse.json(out)
}
