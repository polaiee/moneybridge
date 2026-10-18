import { useState } from 'react'
import { type Dashboard as D } from '../../api'
import { Card, DemoBadge, Money, SectionHead, Tip } from '../../components/ui'
import { usd, pct } from '../../lib/format'

type Holding = D['portfolio']['holdings'][number]
interface Rect { x: number; y: number; w: number; h: number }
const TILE = [
  { bg: '#173b37', fg: '#f8f7f2', chip: 'rgba(248,247,242,0.16)' },
  { bg: '#c8ea54', fg: '#173b37', chip: 'rgba(23,59,55,0.14)' },
  { bg: '#668d81', fg: '#0f2825', chip: 'rgba(15,40,37,0.14)' },
  { bg: '#c4d6cf', fg: '#173b37', chip: 'rgba(23,59,55,0.12)' },
]

/** Recursive slice-and-dice: split the largest holding off along the longer side. Exact for any number of holdings. */
function layout(items: { i: number; v: number }[], r: Rect): (Rect & { i: number })[] {
  if (items.length === 1) return [{ ...r, i: items[0].i }]
  const total = items.reduce((a, x) => a + x.v, 0), [first, ...rest] = items, f = first.v / total
  return r.w >= r.h
    ? [{ x: r.x, y: r.y, w: r.w * f, h: r.h, i: first.i }, ...layout(rest, { x: r.x + r.w * f, y: r.y, w: r.w * (1 - f), h: r.h })]
    : [{ x: r.x, y: r.y, w: r.w, h: r.h * f, i: first.i }, ...layout(rest, { x: r.x, y: r.y + r.h * f, w: r.w, h: r.h * (1 - f) })]
}

/** Row C: treemap (cols 1–7) and holdings table (cols 8–12) sharing one hover state. */
export default function Allocation({ d }: { d: D }) {
  const [hover, setHover] = useState<number | null>(null)
  const hs: Holding[] = d.portfolio.holdings
  const rects = layout(hs.map((h, i) => ({ i, v: h.value })).sort((a, b) => b.v - a.v), { x: 0, y: 0, w: 100, h: 100 })
  return (
    <>
      <Card className="col-span-12 flex flex-col lg:col-span-7">
        <SectionHead title="Allocation" sub={`${usd(d.portfolio.total)} across fictional ETFs · hover a tile or a row`} right={<DemoBadge />} />
        <div className="relative min-h-[240px] flex-1" role="group" aria-label="Allocation treemap">
          {rects.map((r) => {
            const h = hs[r.i], t = TILE[r.i % TILE.length], dim = hover !== null && hover !== r.i
            return (
              <div key={h.name} className="absolute p-[3px]" style={{ left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%` }}>
                <div tabIndex={0} aria-label={`${h.name}, ${pct(h.allocation_pct, 0)}, ${usd(h.value)}`} data-tile
                  onMouseEnter={() => setHover(r.i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(r.i)} onBlur={() => setHover(null)}
                  className={`flex h-full min-w-0 flex-col justify-between overflow-hidden rounded-2xl p-3 transition-all sm:p-4 duration-200 ${dim ? 'opacity-45' : ''} ${hover === r.i ? 'scale-[0.985] shadow-md' : ''}`} style={{ background: t.bg, color: t.fg }}>
                  <div><div className="text-sm font-semibold leading-tight">{h.name}</div><div className="mt-0.5 text-2xs opacity-75">Fictional ETF</div></div>
                  <div className="flex flex-wrap items-end justify-between gap-x-2 gap-y-1">
                    <span className="num rounded-full px-2.5 py-1 text-sm font-semibold" style={{ background: t.chip }}>{pct(h.allocation_pct, 0)}</span>
                    <span className="num text-base font-medium sm:text-xl">{usd(h.value)}</span>
                  </div>
                </div>
              </div>)
          })}
        </div>
      </Card>

      <Card className="col-span-12 flex flex-col lg:col-span-5">
        <SectionHead title="Holdings" sub="Weight, value and fund fee" />
        <div className="hidden flex-1 overflow-x-auto md:flex md:flex-col lg:overflow-visible">
          <div className="flex min-w-[340px] flex-1 flex-col">
            <div className="eyebrow grid grid-cols-[1.5fr_0.9fr_1.2fr_0.7fr] gap-3 border-b border-dashed border-sand-300 pb-2"><span>Holding</span><span className="text-right">Value</span><span>Weight</span><span className="text-right">Fee</span></div>
            <ul className="dashed-rows flex flex-1 flex-col" aria-label="Holdings">
              {hs.map((h, i) => (
                <li key={h.name} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
                  className={`grid flex-1 grid-cols-[1.5fr_0.9fr_1.2fr_0.7fr] items-center gap-3 rounded-b-xl px-1 py-4 transition-colors ${hover === i ? 'bg-lime-100' : ''}`}>
                  <span className="flex min-w-0 items-center gap-2"><span className="h-3 w-3 shrink-0 rounded-[4px] ring-1 ring-black/10" style={{ background: TILE[i % TILE.length].bg }} /><span className="text-sm font-medium leading-snug [overflow-wrap:anywhere]">{h.name}</span></span>
                  <span className="num text-right text-sm">{usd(h.value)}</span>
                  <span className="flex items-center gap-2"><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand-100"><span className="block h-full rounded-full transition-[width] duration-700" style={{ width: `${h.allocation_pct}%`, background: i === 1 ? '#8fae1f' : TILE[i % TILE.length].bg }} /></span><span className="num w-9 text-right text-sm font-semibold">{pct(h.allocation_pct, 0)}</span></span>
                  <span className="num text-right text-sm"><Tip text="Expense ratio is the yearly fee a fund charges, as a % of what you hold.">{pct(h.expense_ratio_pct)}</Tip></span>
                </li>))}
            </ul>
            <div className="flex items-center justify-between border-t border-dashed border-sand-300 px-1 pt-3 text-sm"><span className="eyebrow">Total</span><Money value={d.portfolio.total} className="font-semibold" /></div>
          </div>
        </div>
        {/* mobile (<768px): card list instead of a table */}
        <div className="md:hidden">
          <ul className="dashed-rows" aria-label="Holdings (compact)">
            {hs.map((h, i) => (
              <li key={h.name} className="py-3">
                <div className="flex items-center justify-between gap-3"><span className="flex min-w-0 items-center gap-2"><span className="h-3 w-3 shrink-0 rounded-[4px] ring-1 ring-black/10" style={{ background: TILE[i % TILE.length].bg }} /><span className="text-sm font-medium leading-snug [overflow-wrap:anywhere]">{h.name}</span></span><span className="num text-sm font-medium">{usd(h.value)}</span></div>
                <div className="mt-2 flex items-center gap-2"><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand-100"><span className="block h-full rounded-full" style={{ width: `${h.allocation_pct}%`, background: i === 1 ? '#8fae1f' : TILE[i % TILE.length].bg }} /></span><span className="num w-9 text-right text-sm font-semibold">{pct(h.allocation_pct, 0)}</span></div>
                <div className="mt-1 text-2xs text-muted">Expense ratio <span className="num font-semibold text-ink">{pct(h.expense_ratio_pct)}</span> per year</div>
              </li>))}
          </ul>
          <div className="flex items-center justify-between border-t border-dashed border-sand-300 pt-3 text-sm"><span className="eyebrow">Total</span><Money value={d.portfolio.total} className="font-semibold" /></div>
        </div>
      </Card>
    </>
  )
}
