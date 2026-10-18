import { useEffect, useState } from 'react'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

/**
 * Reveals `text` one character at a time, pausing a little after punctuation.
 * `key` identifies the line, so the same text said twice still restarts.
 * With reduced motion the whole line appears at once.
 */
export function useTypewriter(key: number, text: string, msPerChar: number) {
  const reducedMotion = usePrefersReducedMotion()
  const [state, setState] = useState({ key, count: 0 })

  // Reset during render when a new line arrives, so no stale frame is shown.
  if (state.key !== key) setState({ key, count: 0 })
  const count = reducedMotion ? text.length : state.key === key ? state.count : 0

  useEffect(() => {
    if (reducedMotion || count >= text.length) return
    const prev = text[count - 1] ?? ''
    const delay = /[.!?]/.test(prev) ? msPerChar * 8 : /[,;:]/.test(prev) ? msPerChar * 4 : msPerChar
    const timer = setTimeout(
      () => setState((s) => (s.key === key ? { key, count: s.count + 1 } : s)),
      delay,
    )
    return () => clearTimeout(timer)
  }, [key, text, count, msPerChar, reducedMotion])

  return {
    shown: text.slice(0, count),
    done: count >= text.length,
    skip: () => setState({ key, count: text.length }),
  }
}
