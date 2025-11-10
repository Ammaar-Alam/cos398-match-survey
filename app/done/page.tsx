
'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'

const pipelineSteps = [
  {
    title: 'Export & structure',
    body: 'Responses from both partners are exported to CSV, combined with your Couple Code, and lightly anonymized before analysis.'
  },
  {
    title: 'Baseline scorer',
    body: 'The directed acceptability + importance model (geometric mutuality, overlap gate, finite-sample penalty) produces a raw FinalMatch score for each partner pairing.'
  },
  {
    title: 'Algorithm variants + ML',
    body: 'We run multiple variations (domain multipliers, boosted priorities, interpretable logistic regression, calibration sweeps) to see which setup best separates real partners from sampled non-partners.'
  }
]

const feedbackPrompts = [
  'Which sections caused fatigue or felt repetitive?',
  'Any ambiguous wording, missing options, or places you had to guess?',
  'Did the questionnaire on your phone? How did the mobile experience feel?'
]

export default function Done() {
  return (
    <div className="container py-14 sm:py-16">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="mx-auto max-w-3xl space-y-8">
        <header className="text-center space-y-3">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-brand-100">
            <svg className="h-8 w-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Thank you for finishing!</h1>
          <p className="text-lg text-slate-600">Your responses are locked in. Once <span className="font-semibold">both partners</span> have finished, let me know and I'll queue your pair for analysis.</p>
        </header>

        <section className="rounded-2xl border border-blue-100 bg-blue-50/60 p-6 text-left shadow-sm">
          <div className="flex items-start gap-3">
            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h2 className="text-lg font-semibold text-blue-900">Let me know when the couple is done</h2>
              <p className="text-sm text-blue-900/80">
                Message me once you're both done and I'll begin calculating your match score and add the couple score to the training dataset.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">What happens to your data now?</h2>
          <p className="mt-2 text-slate-600">Here's the pipeline that runs right after export; TDLR: math, just a bunch of math.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {pipelineSteps.map(step => (
              <div key={step.title} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-sm text-slate-700">
                <div className="font-semibold text-slate-900">{step.title}</div>
                <p className="mt-1 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-600">
            After the variants finish, I compare ROC/AUC, lift, and the interpretable ML coefficients. <br /> <b> If you would like to see your provisional match score, I can share it, but please remember the main research finding so far: even a “perfect” numerical match is not a guarantee of relationship success.</b>
          </p>
        </section>

        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-amber-900">Any Feedback?</h2>
          <p className="text-sm text-amber-900/80">This site was made last-minute to collect and run the data in one flow. The frontend was built with heavy assistance from AI, and there is likely a few bugs/improvements I missed. Tell me anything that felt clunky:</p>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-amber-900/90">
            {feedbackPrompts.map(item => <li key={item}>{item}</li>)}
          </ul>
          <p className="mt-3 text-sm text-amber-900/90">Any feedback at all, about any part of the process, is greatly appreciated.</p>
        </section>

        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-emerald-900">Know another couple?</h2>
          <p className="text-sm text-emerald-900/80">The more couples we can add to the dataset–the more accurate and generalizable our algorithm can become. If you know a couple that has been together ≥1 year (ages 18–22, doesn't have to be Princeton students) refer them to me! Referrals help the dataset a ton.</p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Thanks again!</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-600 text-sm">
            <li>Want your couple's match score? Let me know (and pls understand match score ≠ relationship success)</li>
            <li>If anything weird happens when your partner logs in, or if they encounter any issues, just let me know.</li>
            <li>Want to compare one another's answers, or change them and see how your match score changes? Feel free, but just let me know in advance so it doesn't affect our analysis.</li>
          </ul>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Link href="mailto:tigermatch@princeton.edu" className="flex-1 rounded-md bg-brand-600 px-4 py-2 text-center text-white shadow-sm hover:bg-brand-700">Email Ammaar</Link>
            <Link href="/" className="flex-1 rounded-md border border-slate-300 px-4 py-2 text-center font-medium text-slate-700 hover:bg-slate-50">Back to home</Link>
          </div>
        </section>
      </motion.div>
    </div>
  )
}
