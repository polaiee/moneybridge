import { Lock, TriangleAlert } from 'lucide-react'
import type { TwinForm } from '../../store'
import { Tip } from '../../components/ui'
import { NumField } from './fields'
import { FUND, linkedWeights, num, type Validation } from './model'

const THUMB = 12 // px, must match .split-range thumb width in index.css
const HATCH = 'repeating-linear-gradient(45deg, rgba(197,84,58,0.55) 0 6px, rgba(197,84,58,0.18) 6px 12px)'

/**
 * Allocation control. The track IS the 100% total: a draggable divider rebalances the other fund, so dragging can never
 * leave the total off 100. Typing a weight directly is still allowed; an invalid total shows hatched coral + the exact message.
 */
export default function SplitBar({ form, v, set, hover, setHover }: { form: TwinForm; v: Validation; set: (p: Partial<TwinForm>) => void; hover?: number | null; setHover?: (i: number | null) => void }) {
  const hs = form.holdings
  const w = hs.map((h) => num(h.weight) || 0)
  const invalid = !!v.errors.total
  const two = hs.length === 2
  const setHolding = (i: number, patch: Partial<TwinForm['holdings'][0]>) => set({ holdings: hs.map((h, j) => (j === i ? { ...h, ...patch } : h)) })
  const balance = () => {
    const rest = Math.round((100 - hs.slice(0, -1).reduce((a, h) => a + (num(h.weight) || 0), 0)) * 100) / 100
    setHolding(hs.length - 1, { weight: String(rest) })
  }
  const scale = v.total > 100 ? v.total : 100 // overflow: shrink segments into the track and flag it

  return (
    <fieldset>
      <legend className="mb-3 flex w-full items-center justify-between gap-2 text-xs font-medium text-slate-700">
        <Tip text="How your money is split between funds. The percentages always add up to 100%.">ETF allocation</Tip>
        <span role="status" aria-live="polite" className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-2xs font-semibold ${invalid ? 'bg-coral-50 text-coral-600' : 'bg-lime-100 text-forest-900'}`}>
          {invalid ? <TriangleAlert size={11} /> : <Lock size={11} />}<span className="num">{v.total}% / 100%</span>
        </span>
      </legend>

      {/* the 100% track: segments are clipped to the pill; the divider handle sits above the clip so it can protrude and show focus */}
      <div className="relative h-10">
        <div className={`absolute inset-0 overflow-hidden rounded-full bg-sand-100 ${invalid ? 'ring-2 ring-coral-500' : 'ring-1 ring-inset ring-sand-300'}`}>
          <div className="flex h-full">
            {hs.map((h, i) => {
              const pctW = two && !invalid && i === 0 ? undefined : `${(w[i] / scale) * 100}%`
              return (
                <div key={h.name} className="pointer-events-none flex h-full items-center justify-center overflow-hidden transition-[width] duration-200" aria-hidden
                  style={{ background: FUND[i % 3].bg, color: FUND[i % 3].fg, ...(pctW ? { width: pctW } : two && !invalid ? { width: `calc(${w[0]}% + ${(0.5 - w[0] / 100) * THUMB}px)` } : {}), ...(two && !invalid && i === 1 ? { flex: 1 } : {}) }}>
                  {w[i] >= 9 && <span className="num text-sm font-semibold">{w[i]}%</span>}
                </div>)
            })}
            {v.total < 100 && <div className="pointer-events-none h-full flex-1" style={{ background: HATCH }} aria-hidden />}
          </div>
          {invalid && v.total > 100 && <div className="pointer-events-none absolute inset-0" style={{ background: HATCH, opacity: 0.35 }} aria-hidden />}
        </div>
        {two && <input type="range" min={0} max={100} step={1} value={Math.min(100, Math.max(0, w[0]))} aria-label={`${hs[0].name} weight`} aria-valuetext={`${hs[0].name} ${w[0]} percent, ${hs[1].name} ${Math.round((100 - w[0]) * 100) / 100} percent`}
          onChange={(e) => set({ holdings: linkedWeights(form, 0, Number(e.target.value)) })} className="split-range" />}
      </div>

      {/* three or more funds: one slider each, rebalancing proportionally */}
      {!two && <div className="mt-3 space-y-2">{hs.map((h, i) => (
        <input key={h.name} type="range" min={0} max={100} step={1} value={Math.min(100, Math.max(0, w[i]))} aria-label={`${h.name} weight`} onChange={(e) => set({ holdings: linkedWeights(form, i, Number(e.target.value)) })} className="w-full" />))}</div>}

      <div className="-mx-2 mt-2 divide-y divide-dashed divide-sand-300">
        {hs.map((h, i) => (
          <div key={h.name} data-fund-row={i} onMouseEnter={() => setHover?.(i)} onMouseLeave={() => setHover?.(null)} className={`rounded-xl px-2 py-3 transition-colors first:pt-2 ${hover === i ? 'bg-lime-100' : ''}`}>
            <div className="mb-2 flex items-center gap-2"><span className="h-3 w-3 shrink-0 rounded-[4px] ring-1 ring-black/10" style={{ background: FUND[i % 3].bg }} /><span className="text-sm font-medium leading-snug [overflow-wrap:anywhere]">{h.name}</span></div>
            <div className="grid grid-cols-2 gap-2.5">
              <NumField compact id={`w${i}`} label="Weight" suffix="%" value={h.weight} onChange={(x) => setHolding(i, { weight: x })} error={v.errors[`w${i}`]} />
              <NumField compact id={`er${i}`} label="Expense ratio" suffix="%/yr" value={h.er} onChange={(x) => setHolding(i, { er: x })} error={v.errors[`er${i}`]} />
            </div>
          </div>))}
      </div>

      <p className="text-2xs text-muted">Drag the divider to rebalance; the total stays at 100%. Typing a weight directly can break the total, and the plan won’t update until it’s fixed.</p>
      {invalid ? (
        <div role="alert" className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-coral-50 px-3 py-2 text-xs text-coral-600"><span>{v.errors.total}</span>
          {!hs.slice(0, -1).some((_, i) => v.errors[`w${i}`]) && <button type="button" onClick={balance} className="font-semibold underline">Set last fund to the remaining %</button>}</div>
      ) : <div role="status" className="mt-2 text-xs font-medium text-forest-700">Allocation totals {v.total}% ✓</div>}
    </fieldset>
  )
}
