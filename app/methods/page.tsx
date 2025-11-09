"use client"
import { motion } from 'framer-motion'
import MathBlock from '../components/MathBlock'
import Link from 'next/link'

export default function MethodsPage(){
  return (
    <div className="container py-12">
      <motion.div initial={{opacity:0, y:8}} animate={{opacity:1, y:0}} transition={{duration:0.35}} className="max-w-5xl mx-auto">
        {/* hero */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 bg-gradient-to-r from-slate-50 to-slate-100 px-3 py-1.5 rounded-full border border-slate-200/50">Overview</div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-900">Methods & Math</h1>
          <p className="text-slate-600 mt-2 text-lg leading-relaxed">A high‑level description of the baseline algorithm and the ML refinement.</p>
        </div>

        {/* three cards */}
        <div className="grid gap-5 sm:grid-cols-3 mb-10">
          <MethodCard title="Baseline scorer" desc="Mutual satisfaction with per‑domain weights + user priorities; overlap penalty c/√n."/>
          <MethodCard title="Evaluation" desc="True partners vs sampled non‑partners: AUC, lift, median rank proxy."/>
          <MethodCard title="ML refinement" desc="Learn domain multipliers via logistic regression (5‑fold CV); re‑evaluate."/>
        </div>

        {/* process steps */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200 rounded-2xl p-8 mb-10 shadow-sm">
          <h2 className="text-xl font-bold mb-5 text-slate-900">How it works</h2>
          <ol className="space-y-3">
            <Step n={1} text="Invitation‑only: each partner completes a 50‑item questionnaire independently." />
            <Step n={2} text="Baseline scorer computes mutual scores; evaluation checks whether true partners outrank sampled non‑partners (AUC, lift, median rank)." />
            <Step n={3} text="Interpretable ML learns domain multipliers from outcomes (5‑fold CV) and we re‑evaluate to assess improvement." />
          </ol>
        </div>

        {/* math card */}
        <div className="bg-white border-2 border-slate-200 rounded-2xl shadow-lg p-8 mb-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-brand-600 to-brand-500"></div>
          <h3 className="text-xl font-bold mb-4 text-slate-900">Scoring sketch</h3>
          <p className="text-slate-700 mb-4 leading-relaxed">Per item <em className="font-semibold text-slate-900">i</em> in domain <em className="font-semibold text-slate-900">d(i)</em>, we record self answer, acceptable partner answers, and importance. Directional satisfaction:</p>
          <div className="my-6 bg-slate-50 rounded-xl p-6 border border-slate-200">
            <MathBlock tex={String.raw` s_A(B) \,=\, \frac{\sum_{i\in\mathcal I_{AB}} W_i^A \cdot I_i^A(B)}{\sum_{i\in\mathcal I_{AB}} W_i^A} `} />
          </div>
          <p className="text-slate-700 mb-6 leading-relaxed">with per‑item weight <MathBlock inline tex={String.raw`W_i^A = w_i^A\, m_{d(i)}\, p_{d(i)}^A`} /> (domain multiplier <MathBlock inline tex={String.raw`m_{d}`}/> and user‑priority factor <MathBlock inline tex={String.raw`p_{d}^A\in\{1,1.5\}`}/>).</p>
          <div className="my-4 border-t border-slate-200"></div>
          <p className="text-slate-700 mb-4 font-semibold">Mutuality & penalty:</p>
          <div className="my-6 bg-slate-50 rounded-xl p-6 border border-slate-200">
            <MathBlock tex={String.raw` \text{Match} \,=\, 100\,\sqrt{s_A(B)\, s_B(A)},\qquad \text{FinalMatch} \,=\, \max\bigl(0,\, \text{Match} - \frac{c}{\sqrt{n}}\bigr) `} />
          </div>
          <div className="mt-6 pt-4 border-t border-slate-200">
            <p className="text-slate-500 text-sm leading-relaxed italic">Some specifics (e.g., certain acceptability heuristics and domain calibrations) are redacted on this page; complete documentation is maintained for review and replication.</p>
          </div>
        </div>

        {/* metrics & domains */}
        <div className="grid gap-5 sm:grid-cols-2 mb-10">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-bold mb-4 text-slate-900">Evaluation metrics</h3>
            <ul className="text-slate-700 space-y-2.5">
              <li className="flex items-start gap-2">
                <span className="font-bold text-brand-600 mt-0.5">AUC:</span>
                <span>against sampled non‑partners (Mann–Whitney U).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-brand-600 mt-0.5">Lift:</span>
                <span>difference in mean score (true couples vs distractors).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-brand-600 mt-0.5">Median rank:</span>
                <span>proxy based on sampled distractors.</span>
              </li>
            </ul>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-bold mb-4 text-slate-900">Interpretable ML (secondary)</h3>
            <p className="text-slate-700 leading-relaxed">We learn per-domain weights via logistic regression on per-domain mutual satisfactions. This keeps the model transparent and auditable while allowing data-driven refinement.</p>
          </div>
        </div>

        {/* footer ctas */}
        <div className="mt-8 flex items-center gap-3">
          <Link href="/" className="px-5 py-2.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors font-medium">Back</Link>
          <Link href="/start" className="px-6 py-2.5 rounded-md bg-brand-600 text-white hover:bg-brand-700 transition-colors font-medium shadow-sm">Begin Questionnaire</Link>
        </div>
      </motion.div>
    </div>
  )
}

function MethodCard({ title, desc }: { title:string, desc:string }){
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-200 hover:border-slate-300">
      <div className="text-base font-bold text-slate-900 mb-2">{title}</div>
      <div className="text-slate-600 text-sm leading-relaxed">{desc}</div>
    </div>
  )
}

function Step({ n, text }: { n:number, text:string }){
  return (
    <li className="flex items-start gap-4">
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-white text-sm font-bold mt-0.5 shadow-sm flex-shrink-0">{n}</span>
      <span className="text-slate-700 leading-relaxed pt-0.5">{text}</span>
    </li>
  )
}
