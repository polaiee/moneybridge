// TEMPORARY (Pass 1): these result sections still use the previous layout and are rewritten in Pass 2
// (allocation comparison bars, fee cards, risk tiles, assumptions strip, compact quiz). Numbers are unchanged.
import { useState } from 'react'
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Dashboard, Scenario, SimResult } from '../../api'
import type { TwinForm } from '../../store'
import { Badge, Card, Eyebrow, HypoBadge, IllusBadge, Money, SectionHead, Tip } from '../../components/ui'
import { AXIS, C, TipBox } from '../../components/charts'
import { pct, usd } from '../../lib/format'
import { FUND, num } from './model'

function AllocBar({ title, items, accent }: { title: string; items: { name: string; w: number }[]; accent?: boolean }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between"><Eyebrow>{title}</Eyebrow>{accent && <HypoBadge />}</div>
      <div className="flex h-3 overflow-hidden rounded-full bg-sand-100" role="img" aria-label={items.map((i) => `${i.name} ${i.w}%`).join(', ')}>
        {items.map((it, i) => <div key={it.name} style={{ width: `${Math.max(it.w, 0)}%`, background: FUND[i % 3].bg }} className={`transition-[width] duration-300 ${i ? 'border-l-2 border-card' : ''}`} />)}
      </div>
      <ul className="mt-2 space-y-0.5 text-xs">{items.map((it, i) => <li key={it.name} className="flex items-center justify-between gap-2"><span className="flex min-w-0 items-center gap-1.5 text-muted"><span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: FUND[i % 3].bg }} /><span className="truncate">{it.name}</span></span><span className="num font-semibold">{it.w}%</span></li>)}</ul>
    </div>
  )
}

const QUIZ = [
  { q: 'Two funds earn the same gross return. Fund A charges 0.05% a year and Fund B charges 0.20%. Over a long horizon, which usually leaves you with more?', options: ['Fund A (lower fee)', 'Fund B (higher fee)', 'They are always identical'], answer: 0, why: 'Fees are subtracted from the return every year, and the difference compounds. The Fee Impact panel above shows this with your own inputs.' },
  { q: 'What does diversification across several funds mainly try to reduce?', options: ['Concentration risk: depending on one market or company', 'All risk, guaranteeing gains', 'The expense ratio'], answer: 0, why: 'Spreading money can reduce reliance on any single holding, but it cannot remove market risk or guarantee returns.' },
]
function Quiz() {
  const [i, setI] = useState(0); const [pick, setPick] = useState<number | null>(null)
  const q = QUIZ[i]
  return (
    <Card>
      <SectionHead title="Quick knowledge check" sub={`Question ${i + 1} of ${QUIZ.length} · optional`} />
      <p className="font-medium">{q.q}</p>
      <div className="mt-3 space-y-2" role="radiogroup" aria-label="Answers">
        {q.options.map((o, k) => {
          const done = pick !== null; const right = k === q.answer
          return <button key={o} role="radio" aria-checked={pick === k} disabled={done} onClick={() => setPick(k)}
            className={`block w-full rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${done && right ? 'border-forest-600 bg-lime-100' : done && pick === k ? 'border-coral-600 bg-coral-50' : 'border-sand-300 bg-card hover:border-forest-300 hover:bg-forest-50'}`}>{o}</button>
        })}
      </div>
      {pick !== null && <div className="fade-in mt-3 rounded-xl bg-forest-50 p-3 text-sm" role="status"><b>{pick === q.answer ? 'Correct. ' : 'Not quite. '}</b>{q.why}
        {i < QUIZ.length - 1 && <button onClick={() => { setI(i + 1); setPick(null) }} className="ml-2 font-semibold text-forest-800 underline">Next question</button>}</div>}
    </Card>
  )
}

export default function Legacy({ dash, form, sim, baseSim, scenario }: { dash: Dashboard; form: TwinForm; sim: SimResult; baseSim: SimResult; scenario: Scenario }) {
  const baseAlloc = dash.portfolio.holdings.map((h) => ({ name: h.name, w: h.allocation_pct }))
  const hypoAlloc = form.holdings.map((h) => ({ name: h.name, w: num(h.weight) || 0 }))
  const riskData = sim.risk_scenarios.base.yearly_values.map((_, i) => ({ year: i, downside: sim.risk_scenarios.downside.yearly_values[i], base: sim.risk_scenarios.base.yearly_values[i], upside: sim.risk_scenarios.upside.yearly_values[i] }))
  const N = riskData.length - 1
  const endLabel = (color: string, text: string) => (p: { x?: number | string; y?: number | string; index?: number }) =>
    p.index === N ? <text x={Number(p.x ?? 0) + 8} y={Number(p.y ?? 0) + 4} fontSize={11} fontWeight={600} fill={color}>{text}</text> : <g />
  const feeDiff = sim.fee_impact.cost_of_fees - baseSim.fee_impact.cost_of_fees
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <Card><SectionHead title="Portfolio comparison" sub="Current versus hypothetical allocation" />
          <div className="space-y-5"><AllocBar title="Current allocation" items={baseAlloc} /><AllocBar title="Hypothetical allocation" items={hypoAlloc} accent /></div></Card>
        <Card>
          <SectionHead title="ETF fee impact" sub="Same inputs, with and without fund fees" right={<IllusBadge>Fee comparison</IllusBadge>} />
          <div className="grid gap-3">
            <div className="rounded-xl border border-sand-200 p-3"><div className="text-xs text-muted"><Tip text="Weighted expense ratio = each fund's fee × its share of the portfolio, added up.">Current plan · weighted fee {pct(sim.baseline_expense_ratio_pct ?? 0)}</Tip></div>
              <Money value={baseSim.fee_impact.cost_of_fees} className="text-xl font-semibold" /><p className="text-2xs text-muted">Modeled cost of fees over {scenario.years} years</p></div>
            <div className="rounded-xl border border-lime-300 bg-lime-50 p-3"><div className="text-xs text-forest-800">Hypothetical plan · weighted fee {pct(sim.weighted_expense_ratio_pct)}</div>
              <Money value={sim.fee_impact.cost_of_fees} className="text-xl font-semibold" /><p className="text-2xs text-muted">Modeled cost of fees over {scenario.years} years</p></div>
          </div>
          <p className="mt-3 text-xs">Fee cost difference: <b>{usd(Math.abs(feeDiff))}</b> {feeDiff <= 0 ? 'less' : 'more'} in fees for the hypothetical plan. Contribution and balance differences also affect this figure.</p>
        </Card>
      </div>

      <Card>
        <SectionHead title="Risk scenarios" sub="Three assumptions, not predictions" right={<IllusBadge>Illustrative scenarios</IllusBadge>} />
        <div className="grid gap-3 md:grid-cols-3">
          {(['downside', 'base', 'upside'] as const).map((k) => (
            <div key={k} className={`rounded-xl border p-3 ${k === 'base' ? 'border-forest-300 bg-forest-50' : 'border-sand-200'}`}>
              <div className="flex items-center gap-2 text-xs font-semibold capitalize"><span className="h-2 w-2 rounded-sm" style={{ background: k === 'downside' ? C.coral : k === 'base' ? C.forest : C.limeDeep }} />{k}</div>
              <Money value={sim.risk_scenarios[k].ending_value} className="text-xl font-semibold" />
              <p className="text-2xs text-muted">{pct(sim.risk_scenarios[k].gross_return_pct, 0)} gross return{k === 'base' ? ' · your chosen assumption' : ''}</p>
            </div>))}
        </div>
        <div className="mt-4 h-52" role="img" aria-label="Line chart of downside, base and upside scenarios">
          <ResponsiveContainer width="100%" height="100%"><LineChart data={riskData} margin={{ left: 0, right: 76, top: 8 }}>
            <CartesianGrid stroke={C.grid} vertical={false} strokeDasharray="4 5" /><XAxis dataKey="year" tickLine={false} axisLine={{ stroke: C.grid }} tick={AXIS} minTickGap={14} tickFormatter={(y) => `Y${y}`} />
            <YAxis tickFormatter={(x) => `$${Math.round(x / 1000)}k`} tickLine={false} axisLine={false} width={48} tick={AXIS} />
            <Tooltip cursor={{ stroke: '#14211e', strokeDasharray: '3 3', strokeOpacity: 0.5 }} content={({ active, payload }) => {
              if (!active || !payload?.length) return null; const p = payload[0].payload
              return <TipBox title={`Year ${p.year}`} rows={[{ label: 'Upside', value: usd(p.upside), color: C.limeDeep }, { label: 'Base', value: usd(p.base), color: C.forest, strong: true }, { label: 'Downside', value: usd(p.downside), color: C.coral }]} />
            }} />
            <ReferenceLine y={0} stroke={C.grid} />
            <Line dataKey="upside" stroke={C.limeDeep} strokeWidth={2} dot={false} animationDuration={600} label={endLabel(C.limeDeep, 'Upside')} />
            <Line dataKey="base" stroke={C.forest} strokeWidth={2.5} dot={false} animationDuration={600} label={endLabel(C.forest, 'Base')} />
            <Line dataKey="downside" stroke={C.coral} strokeWidth={2} dot={false} animationDuration={600} label={endLabel('#a4432b', 'Downside')} />
          </LineChart></ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-muted">Illustrative scenarios, not forecasts or probability ranges. The downside is not a floor: returns can be negative and capital can be lost.</p>
      </Card>

      <Card tone="brand">
        <SectionHead title="Calculation assumptions" sub="Everything is computed by deterministic backend code" />
        <ul className="grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
          <li><b>Monthly rate:</b> {sim.assumptions.monthly_rate}</li><li><b>Contributions:</b> {sim.assumptions.contribution_timing}</li>
          <li><b>Excluded:</b> {sim.assumptions.excluded.join(', ')}</li><li><b>Rounding:</b> cents, at output only</li>
        </ul>
        <p className="mt-2 text-xs text-muted">{sim.assumptions.disclaimer} Educational illustration, not individualized investment advice.</p>
        <div className="mt-2"><Badge tone="hypo">Hypothetical</Badge></div>
      </Card>
      <Quiz />
    </>
  )
}
