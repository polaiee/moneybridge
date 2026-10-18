import { useEffect, useRef, useState } from 'react'
import { CalendarDays, Check, ChevronDown } from 'lucide-react'

const MONTH = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
const OTHERS = ['Previous month', 'Last 3 months', 'Last 12 months']

/** The demo data is one snapshot, so only that period is selectable; the rest are shown disabled and say why. */
export default function PeriodPill() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const down = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('mousedown', down); window.addEventListener('keydown', key)
    return () => { window.removeEventListener('mousedown', down); window.removeEventListener('keydown', key) }
  }, [])
  return (
    <div ref={ref} className="relative">
      <button type="button" aria-haspopup="listbox" aria-expanded={open} aria-label={`Period: ${MONTH}, demo snapshot`} onClick={() => setOpen((o) => !o)}
        className="flex h-9 items-center gap-2 rounded-full border border-sand-300 bg-card px-3 text-xs font-semibold text-forest-900 transition-colors hover:border-forest-300 hover:bg-forest-50 active:bg-forest-100">
        <CalendarDays size={15} /><span>{MONTH}<span className="hidden sm:inline"> · Snapshot</span></span><ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <ul role="listbox" aria-label="Period" className="fade-in absolute right-0 top-[calc(100%+6px)] z-50 w-64 rounded-2xl border border-sand-200 bg-card p-1.5 shadow-pop">
          <li role="option" aria-selected className="flex items-center justify-between rounded-xl bg-lime-100 px-3 py-2 text-sm font-semibold"><span>{MONTH} · Snapshot</span><Check size={15} /></li>
          {OTHERS.map((o) => <li key={o} role="option" aria-selected={false} aria-disabled className="flex cursor-not-allowed items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm text-sand-400"><span>{o}</span><span className="text-2xs">No history in demo data</span></li>)}
        </ul>)}
    </div>
  )
}
