import { Sparkles } from 'lucide-react'
import type { SimResult } from '../../api'
import { Button, Eyebrow, HypoBadge, Money, Skeleton } from '../../components/ui'
import { pct, usd } from '../../lib/format'

/** Sticky stat strip: ending value, signed delta vs the current plan, weighted fee, and a compact AI action. */
export default function SummaryBar({ sim, busy, onExplain, className = '' }: { sim: SimResult | null; busy: boolean; onExplain: () => void; className?: string }) {
  const diff = sim?.difference_at_end ?? 0
  return (
    <div role="region" aria-label="Summary" className={`sticky top-14 z-20 rounded-[20px] border border-sand-200 bg-card/95 px-4 py-2.5 shadow-md backdrop-blur sm:py-3 ${className}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-x-5 sm:gap-y-2">
        {!sim ? <div className="flex items-center gap-6"><Skeleton className="h-9 w-40" /><Skeleton className="h-9 w-28" /></div> : (
          <div className="flex items-end justify-between gap-x-6 sm:items-center sm:justify-start">
            <div className="min-w-0"><Eyebrow>Hypothetical ending value</Eyebrow>
              <div className="flex items-center gap-2"><Money value={sim.hypothetical.ending_value} className="text-2xl font-medium leading-tight text-forest-900 sm:text-[28px]" />{busy && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-forest-600 border-t-transparent" role="status" aria-label="Updating" />}</div></div>
            <div><Eyebrow>vs current plan</Eyebrow>
              <span data-testid="summary-diff" className={`num mt-0.5 inline-flex rounded-full px-3 py-0.5 text-sm font-semibold sm:text-base ${diff >= 0 ? 'bg-lime-400 text-forest-900' : 'bg-coral-50 text-coral-600'}`}>{diff >= 0 ? '+' : '−'}{usd(Math.abs(diff))}</span></div>
            <div className="hidden sm:block"><Eyebrow>Weighted fee</Eyebrow><div className="num text-base font-semibold">{pct(sim.weighted_expense_ratio_pct)}</div></div>
          </div>)}
        <div className="flex items-center justify-between gap-2 sm:justify-end"><HypoBadge>Illustrative estimate</HypoBadge><Button variant="ai" size="sm" onClick={onExplain} aria-label="Explain This Scenario" className="shrink-0"><Sparkles size={14} /><span className="sm:hidden">Explain</span><span className="hidden sm:inline">Explain This Scenario</span></Button></div>
      </div>
    </div>
  )
}
