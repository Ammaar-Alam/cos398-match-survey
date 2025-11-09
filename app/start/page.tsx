
'use client'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'

async function createOrJoin(payload: any) {
  const res = await fetch('/api/register', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)})
  if (!res.ok) throw new Error('Registration failed')
  return await res.json()
}

export default function Start() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string>('')
  const [months, setMonths] = useState<number>(12)

  function fullNameFrom(parts: {first?:string; middle?:string; last?:string}) {
    const mi = parts.middle ? (parts.middle.endsWith('.') ? parts.middle : `${parts.middle}.`) : ''
    return [parts.first || '', mi, parts.last || ''].filter(Boolean).join(' ').replace(/\s+/g,' ').trim()
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
      setTimeout(() => { window.location.href = '/survey/1' }, 600)
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
        <form onSubmit={onSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md grid gap-4">
          <div>
            <label className="block text-sm font-medium">Couple Code *</label>
            <input name="coupleCode" required placeholder="e.g., TIGER-1234" className="mt-1 w-full border rounded-md px-3 py-2"/>
            <p className="text-xs text-slate-500 mt-1">If you're first, create one; if second, use your partner's code.</p>
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
              <label className="block text-sm font-medium">Princeton NetID *</label>
              <input name="netId" required className="mt-1 w-full border rounded-md px-3 py-2"/>
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
