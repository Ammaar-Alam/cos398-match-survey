
'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function Done() {
  return (
    <div className="container py-16">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="max-w-2xl mx-auto text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">Thank you!</h1>
          <p className="text-lg text-slate-600 mb-2">Your responses have been successfully recorded.</p>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8 text-left">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className="font-semibold text-blue-900 mb-1">Next Steps</div>
              <p className="text-sm text-blue-800">Your partner should use the same <strong>Couple Code</strong> to complete their survey. Both responses will be linked automatically.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="px-6 py-2.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors font-medium">
            Return Home
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
