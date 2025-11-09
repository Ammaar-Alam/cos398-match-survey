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
      setAcceptable(null)
    }
  }, [questions, idx0])

  useEffect(() => {
    async function loadSaved() {
      if (!q) return
      try {
        const participantId = localStorage.getItem('participantId')
        const res = await fetch(`/api/response?participantId=${participantId}&questionId=${q.id}`)
        if (!res.ok) {
          return
        }
        const data = await res.json()
        if (!data) {
          return
        }
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
  const prevProgress = idx0 > 0 ? Math.round((idx0 / total) * 100) : 0

  async function goNext() {
    if (!selfAnswer || !importance || !acceptable) return
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
    if (selfAnswer && importance && acceptable) {
      const participantId = localStorage.getItem('participantId')
      fireAndForgetSave({ participantId, questionId: q!.id, selfAnswer, importance: parseImportance(importance), acceptable: JSON.stringify(acceptable), final: false })
    }
    router.push(`/survey/${idx0}`)
  }
  function parseImportance(label: string) {
    const map: Record<string, number> = { 'Irrelevant': 0, 'A little': 1, 'Somewhat': 10, 'Very': 50, 'Mandatory': 250 }
    return map[label] ?? 1
  }

  function maybeAutosave() {
    try {
      if (!q) return
      if (!selfAnswer || !importance || !acceptable) return
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
    <div className="container py-4 sm:py-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-medium text-slate-600">Question {idx0 + 1} of {total}</div>
          <div className="text-sm text-slate-500">{progress}% complete</div>
        </div>
        <div className="mb-4 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <motion.div 
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-600" 
            initial={{ width: `${prevProgress}%` }} 
            animate={{ width: `${progress}%` }} 
            transition={{ duration: 0.3, ease: "easeOut" }} 
          />
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="max-w-4xl mx-auto">
          {(q.section || q.construct) && (
            <div className="text-xs uppercase tracking-wider text-slate-400 mb-2 font-medium">{q.section?.split(') ')[1] || q.section}{q.construct ? ` • ${q.construct}` : ''}</div>
          )}
          <div className="card p-5 sm:p-6 shadow-lg">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight mb-5 text-slate-900 leading-tight">{q.text}</h2>
            <div className="space-y-5 divide-y divide-slate-200">
              <section className="pt-0">
                <div className="text-sm font-semibold mb-3 text-slate-800">Your answer</div>
                {q.responseType.startsWith('Likert') ? (
                  <div className="grid grid-cols-7 gap-2 sm:gap-3">
                    {Array.from({ length: intFromType(q.responseType) }).map((_, i) => {
                      const label = String(i + 1)
                      const isSelected = selfAnswer === label
                      const maxValue = intFromType(q.responseType)
                      const acceptableValues = getAcceptableValues(selfAnswer, acceptable, maxValue)
                      const isAcceptable = acceptableValues.has(label)
                      const isHighlighted = isAcceptable && !isSelected && acceptable && (acceptable.mode === 'range' || acceptable.mode === 'values')
                      return (
                        <label key={i} className={`choice ${isSelected ? 'choice-selected' : ''} ${isSelected ? 'scale-105' : ''} ${isHighlighted ? 'choice-acceptable' : ''}`}>
                          <input className="sr-only" type="radio" name="self" value={label} onChange={() => onSetSelf(label)} />
                          <span className="font-semibold">{label}</span>
                        </label>
                      )
                    })}
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {q.options.map(opt => {
                      const isSelected = selfAnswer === opt.value
                      return (
                        <label key={opt.value} className={`choice text-left ${isSelected ? 'choice-selected' : ''} ${isSelected ? 'scale-[1.02]' : ''} transition-transform`}>
                          <input className="sr-only" type="radio" name="self" value={opt.value} onChange={() => onSetSelf(opt.value)} />
                          <span className="block">{opt.label}</span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </section>

              <section className="pt-4">
                <div className="text-sm font-semibold mb-2 text-slate-800">Acceptable partner answers</div>
                <p className="text-xs text-slate-500 mb-3">Select what answers from your partner would be acceptable to you</p>
                {q.responseType.startsWith('Likert') ? (
                  <div className="grid gap-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                      {ACCEPTABLE_LIKERT.map(label => {
                        const isSelected = acceptable?.mode === 'range' && acceptable?.tol === label
                        return (
                          <label key={label} className={`choice flex items-center justify-center ${isSelected ? 'choice-selected' : ''} ${isSelected ? 'scale-105' : ''} transition-transform`}>
                            <input className="sr-only" type="radio" name="acc" value={label} onChange={() => onSetAcceptableRange(label)} />
                            <span className="text-sm sm:text-base text-center">{label}</span>
                          </label>
                        )
                      })}
                      <label className={`choice flex items-center justify-center ${acceptable?.mode === 'values' ? 'choice-selected' : ''} ${acceptable?.mode === 'values' ? 'scale-105' : ''} transition-transform col-span-2 sm:col-span-1`}>
                        <input className="sr-only" type="radio" name="acc" value="custom" onChange={() => setAcceptable({ mode: 'values', vals: [] })} />
                        <span className="text-sm sm:text-base text-center">Choose specific values</span>
                      </label>
                    </div>
                    {acceptable?.mode === 'values' && (
                      <div className="mt-2 pt-3 border-t border-slate-200">
                        <div className="text-sm font-medium text-slate-700 mb-2">Select specific values:</div>
                        <div className="grid grid-cols-7 gap-2 sm:gap-3">
                          {Array.from({ length: intFromType(q.responseType) }).map((_, i) => {
                            const val = String(i + 1)
                            const active = acceptable?.vals?.includes(val)
                            return (
                              <label key={val} className={`choice flex items-center justify-center ${active ? 'choice-selected' : ''} ${active ? 'scale-105' : ''} transition-transform`}>
                                <input type="checkbox" className="sr-only" checked={active} onChange={e => {
                                  const s = new Set([...(acceptable?.vals || [])])
                                  e.target.checked ? s.add(val) : s.delete(val)
                                  setAcceptable({ mode: 'values', vals: [...s] })
                                  setTimeout(() => maybeAutosave(), 0)
                                }} />
                                <span className="font-semibold">{val}</span>
                              </label>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {q.options.map(opt => {
                      const checked = acceptable?.opts?.includes(opt.value)
                      return (
                        <label key={opt.value} className={`choice flex items-center gap-3 text-left ${checked ? 'choice-selected' : ''} ${checked ? 'scale-[1.02]' : ''} transition-transform`}>
                          <input type="checkbox" checked={checked} onChange={e => onToggleAcceptableOption(opt.value, e.target.checked)} className="w-4 h-4 text-brand-600 border-slate-300 rounded focus:ring-brand-500" />
                          <span className="flex-1">{opt.label}</span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </section>

              <section className="pt-4">
                <div className="text-sm font-semibold mb-2 text-slate-800">How important is this to you?</div>
                <p className="text-xs text-slate-500 mb-3">Indicate how much this matters in a compatible match</p>
                <div className="grid grid-cols-5 gap-2 sm:gap-3">
                  {LIKERT5_IMPORTANCE.map(label => {
                    const isSelected = importance === label
                    return (
                      <label key={label} className={`choice flex items-center justify-center ${isSelected ? 'choice-selected' : ''} ${isSelected ? 'scale-105' : ''} transition-transform`}>
                        <input className="sr-only" type="radio" name="imp" value={label} onChange={() => onSetImportance(label)} />
                        <span className="text-sm sm:text-base font-medium text-center">{label}</span>
                      </label>
                    )
                  })}
                </div>
                {(!importance || !acceptable) && (
                  <div className="text-xs text-amber-600 mt-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {!importance && !acceptable ? 'Please select acceptable partner answers and importance level to continue' : !importance ? 'Please select an importance level to continue' : 'Please select acceptable partner answers to continue'}
                  </div>
                )}
              </section>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between mt-5 pt-4 border-t border-slate-200 gap-3">
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <kbd className="px-2 py-1 bg-slate-100 border border-slate-300 rounded text-xs font-mono">←</kbd>
                <span>Back</span>
                <span className="mx-2">•</span>
                <kbd className="px-2 py-1 bg-slate-100 border border-slate-300 rounded text-xs font-mono">→</kbd>
                <span>Next</span>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button onClick={goPrev} disabled={idx0 === 0} className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium">Back</button>
                <button disabled={!selfAnswer || !importance || !acceptable || saving} onClick={goNext} className="px-6 py-2.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm">
                  {saving ? 'Saving…' : idx0 + 1 >= questions.length ? 'Complete' : 'Next →'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function intFromType(t: string) { if (t === 'Likert7') return 7; if (t === 'Likert6') return 6; return 5 }
function labelFromImportance(v: number) { const map: Record<number, string> = { 0: 'Irrelevant', 1: 'A little', 10: 'Somewhat', 50: 'Very', 250: 'Mandatory' }; return map[v] }

function getAcceptableValues(selfAnswer: string, acceptable: any, maxValue: number): Set<string> {
  if (!selfAnswer || !acceptable) return new Set()
  
  const acceptableSet = new Set<string>()
  
  if (acceptable.mode === 'values' && acceptable.vals) {
    // User selected specific values
    acceptable.vals.forEach((val: string) => acceptableSet.add(val))
  } else if (acceptable.mode === 'range') {
    const selfNum = parseInt(selfAnswer, 10)
    if (isNaN(selfNum)) return new Set()
    
    if (acceptable.tol === 'Same answer') {
      acceptableSet.add(selfAnswer)
    } else if (acceptable.tol === '±1 step') {
      if (selfNum > 1) acceptableSet.add(String(selfNum - 1))
      acceptableSet.add(selfAnswer)
      if (selfNum < maxValue) acceptableSet.add(String(selfNum + 1))
    } else if (acceptable.tol === '±2 steps') {
      for (let i = Math.max(1, selfNum - 2); i <= Math.min(maxValue, selfNum + 2); i++) {
        acceptableSet.add(String(i))
      }
    } else if (acceptable.tol === 'Any answer') {
      for (let i = 1; i <= maxValue; i++) {
        acceptableSet.add(String(i))
      }
    }
  }
  
  return acceptableSet
}

