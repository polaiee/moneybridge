import type { Dashboard } from '../../api'
import type { TwinForm } from '../../store'
import { Card, HypoBadge, SectionHead } from '../../components/ui'
import { pct } from '../../lib/format'
import { FUND, num } from './model'

const H = 220 // px, bar height

/** One tall stacked bar. Segments are fund weights; hovering/focusing one highlights that fund everywhere. */
function Bar({ title, weights, names, hover, setHover, badge }: { title: string; weights: number[]; names: string[]; hover: number | null; setHover: (i: number | null) => void; badge?: boolean }) {
  const total = weights.reduce((a, b) => a + b, 0)
  const scale = total > 100 ? total : 100
  return (
    <div className="flex min-w-0 flex-1 flex-col items-center">
      <div className="mb-2 flex min-h-[44px] flex-col items-center justify-start gap-1 text-center"><span className="eyebrow">{title}</span>{badge && <HypoBadge />}</div>
      <div className="flex w-full max-w-[92px] flex-col justify-start gap-[3px] overflow-hidden rounded-2xl bg-sand-100 p-[3px]" style={{ height: H }} role="img" aria-label={`${title} allocation: ${names.map((n, i) => `${n} ${weights[i]}%`).join(', ')}`}>
        {weights.map((w, i) => (
          <div key={names[i]} tabIndex={0} data-seg={`${title}-${i}`} aria-label={`${title}: ${names[i]} ${w}%`}
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}
            className={`flex items-end justify-center rounded-xl pb-1.5 transition-all duration-200 ${hover !== null && hover !== i ? 'opacity-40' : ''} ${hover === i ? 'shadow-md' : ''}`}
            style={{ height: `${(w / scale) * 100}%`, background: FUND[i % 3].bg, color: FUND[i % 3].fg, minHeight: w > 0 ? 6 : 0 }}>
            {w >= 8 && <span className="num rounded-full px-2 py-0.5 text-xs font-semibold" style={{ background: FUND[i % 3].chip }}>{w}%</span>}
          </div>))}
      </div>
    </div>
  )
}

/** Side-by-side tall stacked bars (Current vs Hypothetical) with delta chips between them. */
export default function AllocationCompare({ dash, form, hover, setHover, className = '' }: {
  dash: Dashboard; form: TwinForm; hover: number | null; setHover: (i: number | null) => void; className?: string
}) {
  const names = dash.portfolio.holdings.map((h) => h.name)
  const cur = dash.portfolio.holdings.map((h) => h.allocation_pct)
  const hyp = form.holdings.map((h) => num(h.weight) || 0)
  const total = hyp.reduce((a, b) => a + b, 0)
  const scale = total > 100 ? total : 100
  const center = (ws: number[], i: number) => ((ws.slice(0, i).reduce((a, b) => a + b, 0) + ws[i] / 2) / scale) * 100
  return (
    <Card className={className}>
      <SectionHead title="Allocation comparison" sub="Current versus hypothetical" />
      <div className="flex items-stretch gap-1">
        <Bar title="Current" weights={cur} names={names} hover={hover} setHover={setHover} />
        {/* delta chips sit between the bars at the mid-height of each fund's segment */}
        <div className="relative w-[68px] shrink-0 sm:w-[84px]" style={{ marginTop: 52, height: H }} aria-label="Change in weight">
          {names.map((n, i) => {
            const d = Math.round((hyp[i] - cur[i]) * 100) / 100
            const y = (center(cur, i) + center(hyp, i)) / 2
            return (
              <span key={n} data-delta={i} className={`num absolute left-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold transition-opacity ${hover !== null && hover !== i ? 'opacity-40' : ''} ${d === 0 ? 'bg-sand-100 text-muted' : d > 0 ? 'bg-lime-400 text-forest-900' : 'bg-coral-50 text-coral-600'}`} style={{ top: `${y}%` }}>
                {d === 0 ? '0 pts' : `${d > 0 ? '+' : '−'}${Math.abs(d)} pts`}
              </span>)
          })}
        </div>
        <Bar title="Hypothetical" weights={hyp} names={names} hover={hover} setHover={setHover} badge />
      </div>
      <ul className="mt-4 space-y-1 text-xs" aria-label="Fund legend">
        {names.map((n, i) => (
          <li key={n}><button type="button" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}
            className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1 text-left transition-colors ${hover === i ? 'bg-lime-100' : ''}`}>
            <span className="flex min-w-0 items-center gap-2"><span className="h-2.5 w-2.5 shrink-0 rounded-[3px] ring-1 ring-black/10" style={{ background: FUND[i % 3].bg }} /><span className="[overflow-wrap:anywhere]">{n}</span></span>
            <span className="num shrink-0 text-muted">{pct(cur[i], 0)} → <b className="text-ink">{pct(hyp[i], 0)}</b></span></button></li>))}
      </ul>
      {total !== 100 && <p className="mt-2 text-2xs text-coral-600">The hypothetical weights total {Math.round(total * 100) / 100}%, not 100%.</p>}
    </Card>
  )
}
