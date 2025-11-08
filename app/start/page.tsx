
'use client'
import { useState } from 'react'

async function createOrJoin(payload: any) {
  const res = await fetch('/api/register', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)})
  if (!res.ok) throw new Error('Registration failed')
  return await res.json()
}

export default function Start() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: any) {
    e.preventDefault()
    setError(null); setLoading(true)
    const form = new FormData(e.currentTarget)
    const payload = Object.fromEntries(form.entries())
    try {
      const out = await createOrJoin(payload)
      // store participantId locally for the session
      localStorage.setItem('participantId', out.participantId)
      window.location.href = '/survey/1'
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container py-12">
      <h1 className="text-2xl font-semibold mb-6">Join the Couples Survey</h1>
      <form onSubmit={onSubmit} className="max-w-xl grid gap-4">
        <div>
          <label className="block text-sm font-medium">Couple Code</label>
          <input name="coupleCode" required placeholder="e.g., TIGER-1234" className="mt-1 w-full border rounded-md px-3 py-2"/>
          <p className="text-xs text-slate-500 mt-1">Share this code with your partner. If it doesn't exist, we’ll create it.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Your full name</label>
            <input name="fullName" required className="mt-1 w-full border rounded-md px-3 py-2"/>
          </div>
          <div>
            <label className="block text-sm font-medium">Princeton NetID</label>
            <input name="netId" required className="mt-1 w-full border rounded-md px-3 py-2"/>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Your email (optional)</label>
            <input type="email" name="email" className="mt-1 w-full border rounded-md px-3 py-2"/>
          </div>
          <div>
            <label className="block text-sm font-medium">Months together (optional)</label>
            <input type="number" name="monthsTogether" min="12" className="mt-1 w-full border rounded-md px-3 py-2"/>
          </div>
        </div>
        <div className="flex gap-3">
          <button disabled={loading} className="px-5 py-2 rounded-md bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50">
            {loading ? 'Please wait…' : 'Continue'}
          </button>
          {error && <div className="text-red-600 text-sm">{error}</div>}
        </div>
      </form>
    </div>
  )
}
