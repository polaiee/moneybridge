import type { Scenario, SimResult } from '../../api'
import { Card, IllusBadge, Money, SectionHead } from '../../components/ui'
import { pct, usd } from '../../lib/format'

const KEYS = ['downside', 'base', 'upside'] as const
const LOOK = {
  downside: { dot: '#c5543a', line: '#c5543a', tile: 'border-coral-500/25 bg-coral-50' },
  base: { dot: '#173b37', line: '#173b37', tile: 'border-forest-300 bg-forest-50 ring-1 ring-forest-600' },
  upside: { dot: '#6b8316', line: '#6b8316', tile: 'border-lime-300 bg-lime-100' },
}

/** Mini line of one scenario's yearly values. All three share one scale so the tiles stay comparable. */
function Mini({ values, min, max, color, label }: { values: number[]; min: number; max: number; color: string; label: string }) {
  const W = 200, Hh = 52, pad = 4
  const x = (i: number) => pad + (i / (values.length - 1)) * (W - 2 * pad)
  const y = (v: number) => Hh - pad - ((v - min) / (max - min || 1)) * (Hh - 2 * pad)
  const d = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
  const lastX = x(values.length - 1), lastY = y(values[values.length - 1])
  return (
    <svg viewBox={`0 0 ${W} ${Hh}`} preserveAspectRatio="none" className="mt-3 h-12 w-full" role="img" aria-label={label} data-mini>
      <path d={`${d} L${lastX} ${Hh} L${x(0)} ${Hh} Z`} fill={color} opacity="0.12" />
      <path d={d} fill="none" stroke={color} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle cx={lastX} cy={lastY} r="3.5" fill={color} />
    </svg>
  )
}

/** Three tinted tiles (replaces the big three-line chart). */
export default function RiskTiles({ sim, scenario, className = '' }: { sim: SimResult; scenario: Scenario; className?: string }) {
  const all = KEYS.flatMap((k) => sim.risk_scenarios[k].yearly_values)
  const min = Math.min(...all), max = Math.max(...all)
  return (
    <Card className={className}>
      <SectionHead title="Risk scenarios" sub="Three assumptions, not predictions" right={<IllusBadge>Illustrative scenarios</IllusBadge>} />
      <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-1 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0">
        {KEYS.map((k) => {
          const r = sim.risk_scenarios[k], l = LOOK[k]
          return (
            <div key={k} data-risk={k} className={`flex min-w-[220px] snap-start flex-col rounded-2xl border p-4 md:min-w-0 ${l.tile}`}>
              <div className="flex items-center gap-2 text-sm font-semibold capitalize"><span className="h-2.5 w-2.5 rounded-full" style={{ background: l.dot }} />{k}</div>
              <Money value={r.ending_value} className="mt-2 text-[28px] font-medium leading-none" />
              <p className="mt-1.5 text-xs text-muted">{pct(r.gross_return_pct, 0)} gross return{k === 'base' ? ' · your chosen assumption' : ''}</p>
              <Mini values={r.yearly_values} min={min} max={max} color={l.line} label={`${k} scenario: from ${usd(r.yearly_values[0])} to ${usd(r.ending_value)} over ${scenario.years} years`} />
            </div>)
        })}
      </div>
      <p className="mt-3 text-xs text-muted">Illustrative scenarios, not forecasts or probability ranges. The downside is not a floor: returns can be negative and capital can be lost.</p>
    </Card>
  )
}
