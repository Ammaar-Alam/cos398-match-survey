"use client"
import { useMemo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'

export default function MathBlock({ tex, inline=false }: { tex: string, inline?: boolean }){
  const html = useMemo(() => {
    try {
      return katex.renderToString(tex, { throwOnError:false, displayMode: !inline })
    } catch {
      return tex
    }
  }, [tex, inline])

  if (inline) {
    // inline math should render as a span to avoid invalid <div> inside <p>
    return <span className="align-middle" dangerouslySetInnerHTML={{ __html: html }} />
  }
  return (
    <div className="my-2 w-full overflow-x-auto overflow-y-hidden px-1">
      <div className="mx-auto max-w-full text-center">
        <div className="inline-block px-1 text-xs leading-relaxed sm:text-sm md:text-base" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  )
}
