"use client"
import { useRouter, usePathname } from 'next/navigation'

export default function ClientHeader() {
  const router = useRouter()
  const pathname = usePathname()

  function signOut() {
    try { localStorage.removeItem('participantId') } catch {}
    if (pathname?.startsWith('/survey')) {
      router.push('/')
    } else {
      router.refresh()
    }
  }

  return (
    <button onClick={signOut} className="px-3 py-1.5 rounded border text-slate-700 hover:bg-slate-50">
      Save & Exit
    </button>
  )
}

