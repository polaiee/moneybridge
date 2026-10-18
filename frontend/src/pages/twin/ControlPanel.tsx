import { RefreshCw, Sparkles } from 'lucide-react'
import type { Dashboard } from '../../api'
import type { TwinForm } from '../../store'
import { Badge, Button, Card, DemoBadge, Eyebrow, HypoBadge, Money } from '../../components/ui'
import { NumField } from './fields'
import SplitBar from './SplitBar'
import { FUND, type Validation } from './model'

/**
 * Left, sticky instrument panel (one continuous surface): starting position, hypothetical plan, allocation, sticky footer.
 * Below 1024px it is not sticky and stacks above the results.
 */
export default function ControlPanel({ dash, form, set, v, valid, busy, onRun, onReset, onExplain, hover, setHover, className = '' }: {
  dash: Dashboard; form: TwinForm; set: (p: Partial<TwinForm>) => void; v: Validation; valid: boolean; busy: boolean
  onRun: () => void; onReset: () => void; onExplain: () => void; hover: number | null; setHover: (i: number | null) => void; className?: string
}) {
  const cur = dash.portfolio.holdings
  return (
    <Card className={`flex flex-col !p-0 lg:max-h-[calc(100vh-88px)] ${className}`}>
      <div className="flex items-center justify-between gap-2 border-b border-sand-200 px-5 py-3.5">
        <div className="flex flex-wrap items-center gap-2"><Eyebrow className="!text-forest-700">Simulation lab</Eyebrow><HypoBadge>Hypothetical plan</HypoBadge></div>
        <Button variant="ghost" size="sm" onClick={onReset} aria-label="Reset to starting values"><RefreshCw size={13} />Reset</Button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-5" aria-label="Simulation controls" role="region">
        {/* A. Starting position */}
        <section aria-label="Starting position">
          <div className="mb-2 flex items-center justify-between"><Eyebrow>Starting position</Eyebrow><DemoBadge /></div>
          <Money value={dash.portfolio.total} className="block text-[28px] font-medium leading-none" />
          <p className="mt-1.5 text-xs text-muted">Brokerage balance from the Dashboard (demo)</p>
          <div className="mt-3"><NumField id="baseMonthly" label="Current monthly contribution" prefix="$" value={form.baselineMonthly} onChange={(x) => set({ baselineMonthly: x })} error={v.errors.baselineMonthly}
            hint={<><Badge tone="illus">Illustrative assumption</Badge> <span className="mt-1 inline-block">The demo data has no recorded contribution.</span></>} /></div>
          <div className="mt-3">
            <div className="flex h-2 overflow-hidden rounded-full bg-sand-100" role="img" aria-label={`Current allocation: ${cur.map((h) => `${h.name} ${h.allocation_pct}%`).join(', ')}`}>
              {cur.map((h, i) => <div key={h.name} style={{ width: `${h.allocation_pct}%`, background: FUND[i % 3].bg }} className={i ? 'border-l-2 border-card' : ''} />)}
            </div>
            <p className="mt-1.5 text-2xs text-muted">Current allocation · {cur.map((h) => `${h.allocation_pct}%`).join(' / ')}</p>
          </div>
        </section>

        {/* B. Hypothetical plan */}
        <section aria-label="Hypothetical plan" className="border-t border-dashed border-sand-300 pt-5">
          <div className="mb-3 flex items-center justify-between"><Eyebrow>Hypothetical plan</Eyebrow></div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-3.5">
            <NumField id="initial" label="Initial investment" prefix="$" value={form.initial} onChange={(x) => set({ initial: x })} error={v.errors.initial} />
            <NumField id="years" label="Duration" suffix="years" value={form.years} onChange={(x) => set({ years: x })} error={v.errors.years} />
            <NumField id="monthly" label="Monthly contribution" prefix="$" value={form.monthly} onChange={(x) => set({ monthly: x })} error={v.errors.monthly} hint="Added at month end" />
            <NumField id="gross" label="Gross annual return" suffix="%" value={form.gross} onChange={(x) => set({ gross: x })} error={v.errors.gross} hint="Your assumption, not a prediction" />
          </div>
        </section>

        {/* C. Allocation */}
        <section aria-label="Allocation" className="border-t border-dashed border-sand-300 pt-5"><SplitBar form={form} v={v} set={set} hover={hover} setHover={setHover} /></section>
      </div>

      {/* sticky footer */}
      <div className="space-y-2.5 border-t border-sand-200 bg-card/95 p-4">
        <Button variant="ai" size="lg" className="w-full" onClick={onExplain}><Sparkles size={17} />Explain This Scenario</Button>
        <div className="flex items-center justify-between gap-3">
          <Button variant="secondary" size="sm" onClick={onRun} disabled={!valid || busy}>{busy ? 'Running…' : 'Run Simulation'}</Button>
          <span className="flex items-center gap-1.5 text-2xs text-muted" role="status">{busy ? <span className="h-3 w-3 animate-spin rounded-full border-2 border-forest-600 border-t-transparent" aria-hidden /> : <span className="h-2 w-2 rounded-full bg-lime-600" aria-hidden />}Live: updates as you type</span>
        </div>
      </div>
    </Card>
  )
}
