"use client"
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { LIKERT5_IMPORTANCE, ACCEPTABLE_LIKERT } from '../../../lib/scales'

type Question = {
  id: string
  text: string
  responseType: string
  options: { label: string; value: string }[]
  section?: string
  construct?: string
}

async function fetchQuestions(): Promise<Question[]> {
  const res = await fetch('/api/questions')
  if (!res.ok) throw new Error('Failed to load questions')
  return await res.json()
}

async function saveResponse(payload: any) {
  const res = await fetch('/api/response', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  if (!res.ok) throw new Error('Failed to save')
  return await res.json()
}

function fireAndForgetSave(payload: any) {
  try {
    const data = JSON.stringify(payload)
    if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
      const blob = new Blob([data], { type: 'application/json' })
      navigator.sendBeacon('/api/response', blob)
      return
    }
  } catch {}
  fetch('/api/response', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), keepalive: true }).catch(() => {})
}

export default function SurveyPage({ params }: { params: { index: string } }) {
  const router = useRouter()
  const idx0 = Math.max(0, parseInt(params.index, 10) - 1) || 0
  const [questions, setQuestions] = useState<Question[]>([])
  const [q, setQ] = useState<Question | null>(null)
  const [selfAnswer, setSelfAnswer] = useState('')
  const [importance, setImportance] = useState('')
  const [acceptable, setAcceptable] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchQuestions().then(setQuestions) }, [])
  useEffect(() => {
    if (questions.length > 0) {
      const qq = questions[idx0]
      setQ(qq)
      setSelfAnswer('')
      setImportance('')
      if (qq.responseType.startsWith('Likert')) setAcceptable({ mode: 'range', tol: 'Any answer' })
      else setAcceptable({ mode: 'options', opts: [] })
    }
  }, [questions, idx0])

  useEffect(() => {
    async function loadSaved() {
      if (!q) return
      try {
        const participantId = localStorage.getItem('participantId')
        const res = await fetch(`/api/response?participantId=${participantId}&questionId=${q.id}`)
        if (!res.ok) return
        const data = await res.json()
        if (!data) return
        setSelfAnswer(data.selfAnswer || '')
        try {
          const parsed = data.acceptable ? JSON.parse(data.acceptable) : null
          if (parsed) setAcceptable(parsed)
        } catch {}
        if (typeof data.importance === 'number') setImportance(labelFromImportance(data.importance))
      } catch {}
    }
    loadSaved()
  }, [q])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [q, selfAnswer, importance, acceptable])

  if (!q) return <div className="container py-12">Loading…</div>

  const total = questions.length || 50
  const progress = Math.round(((idx0 + 1) / total) * 100)

  async function goNext() {
    if (!selfAnswer || !importance) return
    const participantId = localStorage.getItem('participantId')
    const isLast = idx0 + 1 >= questions.length
    const payload = { participantId, questionId: q.id, selfAnswer, importance: parseImportance(importance), acceptable: JSON.stringify(acceptable), final: isLast }
    if (isLast) {
      setSaving(true)
      try { await saveResponse(payload); router.push('/done') } finally { setSaving(false) }
    } else {
      fireAndForgetSave(payload); router.push(`/survey/${idx0 + 2}`)
    }
  }
  async function goPrev() {
    if (idx0 === 0) return
    if (selfAnswer && importance) {
      const participantId = localStorage.getItem('participantId')
      fireAndForgetSave({ participantId, questionId: q!.id, selfAnswer, importance: parseImportance(importance), acceptable: JSON.stringify(acceptable), final: false })
    }
    router.push(`/survey/${idx0}`)
  }
  function parseImportance(label: string) {
    const map: Record<string, number> = { 'Irrelevant (0)': 0, 'A little (1)': 1, 'Somewhat (10)': 10, 'Very (50)': 50, 'Mandatory (250)': 250 }
    return map[label] ?? 1
  }

  function maybeAutosave() {
    try {
      if (!q) return
      if (!selfAnswer || !importance) return
      const participantId = localStorage.getItem('participantId')
      fireAndForgetSave({ participantId, questionId: q.id, selfAnswer, importance: parseImportance(importance), acceptable: JSON.stringify(acceptable), final: false })
    } catch {}
  }
  function onSetSelf(val: string) { setSelfAnswer(val); setTimeout(() => maybeAutosave(), 0) }
  function onSetImportance(val: string) { setImportance(val); setTimeout(() => maybeAutosave(), 0) }
  function onSetAcceptableRange(label: string) { setAcceptable({ mode: 'range', tol: label }); setTimeout(() => maybeAutosave(), 0) }
  function onToggleAcceptableOption(value: string, checked: boolean) {
    const arr = new Set([...(acceptable?.opts || [])]); checked ? arr.add(value) : arr.delete(value); setAcceptable({ mode: 'options', opts: [...arr] }); setTimeout(() => maybeAutosave(), 0)
  }

  return (
    <div className="container py-10">
      <div className="max-w-4xl mx-auto">
        <div className="mb-2 flex items-center gap-3">
          <div className="text-sm text-slate-500">Question {idx0 + 1} of {total} • {progress}%</div>
        </div>
        <div className="mb-6 h-2 w-full bg-slate-100 rounded">
          <motion.div className="h-2 rounded bg-brand-500" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={q.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="max-w-4xl mx-auto">
          {(q.section || q.construct) && (
            <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">{q.section?.split(') ')[1] || q.section}{q.construct ? ` • ${q.construct}` : ''}</div>
          )}
          <div className="card p-6">
            <h2 className="text-2xl font-semibold tracking-tight mb-6">{q.text}</h2>
            <div className="space-y-6 divide-y divide-slate-100">
              <section className="pt-0">
                <div className="text-sm font-medium mb-2 text-slate-700">Your answer</div>
                {q.responseType.startsWith('Likert') ? (
                  <div className="grid grid-cols-7 gap-2 sm:gap-3">
                    {Array.from({ length: intFromType(q.responseType) }).map((_, i) => {
                      const label = String(i + 1)
                      return (
                        <label key={i} className={`choice ${selfAnswer === label ? 'choice-selected' : ''}`}>
                          <input className="sr-only" type="radio" name="self" value={label} onChange={() => onSetSelf(label)} />
                          {label}
                        </label>
                      )
                    })}
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {q.options.map(opt => (
                      <label key={opt.value} className={`choice text-left ${selfAnswer === opt.value ? 'choice-selected' : ''}`}>
                        <input className="sr-only" type="radio" name="self" value={opt.value} onChange={() => onSetSelf(opt.value)} />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                )}
              </section>

              <section className="pt-4">
                <div className="text-sm font-medium mb-2 text-slate-700">Acceptable partner answers</div>
                {q.responseType.startsWith('Likert') ? (
                  <div className="grid gap-3">
                    <div className="grid grid-cols-5 gap-2 sm:gap-3">
                      {ACCEPTABLE_LIKERT.map(label => (
                        <label key={label} className={`choice ${acceptable?.mode === 'range' && acceptable?.tol === label ? 'choice-selected' : ''}`}>
                          <input className="sr-only" type="radio" name="acc" value={label} onChange={() => onSetAcceptableRange(label)} />
                          {label}
                        </label>
                      ))}
                      <label className={`choice ${acceptable?.mode === 'values' ? 'choice-selected' : ''}`}>
                        <input className="sr-only" type="radio" name="acc" value="custom" onChange={() => setAcceptable({ mode: 'values', vals: [] })} />
                        Choose values…
                      </label>
                    </div>
                    {acceptable?.mode === 'values' && (
                      <div className="grid grid-cols-7 gap-2 sm:gap-3">
                        {Array.from({ length: intFromType(q.responseType) }).map((_, i) => {
                          const val = String(i + 1)
                          const active = acceptable?.vals?.includes(val)
                          return (
                            <label key={val} className={`choice ${active ? 'choice-selected' : ''}`}>
                              <input type="checkbox" className="sr-only" checked={active} onChange={e => {
                                const s = new Set([...(acceptable?.vals || [])])
                                e.target.checked ? s.add(val) : s.delete(val)
                                setAcceptable({ mode: 'values', vals: [...s] })
                                setTimeout(() => maybeAutosave(), 0)
                              }} />
                              {val}
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {q.options.map(opt => {
                      const checked = acceptable?.opts?.includes(opt.value)
                      return (
                        <label key={opt.value} className={`choice flex items-center gap-2 text-left ${checked ? 'choice-selected' : ''}`}>
                          <input type="checkbox" checked={checked} onChange={e => onToggleAcceptableOption(opt.value, e.target.checked)} />
                          {opt.label}
                        </label>
                      )
                    })}
                  </div>
                )}
              </section>

              <section className="pt-4">
                <div className="text-sm font-medium mb-2 text-slate-700">How important is this item to you?</div>
                <div className="grid grid-cols-5 gap-2 sm:gap-3">
                  {LIKERT5_IMPORTANCE.map(label => (
                    <label key={label} className={`choice ${importance === label ? 'choice-selected' : ''}`}>
                      <input className="sr-only" type="radio" name="imp" value={label} onChange={() => onSetImportance(label)} />
                      {label}
                    </label>
                  ))}
                </div>
                {!importance && <div className="text-xs text-slate-500 mt-2">Select an importance to continue</div>}
              </section>
            </div>

            <div className="flex items-center justify-between mt-6">
              <div className="text-xs text-slate-500">Use arrow keys to navigate: ← Back | Next →</div>
              <div className="flex gap-3">
                <button onClick={goPrev} className="px-4 py-2 rounded border">Back</button>
                <button disabled={!selfAnswer || !importance || saving} onClick={goNext} className="px-5 py-2 rounded bg-brand-600 text-white disabled:opacity-50">{saving ? 'Saving…' : 'Next →'}</button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function intFromType(t: string) { if (t === 'Likert7') return 7; if (t === 'Likert6') return 6; return 5 }
function labelFromImportance(v: number) { const map: Record<number, string> = { 0: 'Irrelevant (0)', 1: 'A little (1)', 10: 'Somewhat (10)', 50: 'Very (50)', 250: 'Mandatory (250)' }; return map[v] }

