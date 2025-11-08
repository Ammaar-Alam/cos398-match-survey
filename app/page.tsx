
'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="container py-16">
      <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{duration:0.6}} className="max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Couples Questionnaire — Research Study
        </h1>
        <p className="text-lg text-slate-700 mb-6">
          This survey collects responses from couples who have been together for 12+ months. 
          We use your answers to evaluate matching algorithms offline. The app does <b>not</b> do any matching—
          it only collects responses for research.
        </p>
        <ul className="list-disc pl-6 text-slate-700 space-y-1 mb-8">
          <li>Approx. 12–13 minutes, one question per page with keyboard navigation.</li>
          <li>Each item asks for your answer, acceptable partner answers, and importance.</li>
          <li>We only require your Princeton NetID and names to link partners.</li>
        </ul>
        <div className="flex items-center gap-3">
          <Link className="inline-flex px-5 py-3 rounded-md bg-brand-600 text-white hover:bg-brand-700"
                href="/start">Begin</Link>
          <Link className="text-brand-700 hover:underline" href="/privacy">Privacy</Link>
        </div>
      </motion.div>
    </div>
  )
}
