
import './globals.css'
import { ReactNode } from 'react'

export const metadata = {
  title: process.env.NEXT_PUBLIC_SITE_NAME || 'TigerMatch Couples Survey',
  description: 'Collecting couples questionnaire data for research.'
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          <header className="border-b bg-white/70 backdrop-blur sticky top-0 z-10">
            <div className="container py-3 flex items-center justify-between">
              <div className="font-semibold text-brand-700">TigerMatch</div>
              <nav className="text-sm text-slate-600">Couples Survey</nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t">
            <div className="container py-6 text-xs text-slate-500">
              © {new Date().getFullYear()} TigerMatch — Research use only
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
