
import { NextRequest, NextResponse } from 'next/server'
import questionsRaw from '../../../data/questions.json'

// Official ESS PVQ-21 portrait text overrides (ids Q11..Q31)
const PVQ_TEXT_OVERRIDES: Record<string, string> = {
  Q11: "Thinking up new ideas and being creative is important to him/her. He/she likes to do things in his/her own original way.",
  Q12: "It is important to him/her to be rich. He/she wants to have a lot of money and expensive things.",
  Q13: "He/she thinks it is important that every person in the world should be treated equally. He/she believes everyone should have equal opportunities in life.",
  Q14: "It's important to him/her to show his/her abilities. He/she wants people to admire what he/she does.",
  Q15: "It is important to him/her to live in secure surroundings. He/she avoids anything that might endanger his/her safety.",
  Q16: "He/she likes surprises and is always looking for new things to do. He/she thinks it is important to do lots of different things in life.",
  Q17: "He/she believes that people should do what they're told. He/she thinks people should follow rules at all times, even when no-one is watching.",
  Q18: "It is important to him/her to listen to people who are different from him/her. Even when he/she disagrees with them, he/she still wants to understand them.",
  Q19: "It is important to him/her to be humble and modest. He/she tries not to draw attention to himself/herself.",
  Q20: "Having a good time is important to him/her. He/she likes to “spoil” himself/herself.",
  Q21: "It is important to him/her to make his/her own decisions about what he/she does. He/she likes to be free and not depend on others.",
  Q22: "It's very important to him/her to help the people around him/her. He/she wants to care for their well-being.",
  Q23: "Being very successful is important to him/her. He/she hopes people will recognise his/her achievements.",
  Q24: "It is important to him/her that the government ensures his/her safety against all threats. He/she wants the state to be strong so it can defend its citizens.",
  Q25: "He/she looks for adventures and likes to take risks. He/she wants to have an exciting life.",
  Q26: "It is important to him/her always to behave properly. He/she wants to avoid doing anything people would say is wrong.",
  Q27: "It is important to him/her to get respect from others. He/she wants people to do what he/she says.",
  Q28: "It is important to him/her to be loyal to his/her friends. He/she wants to devote himself/herself to people close to him/her.",
  Q29: "He/she strongly believes that people should care for nature. Looking after the environment is important to him/her.",
  Q30: "Tradition is important to him/her. He/she tries to follow the customs handed down by his/her religion or his/her family.",
  Q31: "He/she seeks every chance he/she can to have fun. It is important to him/her to do things that give him/her pleasure."
}

// Specific anchor overrides for ambiguous custom Likert items
const ANCHORS_ENERGY5 = [
  'Very drained', 'Somewhat drained', 'Neutral', 'Somewhat energized', 'Very energized'
]

function anchorsForQuestion(q: any): string[] | undefined {
  const text: string = String(q.text || '').toLowerCase()
  // matches en dash and hyphen forms
  if (text.includes('after 3–4 hours at a large social event') || text.includes('after 3-4 hours at a large social event') || text.includes('large social event')) {
    return ANCHORS_ENERGY5
  }
  return undefined
}

// transform at module load for speed
const baseItems = (questionsRaw as any[])
  .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  .map(q => ({
    id: q.id,
    text: PVQ_TEXT_OVERRIDES[q.id] ?? q.text,
    section: q.section,
    construct: q.construct,
    responseType: q.responseType,
    options: (q.options || []).map((label: string, idx: number) => ({ label, value: String(idx + 1) })),
    anchors: anchorsForQuestion(q) || (Array.isArray(q.options) && q.responseType?.startsWith('Likert') ? q.options : undefined)
  }))

export async function GET(req: NextRequest) {
  // Optionally inject a single IMC item in the middle of the flow when enabled
  const enableImc = process.env.ENABLE_IMC === 'true'
  const items = [...baseItems]
  if (enableImc && items.length > 0) {
    const mid = Math.floor(items.length / 2)
    items.splice(mid, 0, {
      id: 'IMC1',
      text: 'For quality control, please select 3 (Somewhat) here',
      section: 'Quality Check',
      construct: 'IMC',
      responseType: 'Likert5',
      options: [],
      anchors: ['Not at all', 'A little', 'Somewhat', 'Very', 'Extremely']
    } as any)
  }
  return NextResponse.json(items, {
    headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' }
  })
}
