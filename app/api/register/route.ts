
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/db'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { coupleCode, fullName, netId, email, monthsTogether } = body

  if (!coupleCode || !fullName || !netId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // upsert couple by code
  let couple = await prisma.couple.findUnique({ where: { code: coupleCode } })
  if (!couple) {
    couple = await prisma.couple.create({ data: { code: String(coupleCode), monthsTogether: monthsTogether ? Number(monthsTogether) : null } })
  }

  // create participant
  const p = await prisma.participant.create({
    data: { coupleId: couple.id, fullName: String(fullName), netId: String(netId), email: email ? String(email) : null }
  })

  return NextResponse.json({ participantId: p.id })
}
