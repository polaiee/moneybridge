import { useState } from 'react'
import { type Dashboard as D } from '../../api'
import { Card, DemoBadge, Money } from '../../components/ui'
import { C } from '../../components/charts'
import { usd, pct } from '../../lib/format'

/** Split `total` ticks across segments by value, largest-remainder so they always sum exactly. */
function allocateTicks(values: number[], total = 100): number[] {
  const sum = values.reduce((a, b) => a + b, 0) || 1
  const raw = values.map((v) => (v / sum) * total)
  const base = raw.map(Math.floor)
  let left = total - base.reduce((a, b) => a + b, 0)
  raw.map((r, i) => ({ i, f: r - base[i] })).sort((a, b) => b.f - a.f).forEach(({ i }) => { if (left > 0) { base[i] += 1; left -= 1 } })
  return base
}

interface Seg { key: string; label: string; value: number; color: string }
/** Hero composition ring: 100 ticks, one per percentage point of gross position (investments + cash + liabilities). */
function CompositionRing({ segs, assets, hover, setHover }: { segs: Seg[]; assets: number; hover: number | null; setHover: (i: number | null) => void }) {
  const counts = allocateTicks(segs.map((x) => x.value))
  const ticks = counts.flatMap((n, i) => Array.from({ length: n }, () => i))
  const gross = segs.reduce((a, x) => a + x.value, 0)
  const h = hover !== null ? segs[hover] : null
  return (
    <div className="relative mx-auto h-44 w-44 shrink-0" role="img" aria-label={`Composition of gross position: ${segs.map((x) => `${x.label} ${usd(x.value)}`).join(', ')}`}>
      <svg viewBox="0 0 200 200" className="h-full w-full">
        {ticks.map((g, i) => {
          const a = ((i * 3.6 - 90) * Math.PI) / 180
          return <line key={i} x1={100 + 68 * Math.cos(a)} y1={100 + 68 * Math.sin(a)} x2={100 + 92 * Math.cos(a)} y2={100 + 92 * Math.sin(a)} stroke={segs[g].color} strokeWidth="2.4" strokeLinecap="round"
            opacity={hover !== null && hover !== g ? 0.18 : 1} style={{ transition: 'opacity .2s' }} onMouseEnter={() => setHover(g)} onMouseLeave={() => setHover(null)} />
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-2xs font-semibold uppercase tracking-[0.09em] text-ivory/60">{h ? h.label : 'Assets'}</span>
        <Money value={h ? h.value : assets} className="text-2xl font-medium text-ivory" />
        {h && <span className="num text-2xs text-ivory/65">{pct((h.value / gross) * 100, 0)} of gross</span>}
      </div>
    </div>
  )
}

function Legend({ segs, hover, setHover }: { segs: Seg[]; hover: number | null; setHover: (i: number | null) => void }) {
  return (
    <ul className="mt-4 flex flex-wrap gap-x-1 gap-y-1" aria-label="Composition legend">
      {segs.map((x, i) => (
        <li key={x.key}><button type="button" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}
          className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs transition-colors hover:bg-ivory/10 ${hover === i ? 'bg-ivory/10 text-ivory' : 'text-ivory/85'}`}><span className="h-2 w-2 rounded-full" style={{ background: x.color }} />{x.label}</button></li>))}
    </ul>
  )
}

export default function Hero({ d, name }: { d: D; name?: string }) {
  const [hover, setHover] = useState<number | null>(null)
  const cash = d.accounts.filter((a) => a.type === 'checking' || a.type === 'savings').reduce((a, x) => a + x.balance, 0)
  const segs: Seg[] = [
    { key: 'inv', label: 'Investments', value: d.portfolio.total, color: C.lime },
    { key: 'cash', label: 'Cash', value: cash, color: C.sage },
    { key: 'debt', label: 'Liabilities', value: d.total_liabilities, color: C.coral },
  ]
  return (
    <Card tone="dark" className="col-span-12 flex flex-col !p-5 sm:!p-6 xl:col-span-6 xl:row-span-2">
      <div className="flex items-start justify-between gap-3">
        <div><div className="text-sm text-ivory/75">Welcome back, {name}</div><div className="eyebrow mt-3 !text-ivory/60">Net worth</div></div>
        <DemoBadge dark />
      </div>
      <div className="my-3 grid flex-1 items-center gap-5 sm:grid-cols-[1fr_auto]">
        <div className="min-w-0"><Money value={d.net_worth} className="block text-6xl font-medium leading-none text-ivory sm:text-7xl" /><div className="mt-2 text-xs text-ivory/65">Assets − liabilities</div><Legend segs={segs} hover={hover} setHover={setHover} /></div>
        <CompositionRing segs={segs} assets={d.total_assets} hover={hover} setHover={setHover} />
      </div>
      <div className="border-t border-dashed border-ivory/25 pt-3.5">
        <dl className="grid grid-cols-3 gap-4">
          {[['Assets', d.total_assets, C.lime], ['Liabilities', d.total_liabilities, C.coral], ['Cash', cash, C.sage]].map(([l, v, c]) => (
            <div key={l as string}><dt className="flex items-center gap-1.5 text-xs text-ivory/70"><span className="h-2 w-2 rounded-full" style={{ background: c as string }} />{l as string}</dt><dd className="mt-0.5"><Money value={v as number} className="text-xl font-medium text-ivory sm:text-2xl" /></dd></div>))}
        </dl>
        <p className="mt-2.5 text-2xs text-ivory/60">Static demo snapshot · not synced to any bank</p>
      </div>
    </Card>
  )
}
