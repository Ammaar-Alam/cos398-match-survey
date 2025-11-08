
'use client'
import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LIKERT5_IMPORTANCE, ACCEPTABLE_LIKERT } from '../../../lib/scales'

type Question = {
  id: string; text: string; responseType: string; options: {label:string, value:string}[]
}

async function fetchQuestions(): Promise<Question[]> {
  const res = await fetch('/api/questions')
  if (!res.ok) throw new Error('Failed to load questions')
  return await res.json()
}

async function saveResponse(payload: any) {
  const res = await fetch('/api/response', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
  if (!res.ok) throw new Error('Failed to save')
  return await res.json()
}

export default function SurveyPage({ params }: { params: { index: string } }) {
  const idx0 = Math.max(0, parseInt(params.index, 10) - 1) || 0
  const [questions, setQuestions] = useState<Question[]>([])
  const [q, setQ] = useState<Question | null>(null)
  const [selfAnswer, setSelfAnswer] = useState<string>('')
  const [importance, setImportance] = useState<string>('A little (1)')
  const [acceptable, setAcceptable] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchQuestions().then(setQuestions) }, [])
  useEffect(() => {
    if (questions.length > 0) {
      const qq = questions[idx0]
      setQ(qq)
      // defaults
      setSelfAnswer('')
      setImportance('A little (1)')
      if (qq.responseType.startsWith('Likert')) setAcceptable({mode:'range', tol:'±1 step'})
      else setAcceptable({mode:'options', opts:[]})
    }
  }, [questions, idx0])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [q, selfAnswer, importance, acceptable])

  if (!q) return <div className="container py-12">Loading…</div>

  const progress = Math.round(((idx0+1) / 50) * 100)

  async function goNext() {
    if (!selfAnswer) return
    setSaving(true)
    try {
      const participantId = localStorage.getItem('participantId')
      await saveResponse({
        participantId,
        questionId: q.id,
        selfAnswer,
        importance: parseImportance(importance),
        acceptable: JSON.stringify(acceptable)
      })
      window.location.href = idx0+1 >= questions.length ? '/done' : `/survey/${idx0+2}`
    } finally {
      setSaving(false)
    }
  }
  function goPrev() {
    if (idx0 === 0) return
    window.location.href = `/survey/${idx0}`
  }
  function parseImportance(label: string) {
    const map: Record<string, number> = {
      'Irrelevant (0)': 0,
      'A little (1)': 1,
      'Somewhat (10)': 10,
      'Very (50)': 50,
      'Mandatory (250)': 250
    }
    return map[label] ?? 1
  }

  return (
    <div className="container py-8">
      <div className="mb-4 text-sm text-slate-600">Progress: {progress}%</div>
      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{opacity:0, x:20}}
          animate={{opacity:1, x:0}}
          exit={{opacity:0, x:-20}}
          transition={{duration:0.25}}
          className="max-w-3xl"
        >
          <h2 className="text-xl font-semibold mb-3">{q.text}</h2>

          {/* SELF ANSWER */}
          <div className="mb-6">
            <div className="text-sm font-medium mb-2">Your answer</div>
            {q.responseType.startsWith('Likert') ? (
              <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
                {Array.from({length: intFromType(q.responseType)}).map((_,i) => {
                  const label = String(i+1)
                  return (
                    <label key={i} className={"border rounded px-3 py-2 cursor-pointer text-center " + (selfAnswer===label?'border-brand-600 ring-2 ring-brand-200':'hover:border-slate-400')}>
                      <input className="sr-only" type="radio" name="self" value={label} onChange={() => setSelfAnswer(label)} />
                      {label}
                    </label>
                  )
                })}
              </div>
            ) : (
              <div className="grid gap-2">
                {q.options.map(opt => (
                  <label key={opt.value} className={"border rounded px-3 py-2 cursor-pointer " + (selfAnswer===opt.value?'border-brand-600 ring-2 ring-brand-200':'hover:border-slate-400')}>
                    <input className="sr-only" type="radio" name="self" value={opt.value} onChange={() => setSelfAnswer(opt.value)} />
                    {opt.label}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* ACCEPTABLE PARTNER ANSWERS */}
          <div className="mb-6">
            <div className="text-sm font-medium mb-2">Acceptable partner answers</div>
            {q.responseType.startsWith('Likert') ? (
              <div className="grid sm:grid-cols-4 gap-2">
                {ACCEPTABLE_LIKERT.map(label => (
                  <label key={label} className={"border rounded px-3 py-2 cursor-pointer " + (acceptable?.tol===label?'border-brand-600 ring-2 ring-brand-200':'hover:border-slate-400')}>
                    <input className="sr-only" type="radio" name="acc" value={label} onChange={() => setAcceptable({mode:'range', tol:label})} />
                    {label}
                  </label>
                ))}
              </div>
            ) : (
              <div className="grid gap-2">
                {q.options.map(opt => {
                  const checked = acceptable?.opts?.includes(opt.value)
                  return (
                    <label key={opt.value} className={"border rounded px-3 py-2 cursor-pointer flex items-center gap-2 " + (checked?'border-brand-600 ring-2 ring-brand-200':'hover:border-slate-400')}>
                      <input type="checkbox" checked={checked} onChange={(e) => {
                        const arr = new Set([...(acceptable?.opts || [])])
                        e.target.checked ? arr.add(opt.value) : arr.delete(opt.value)
                        setAcceptable({mode:'options', opts:[...arr]})
                      }} />
                      {opt.label}
                    </label>
                  )
                })}
              </div>
            )}
          </div>

          {/* IMPORTANCE */}
          <div className="mb-6">
            <div className="text-sm font-medium mb-2">How important is this item to you?</div>
            <div className="grid sm:grid-cols-5 gap-2">
              {LIKERT5_IMPORTANCE.map(label => (
                <label key={label} className={"border rounded px-3 py-2 cursor-pointer text-center " + (importance===label?'border-brand-600 ring-2 ring-brand-200':'hover:border-slate-400')}>
                  <input className="sr-only" type="radio" name="imp" value={label} onChange={() => setImportance(label)} />
                  {label}
                </label>
              ))}
            </div>
          </div>

          {/* NAV */}
          <div className="flex gap-3">
            <button onClick={goPrev} className="px-4 py-2 rounded border">Back</button>
            <button disabled={!selfAnswer || saving} onClick={goNext}
              className="px-5 py-2 rounded bg-brand-600 text-white disabled:opacity-50">
              {saving ? 'Saving…' : 'Next →'}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function intFromType(t: string) {
  if (t === 'Likert7') return 7
  if (t === 'Likert6') return 6
  return 5
}
