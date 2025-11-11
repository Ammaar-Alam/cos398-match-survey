
'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

type ProgressSummary = {
  status: 'not_started' | 'in_progress' | 'completed'
  answered: number
  total: number
  resumePath: string
}

async function createOrJoin(payload: any) {
  const res = await fetch('/api/register', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)})
  if (!res.ok) {
    let msg = 'Registration failed'
    try { const j = await res.json(); if (j?.error) msg = j.error } catch {}
    throw new Error(msg)
  }
  return await res.json()
}

async function fetchProgressSummary(participantId: string): Promise<ProgressSummary | null> {
  try {
    const res = await fetch(`/api/progress?participantId=${participantId}`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export default function Start() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string>('')
  const [months, setMonths] = useState<number>(12)
  const [resumeInfo, setResumeInfo] = useState<ProgressSummary | null>(null)

  function fullNameFrom(parts: {first?:string; middle?:string; last?:string}) {
    const mi = parts.middle ? (parts.middle.endsWith('.') ? parts.middle : `${parts.middle}.`) : ''
    return [parts.first || '', mi, parts.last || ''].filter(Boolean).join(' ').replace(/\s+/g,' ').trim()
  }

  useEffect(() => {
    try {
      const participantId = localStorage.getItem('participantId')
      if (!participantId) return
      fetchProgressSummary(participantId).then(info => {
        if (info) setResumeInfo(info)
      })
    } catch {}
  }, [])

  async function goToProgress(participantId: string) {
    const info = await fetchProgressSummary(participantId)
    const destination = info?.resumePath || '/survey/1'
    window.location.href = destination
  }

  async function onSubmit(e: any) {
    e.preventDefault()
    setError(null); setLoading(true)
    const form = new FormData(e.currentTarget)
    const coupleCode = String(form.get('coupleCode') || '')
    const firstName = String(form.get('firstName') || '')
    const middleInitial = String(form.get('middleInitial') || '')
    const lastName = String(form.get('lastName') || '')
    const netId = String(form.get('netId') || '')
    const email = String(form.get('email') || '') || undefined
    const fullName = fullNameFrom({ first:firstName, middle:middleInitial, last:lastName })
    try {
      const out = await createOrJoin({ coupleCode, fullName, netId, email, monthsTogether: months || undefined })
      localStorage.setItem('participantId', out.participantId)
      setToast('Registration successful')
      await goToProgress(out.participantId)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gradient-to-b from-slate-50/60 to-white">
      <motion.div initial={{opacity:0, y:8, scale:0.98}} animate={{opacity:1, y:0, scale:1}} transition={{duration:0.35}}
        className="w-full max-w-xl px-4">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-semibold">Register for TigerMatch Study</h1>
          <p className="text-slate-600 mt-1">Both partners should use the same Couple Code.</p>
        </div>
        <AnimatePresence>{resumeInfo && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 shadow-sm"
          >
            <motion.div className="text-emerald-900 font-semibold flex items-center gap-2" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}>
              <motion.span
                className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
                initial={{ scale: 0.4, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 16 }}
              >
                ✓
              </motion.span>
              {resumeInfo.status === 'completed' ? 'You already finished this survey.' : 'Resume where you left off'}
            </motion.div>
            <p className="text-emerald-800 text-sm mt-1">
              {resumeInfo.status === 'completed'
                ? 'Open the summary page to review next steps or share feedback.'
                : `Progress: ${Math.round((resumeInfo.answered / Math.max(1, resumeInfo.total)) * 100)}% (${resumeInfo.answered} of ${resumeInfo.total} items).`}
            </p>
            <motion.div className="mt-3 flex flex-wrap gap-3" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => window.location.href = resumeInfo.resumePath}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                {resumeInfo.status === 'completed' ? 'View completion page' : 'Jump back in'}
              </motion.button>
              <button onClick={() => { localStorage.removeItem('participantId'); setResumeInfo(null) }}
                className="text-sm font-medium text-emerald-900 underline-offset-2 hover:underline">
                Not you? Clear saved session
              </button>
            </motion.div>
          </motion.div>
        )}</AnimatePresence>
        <form onSubmit={onSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md grid gap-4">
          <div>
            <label className="block text-sm font-medium">Couple Code *</label>
            <input name="coupleCode" required placeholder="e.g., TIGER-1234" className="mt-1 w-full border rounded-md px-3 py-2"/>
            <p className="text-xs text-slate-500 mt-1">Invitation‑only. Don’t have a code? contact the researcher to request one.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-sm font-medium">First Name *</label>
              <input name="firstName" required className="mt-1 w-full border rounded-md px-3 py-2"/>
            </div>
            <div>
              <label className="block text-sm font-medium">Middle Initial</label>
              <input name="middleInitial" maxLength={2} placeholder="(optional)" className="mt-1 w-full border rounded-md px-3 py-2"/>
            </div>
            <div>
              <label className="block text-sm font-medium">Last Name *</label>
              <input name="lastName" required className="mt-1 w-full border rounded-md px-3 py-2"/>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Princeton NetID</label>
              <input name="netId" placeholder="(optional)" className="mt-1 w-full border rounded-md px-3 py-2"/>
            </div>
            <div>
              <label className="block text-sm font-medium">Email</label>
              <input type="email" name="email" placeholder="(optional)" className="mt-1 w-full border rounded-md px-3 py-2"/>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium">Months Together</label>
            <input type="number" name="monthsTogether" min={12} step={1} value={months}
              onChange={e => setMonths(Math.max(12, Number(e.target.value || 12)))}
              className={"mt-1 w-full border rounded-md px-3 py-2 " + (months===12?'text-slate-400':'text-slate-900')}
            />
            <p className="text-xs text-slate-500 mt-1">Minimum 12 months.</p>
          </div>
          <div className="flex items-center gap-3 justify-end">
            <button disabled={loading} className="px-5 py-2 rounded-md bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 shadow-sm">
              {loading ? 'Please wait…' : 'Begin Questionnaire'}
            </button>
            {error && <div className="text-red-600 text-sm">{error}</div>}
          </div>
        </form>
      </motion.div>

      {toast && (
        <motion.div initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} exit={{opacity:0}} className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-2 rounded-md shadow-lg">
          {toast}
        </motion.div>
      )}
    </div>
  )
}
