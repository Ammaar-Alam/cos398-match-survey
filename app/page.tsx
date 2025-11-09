
'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="container py-16">
      <motion.div initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} transition={{duration:0.4}} className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold tracking-tight text-brand-700">TigerMatch Research Study</h1>
          <p className="text-slate-600 mt-3">Help us understand romantic compatibility through a comprehensive couples questionnaire</p>
        </div>

        <div className="bg-white border rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-3">About This Study</h2>
          <p className="text-slate-600 mb-6">This study examines how personality traits, values, and lifestyle preferences relate to relationship compatibility. You and your partner will each independently complete a 50‑question survey that takes approximately 20–25 Minutes.</p>

          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <Feature icon={<ClockIcon/>} title="20–25 Minutes" desc="Complete at your own pace"/>
            <Feature icon={<ShieldIcon/>} title="Confidential" desc="Your data is secure"/>
            <Feature icon={<HeartIcon/>} title="For Couples" desc="Both partners participate"/>
          </div>

          <ul className="list-disc pl-6 text-slate-700 space-y-2 mb-6">
            <li>Answer 50 questions about your personality, values, and preferences</li>
            <li>For each question, indicate your answer, what you’d accept from a partner, and how important it is</li>
            <li>Navigate easily with keyboard shortcuts (arrow keys)</li>
            <li>Your progress is automatically saved as you go</li>
          </ul>

          <div className="rounded-md bg-blue-50 text-blue-900 text-sm p-3 mb-6">Important: you and your partner will complete the survey separately. You’ll share a “Couple Code” to link your responses.</div>

          <div className="flex items-center gap-4 justify-center">
            <Link prefetch className="inline-flex px-6 py-3 rounded-md bg-brand-600 text-white hover:bg-brand-700 shadow" href="/start">Begin Questionnaire</Link>
            <Link className="text-brand-700 hover:underline" href="/privacy">Privacy Policy</Link>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-slate-500">Questions? Contact the research team. Participation is voluntary; you may withdraw at any time.</div>
      </motion.div>
    </div>
  )
}

function Feature({ icon, title, desc }: { icon: JSX.Element, title: string, desc: string }) {
  return (
    <div className="rounded-xl border p-4 flex items-start gap-3">
      <div className="text-brand-600">{icon}</div>
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-slate-600 text-sm">{desc}</div>
      </div>
    </div>
  )
}

function ClockIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
  )
}
function ShieldIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>
  )
}
function HeartIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.8 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>
  )
}
