
import { NextRequest, NextResponse } from 'next/server'
import questionsRaw from '../../../data/questions.json'

// transform at module load for speed
const items = (questionsRaw as any[])
  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  .map(q => ({
    id: q.id,
    text: q.text,
    section: q.section,
    construct: q.construct,
    responseType: q.responseType,
    options: (q.options || []).map((label: string, idx: number) => ({ label, value: String(idx + 1) }))
  }))

export async function GET(req: NextRequest) {
  return NextResponse.json(items, {
    headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' }
  })
}
