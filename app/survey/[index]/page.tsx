"use client"
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { LIKERT5_IMPORTANCE, ACCEPTABLE_LIKERT, LIKERT6, LIKERT7 } from '../../../lib/scales'
import { COPY } from '../../../lib/copy'

type Question = {
  id: string
  text: string
  responseType: string
  options: { label: string; value: string }[]
  section?: string
  construct?: string
  anchors?: string[]
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
  const searchParams = useSearchParams()
  const reviewMode = searchParams?.get('review') === '1'
  const idx0 = Math.max(0, parseInt(params.index, 10) - 1) || 0
  const [questions, setQuestions] = useState<Question[]>([])
  const [q, setQ] = useState<Question | null>(null)
  const [selfAnswer, setSelfAnswer] = useState('')
  const [selfMulti, setSelfMulti] = useState<string[]>([])
  const [importance, setImportance] = useState('')
  const [acceptable, setAcceptable] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [tStart, setTStart] = useState<number>(0)
  const [participantId, setParticipantId] = useState<string | null>(null)

  useEffect(() => { fetchQuestions().then(setQuestions) }, [])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('participantId')
      if (!stored) {
        router.replace('/start')
        return
      }
      setParticipantId(stored)
    } catch {
      router.replace('/start')
    }
  }, [router])

  useEffect(() => {
    if (!participantId || reviewMode) return
    fetch(`/api/progress?participantId=${participantId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.status === 'completed') {
          router.replace('/done')
        }
      })
      .catch(() => {})
  }, [participantId, router, reviewMode])
  useEffect(() => {
    if (questions.length > 0) {
      const qq = questions[idx0]
      setQ(qq)
      setSelfAnswer('')
      setSelfMulti([])
      setImportance('A little')
      setAcceptable(null)
      try { setTStart(performance.now()) } catch {}
    }
  }, [questions, idx0])

  useEffect(() => {
    async function loadSaved() {
      if (!q || !participantId) return
      try {
        const res = await fetch(`/api/response?participantId=${participantId}&questionId=${q.id}`)
        if (!res.ok) {
          return
        }
        const data = await res.json()
        if (!data) {
          return
        }
        if (q.responseType === 'MC_MULTI') {
          try { setSelfMulti(data.selfAnswer ? JSON.parse(data.selfAnswer) : []) } catch { setSelfMulti([]) }
        } else {
          setSelfAnswer(data.selfAnswer || '')
        }
        try {
          const parsed = data.acceptable ? JSON.parse(data.acceptable) : null
          if (parsed) setAcceptable(parsed)
        } catch {}
        if (typeof data.importance === 'number') setImportance(labelFromImportance(data.importance))
      } catch {}
    }
    loadSaved()
  }, [q, participantId])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [q, selfAnswer, importance, acceptable])

  if (!q || !participantId) return <div className="container py-12">Loading…</div>

  const total = questions.length || 50
  const progress = Math.round(((idx0 + 1) / total) * 100)
  const prevProgress = idx0 > 0 ? Math.round((idx0 / total) * 100) : 0
  // section intro logic
  const showSectionIntro = idx0 === 0 || questions[idx0]?.section !== questions[idx0 - 1]?.section
  function sectionIntroFor(section?: string, responseType?: string) {
    const normalized = (section || '').toLowerCase()
    if (normalized.includes('pvq')) return COPY.sections.pvq21
    if (normalized.includes('tipi')) return COPY.sections.tipi
    if (responseType === 'MC_MULTI') return COPY.sections.mc_multi
    if (responseType && responseType.startsWith('MC_')) return COPY.sections.mc_single
    return COPY.sections.default
  }

  function withMeta(acc: any) {
    const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now()
    const tMs = Math.max(0, Math.round(now - (tStart || now)))
    let sameLikertAsPrev: boolean | undefined = undefined
    try {
      if (q && q.responseType.startsWith('Likert')) {
        const prev = localStorage.getItem('prevLikertSelf') || ''
        sameLikertAsPrev = prev && selfAnswer ? prev === selfAnswer : undefined
      }
    } catch {}
    const meta = sameLikertAsPrev === undefined ? { tMs } : { tMs, sameLikertAsPrev }
    return acc ? { ...acc, meta } : { meta }
  }

  function currentSelfPayload() {
    if (!q) return ''
    if (q.responseType === 'MC_MULTI') {
      const vals = q.id === 'Q47' ? selfMulti.slice(0, 3) : selfMulti
      return JSON.stringify(vals)
    }
    return selfAnswer
  }

  function hasSelf() {
    if (!q) return false
    return q.responseType === 'MC_MULTI' ? selfMulti.length > 0 : !!selfAnswer
  }

  async function goNext() {
    if (!hasSelf() || !importance || !acceptable) return
    if (!q) return
    if (!participantId) {
      router.replace('/start')
      return
    }
    const isLast = idx0 + 1 >= questions.length
    const payload = { participantId, questionId: q.id, selfAnswer: currentSelfPayload(), importance: parseImportance(importance), acceptable: JSON.stringify(withMeta(acceptable)), final: isLast }
    if (isLast) {
      setSaving(true)
      try { await saveResponse(payload); router.push('/done') } finally { setSaving(false) }
    } else {
      const suffix = reviewMode ? '?review=1' : ''
      fireAndForgetSave(payload); router.push(`/survey/${idx0 + 2}${suffix}`)
    }
  }
  async function goPrev() {
    if (idx0 === 0) return
    if (hasSelf() && importance && acceptable && q && participantId) {
      fireAndForgetSave({ participantId, questionId: q.id, selfAnswer: currentSelfPayload(), importance: parseImportance(importance), acceptable: JSON.stringify(withMeta(acceptable)), final: false })
    }
    const suffix = reviewMode ? '?review=1' : ''
    router.push(`/survey/${idx0}${suffix}`)
  }
  function parseImportance(label: string) {
    const map: Record<string, number> = { 'Irrelevant': 0, 'A little': 1, 'Somewhat': 10, 'Very': 50, 'Mandatory': 250 }
    return map[label] ?? 1
  }

  function maybeAutosave() {
    try {
      if (!q) return
      if (!hasSelf() || !importance || !acceptable) return
      if (participantId) {
        fireAndForgetSave({ participantId, questionId: q.id, selfAnswer: currentSelfPayload(), importance: parseImportance(importance), acceptable: JSON.stringify(withMeta(acceptable)), final: false })
      }
    } catch {}
  }
  function onSetSelf(val: string) {
    setSelfAnswer(val)
    if (q && q.responseType.startsWith('Likert')) {
      setAcceptable(prev => {
        if (!prev) {
          return { mode: 'range', tol: '±2 steps' }
        }
        if (prev.mode === 'values') {
          return prev
        }
        return prev 
      })
      try { localStorage.setItem('prevLikertSelf', val) } catch {}
    }
    setTimeout(() => maybeAutosave(), 0)
  }
  function onSetImportance(val: string) { setImportance(val); setTimeout(() => maybeAutosave(), 0) }
  function onSetAcceptableRange(label: string) {
    if (label === 'Same answer') {
      const confirmed = window.confirm('Are you sure the ONLY acceptable partner answer is the exact same as yours?')
      if (!confirmed) return
    }
    setAcceptable({ mode: 'range', tol: label })
    setTimeout(() => maybeAutosave(), 0)
  }
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
      {/* section intro card */}
      {showSectionIntro && sectionIntroFor(q.section, q.responseType) && (
        <div className="max-w-4xl mx-auto mb-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">{sectionIntroFor(q.section, q.responseType)!.title}</div>
            <div className="text-sm text-slate-600">{sectionIntroFor(q.section, q.responseType)!.intro}</div>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="max-w-4xl mx-auto">
          {(q.section || q.construct) && (
            <div className="text-xs uppercase tracking-wider text-slate-400 mb-2 font-medium">{q.section?.split(') ')[1] || q.section}{q.construct ? ` • ${q.construct}` : ''}</div>
          )}
          <div className="card p-4 sm:p-6 shadow-lg">
            <h2 className="text-lg sm:text-2xl font-semibold tracking-tight mb-4 text-slate-900 leading-tight">{q.text}</h2>
            <div className="space-y-4 divide-y divide-slate-200">
              <section className="pt-0">
                <div className="text-xs sm:text-sm font-semibold mb-1 text-slate-800">{COPY.triad.self.title}</div>
                <p className="text-[11px] sm:text-xs text-slate-500 mb-2">{COPY.triad.self.help}</p>
                {q.responseType.startsWith('Likert') ? (
                  <div className={`grid ${intFromType(q.responseType) === 7 ? 'grid-cols-7' : intFromType(q.responseType) === 6 ? 'grid-cols-6' : 'grid-cols-5'} gap-0.5 sm:gap-3`}>
                    {Array.from({ length: intFromType(q.responseType) }).map((_, i) => {
                      const label = String(i + 1)
                      const isSelected = selfAnswer === label
                      const maxValue = intFromType(q.responseType)
                      const acceptableValues = getAcceptableValues(selfAnswer, acceptable, maxValue)
                      const isAcceptable = acceptableValues.has(label)
                      const isHighlighted = isAcceptable && !isSelected && acceptable && (acceptable.mode === 'range' || acceptable.mode === 'values')
                      const verbal = q.anchors?.[i] ?? (q.responseType === 'Likert7' ? LIKERT7[i] : q.responseType === 'Likert6' ? LIKERT6[i] : undefined)
                      return (
                        <label key={i} className={`choice ${isSelected ? 'choice-selected' : ''} ${isSelected ? 'scale-105' : ''} ${isHighlighted ? 'choice-acceptable' : ''}`} aria-label={verbal || `Option ${label}`}>
                          <input className="sr-only" type="radio" name="self" value={label} onChange={() => onSetSelf(label)} />
                          <span className="font-semibold text-sm sm:text-base">
                            {label}
                            {verbal && <span className="block text-[8px] leading-tight sm:text-xs text-slate-500 mt-0.5">{verbal}</span>}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                ) : q.responseType === 'MC_MULTI' ? (
                  <div className="grid gap-2">
                    {q.options.map(opt => {
                      const checked = selfMulti.includes(opt.value)
                      return (
                        <label key={opt.value} className={`choice text-left ${checked ? 'choice-selected' : ''} ${checked ? 'scale-[1.02]' : ''} transition-transform`}>
                          <input type="checkbox" className="sr-only" checked={checked} onChange={e => {
                            const s = new Set(selfMulti)
                            if (e.target.checked) {
                              // enforce max-3 for Q47 selections
                              if (q.id === 'Q47' && s.size >= 3) {
                                // ignore extra selection beyond 3
                              } else {
                                s.add(opt.value)
                              }
                            } else {
                              s.delete(opt.value)
                            }
                            const arr = [...s]
                            setSelfMulti(arr)
                            // default acceptable for MC_MULTI to own selections when absent
                            if (!acceptable || acceptable.mode !== 'options') {
                              setAcceptable({ mode: 'options', opts: arr })
                            }
                            setTimeout(() => maybeAutosave(), 0)
                          }} />
                          <span className="block">{opt.label}</span>
                        </label>
                      )
                    })}
                    {q.id === 'Q47' && <div className="text-xs text-slate-500">Select up to 3.</div>}
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
                <div className="text-xs sm:text-sm font-semibold mb-1 text-slate-800">{COPY.triad.acceptable.title}</div>
                <p className="text-[11px] sm:text-xs text-slate-500">{COPY.triad.acceptable.help}</p>
                <p className="text-[10px] sm:text-[11px] mb-1 text-slate-500">{COPY.triad.acceptable.tip}</p>
                {q.responseType.startsWith('Likert') ? (
                  <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 sm:p-4 shadow-sm">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <button type="button" onClick={() => onSetAcceptableRange((acceptable?.mode === 'range' ? acceptable?.tol : '±2 steps') || '±2 steps')} className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition ${acceptable?.mode !== 'values' ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                        Pick a range
                      </button>
                      <button type="button" onClick={() => {
                        setAcceptable(prev => {
                          if (prev?.mode === 'values') return prev
                          const initial = prev?.vals?.length ? prev.vals : selfAnswer ? [selfAnswer] : []
                          return { mode: 'values', vals: initial }
                        })
                        setTimeout(() => maybeAutosave(), 0)
                      }} className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition ${acceptable?.mode === 'values' ? 'bg-brand-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                        Choose specific values
                      </button>
                    </div>
                    {acceptable?.mode === 'values' ? (
                      <div>
                        <div className="text-[10px] sm:text-xs uppercase tracking-wide text-slate-500 mb-2">Tap the answers you'd accept</div>
                        <div className={`grid ${intFromType(q.responseType) === 7 ? 'grid-cols-7' : intFromType(q.responseType) === 6 ? 'grid-cols-6' : 'grid-cols-5'} gap-0.5 sm:gap-3`}>
                          {Array.from({ length: intFromType(q.responseType) }).map((_, i) => {
                            const val = String(i + 1)
                            const active = acceptable?.vals?.includes(val)
                            const label = q.anchors?.[i] ?? (q.responseType === 'Likert7' ? LIKERT7[i] : q.responseType === 'Likert6' ? LIKERT6[i] : undefined)
                            return (
                              <button key={val} type="button" onClick={() => {
                                setAcceptable(prev => {
                                  const set = new Set(prev?.vals || [])
                                  set.has(val) ? set.delete(val) : set.add(val)
                                  return { mode: 'values', vals: [...set] }
                                })
                                setTimeout(() => maybeAutosave(), 0)
                              }} className={`choice flex flex-col items-center justify-center text-center ${active ? 'choice-selected scale-105' : ''}`}>
                                <span className="font-semibold text-sm sm:text-base">{val}</span>
                                {label && <span className="block text-[8px] leading-tight sm:text-[11px] text-slate-500">{label}</span>}
                              </button>
                            )
                          })}
                        </div>
                        <p className="mt-3 text-xs text-slate-500">Selected: {acceptable?.vals?.length ? acceptable.vals.join(', ') : 'none yet'}</p>
                      </div>
                    ) : (
                      <div>
                        <div className="text-[10px] sm:text-xs uppercase tracking-wide text-slate-500 mb-2">Pick a tolerance band</div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 sm:gap-3">
                          {ACCEPTABLE_LIKERT.map(label => {
                            const isSelected = acceptable?.mode === 'range' && acceptable?.tol === label
                            const isStrict = label === 'Same answer'
                            const strictClasses = isStrict ? (isSelected ? 'bg-rose-50 text-rose-700 ring-2 ring-rose-300 border-rose-200' : 'border-rose-200 text-rose-600 hover:bg-rose-50') : ''
                            return (
                              <button key={label} type="button" onClick={() => onSetAcceptableRange(label)} className={`choice flex items-center justify-center text-center ${isSelected ? 'choice-selected scale-105' : ''} ${strictClasses}`}>
                                {label}
                              </button>
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
                    {q.responseType === 'MC_MULTI' && (
                      <div className="text-xs text-slate-500 mt-1">
                        tip: acceptable defaults to your own selections; widen it if you’re flexible
                      </div>
                    )}
                  </div>
                )}
              </section>

              <section className="pt-4">
                <div className="text-xs sm:text-sm font-semibold mb-1 text-slate-800">{COPY.triad.importance.title}</div>
                <p className="text-[11px] sm:text-xs text-slate-500 mb-2">{COPY.triad.importance.help}</p>
                <div className="grid grid-cols-5 gap-0.5 sm:gap-3">
                  {LIKERT5_IMPORTANCE.map(label => {
                    const isSelected = importance === label
                    return (
                      <label key={label} title="This weight affects the match algorithm only." className={`choice flex items-center justify-center ${isSelected ? 'choice-selected' : ''} ${isSelected ? 'scale-105' : ''} transition-transform`}>
                        <input className="sr-only" type="radio" name="imp" value={label} onChange={() => onSetImportance(label)} />
                        <span className="text-[10px] sm:text-base font-medium text-center leading-tight">{label}</span>
                      </label>
                    )
                  })}
                </div>
                {(!importance || !acceptable) && (
                  <div className="text-xs text-amber-600 mt-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {!importance && !acceptable ? 'Please set acceptable partner answers and match importance to continue' : !importance ? 'Please set match importance to continue' : 'Please set acceptable partner answers to continue'}
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
                <button disabled={!hasSelf() || !importance || !acceptable || saving} onClick={goNext} className="px-6 py-2.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium shadow-sm">
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
