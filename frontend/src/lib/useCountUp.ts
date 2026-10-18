import { useEffect, useRef, useState } from 'react'

export const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Animates from the previous value to `value`. The final frame is always exactly `value`. */
export function useCountUp(value: number, ms = 600) {
  const [shown, setShown] = useState(value)
  const from = useRef(value)
  useEffect(() => {
    if (prefersReducedMotion() || from.current === value) { setShown(value); from.current = value; return }
    const start = performance.now(), a = from.current
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms)
      const eased = 1 - Math.pow(1 - t, 4)
      setShown(t >= 1 ? value : a + (value - a) * eased)
      if (t < 1) raf = requestAnimationFrame(tick); else from.current = value
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); from.current = value }
  }, [value, ms])
  return shown
}
