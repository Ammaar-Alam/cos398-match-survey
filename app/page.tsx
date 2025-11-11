'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function Home() {
  const fadeUp = {
    hidden: { opacity: 0, y: 32, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } }
  }

  return (
    <div className="container py-16">
      <motion.div initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} transition={{duration:0.4}} className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold tracking-tight text-brand-700">TigerMatch Research Study</h1>
          <p className="text-slate-600 mt-3">Help us understand romantic compatibility through a comprehensive couples questionnaire</p>
        </div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          className="bg-white border rounded-2xl shadow-sm p-6"
        >
          <h2 className="text-lg font-semibold mb-3">About This Study</h2>
          <p className="text-slate-600 mb-6">This study examines how personality traits, values, and lifestyle preferences relate to relationship compatibility. You and your partner will each independently complete a 50‑question survey that takes approximately 20–25 Minutes.</p>

          <motion.div className="grid sm:grid-cols-3 gap-4 mb-6" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.4 }}>
            <Feature icon={<ClockIcon/>} title="20–25 Minutes" desc="Complete at your own pace"/>
            <Feature icon={<ShieldIcon/>} title="Confidential" desc="Your data is secure"/>
            <Feature icon={<HeartIcon/>} title="For Couples" desc="Both partners participate"/>
          </motion.div>

          <ul className="list-disc pl-6 text-slate-700 space-y-2 mb-6">
            <li>Answer 50 questions about your personality, values, and preferences</li>
            <li>For each question, indicate your answer, what you’d accept from a partner, and how important it is</li>
            <li>Navigate easily with keyboard shortcuts (arrow keys)</li>
            <li>Your progress is automatically saved as you go</li>
          </ul>

          <div className="rounded-md bg-blue-50 text-blue-900 text-sm p-3 mb-6">Important: you and your partner will complete the survey separately. You’ll share a “Couple Code” to link your responses.</div>

          <motion.div className="flex items-center gap-4 justify-center" initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.3, ease: 'easeOut', delay: 0.05 }}>
            <Link prefetch className="inline-flex px-6 py-3 rounded-md bg-brand-600 text-white hover:bg-brand-700 shadow" href="/start">Begin Questionnaire</Link>
            <Link className="px-4 py-2 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50" href="/methods">Methods & Math</Link>
            <Link className="text-brand-700 hover:underline" href="/privacy">Privacy Policy</Link>
          </motion.div>
        </motion.div>

        <motion.div
          className="mt-12 grid gap-5 lg:grid-cols-2"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.35 }}
        >
          <motion.section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.35, ease: 'easeOut' }}>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Research lens</p>
            <h3 className="mt-1 text-2xl font-semibold text-slate-900">What we&apos;re modeling</h3>
            <p className="mt-3 text-sm text-slate-700 leading-relaxed">
              We&apos;re probing whether an interpretable scoring functional can consistently recover true partners from a massive synthetic negative sample. Each respondent yields a directed acceptability window (what you&apos;d tolerate) plus an importance gradient (how costly a mismatch is), which we treat as a utility surface. Those surfaces feed logistic, calibrated-margin, and boosted heuristics to see which rule best separates held-out couples from randomized pairings.
            </p>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <div className="flex items-start gap-2"><DotIcon/><span>Assemble mutuality tensors from answer / tolerance / importance vectors to capture asymmetric fit.</span></div>
              <div className="flex items-start gap-2"><DotIcon/><span>Apply finite-sample regularization and light fairness constraints so the score stays interpretable.</span></div>
              <div className="flex items-start gap-2"><DotIcon/><span>Track ROC/AUC lift, calibration, and stability to test whether a single algorithm can generalize across cohorts.</span></div>
            </div>
            <p className="mt-4 text-xs text-slate-500 italic">Bottom line: we&apos;re asking if an “optimal” couple-matching algorithm exists in practice and what guarantees it can honestly make.</p>
          </motion.section>

          <motion.section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-blue-50/40 p-6 shadow-sm" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: 0.35, ease: 'easeOut', delay: 0.05 }}>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Participation &amp; outputs</p>
            <h3 className="mt-1 text-2xl font-semibold text-slate-900">What you commit &amp; receive</h3>
            <div className="mt-5 grid gap-4">
              <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-inner">
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-400">Requirements</p>
                <ul className="mt-3 space-y-3 text-sm text-slate-700">
                  <li className="flex items-start gap-3"><BadgeCheckIcon/><span>Both partners complete the 50-question instrument separately but with the same Couple Code.</span></li>
                  <li className="flex items-start gap-3"><BadgeCheckIcon/><span>Responses stay private; only aggregated statistics show up in COS 398 deliverables.</span></li>
                  <li className="flex items-start gap-3"><BadgeCheckIcon/><span>After both submissions, you can request your compatibility score plus a short interpretation.</span></li>
                </ul>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-white p-4 text-sm text-blue-900 shadow-sm">
                <div className="flex items-start gap-3">
                  <svg className="mt-0.5 h-5 w-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"/></svg>
                  <p>
                    The score is a research artifact—it measures how strongly the current model distinguishes your pair from synthetic matches. Think of it as a benchmark against the learned algorithm, not a deterministic forecast for your relationship.
                  </p>
                </div>
              </div>
            </div>
          </motion.section>
        </motion.div>

        <motion.div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50/80 p-4 text-center text-sm text-indigo-900 shadow-sm" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }}>
          Data collection is still underway; once enough datapoints are collected and the findings are finalized, the paper will be published for COS 398.
        </motion.div>

        <div className="mt-8 text-center text-sm text-slate-500">Questions? Contact <a href="https://ammaaralam.com" className="text-blue-600 hover:underline">Ammaar Alam</a>. Participation is voluntary; you may withdraw at any time.</div>
      </motion.div>
    </div>
  )
}

function Feature({ icon, title, desc }: { icon: JSX.Element, title: string, desc: string }) {
  return (
    <motion.div
      className="rounded-xl border p-4 flex items-start gap-3 bg-white/80"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, boxShadow: '0 18px 30px rgba(15,23,42,0.12)' }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      viewport={{ once: true, amount: 0.5 }}
    >
      <div className="text-brand-600">{icon}</div>
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-slate-600 text-sm">{desc}</div>
      </div>
    </motion.div>
  )
}

function CheckIcon() {
  return (
    <svg className="mt-0.5 text-emerald-600" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
  )
}

function DotIcon() {
  return (
    <svg className="mt-1 text-slate-400" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="4"/></svg>
  )
}

function BadgeCheckIcon() {
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
    </span>
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
