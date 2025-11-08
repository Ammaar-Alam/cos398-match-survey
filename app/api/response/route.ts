
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/db'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { participantId, questionId, selfAnswer, acceptable, importance } = body
  if (!participantId || !questionId || !selfAnswer) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  await prisma.response.upsert({
    where: { participantId_questionId: { participantId, questionId } },
    update: { selfAnswer: String(selfAnswer), acceptable: String(acceptable || ''), importance: Number(importance ?? 1) },
    create: { participantId, questionId, selfAnswer: String(selfAnswer), acceptable: String(acceptable || ''), importance: Number(importance ?? 1) }
  })
  return NextResponse.json({ ok: true })
}
