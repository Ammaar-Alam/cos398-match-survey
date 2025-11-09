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
  return <div className="my-2" dangerouslySetInnerHTML={{ __html: html }} />
}
