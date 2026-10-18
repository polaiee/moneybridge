import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Area, CartesianGrid, ComposedChart, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Lock, RefreshCw, Sparkles, TriangleAlert } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api, type Dashboard, type Scenario, type SimResult } from '../api'
import { Badge, Button, Card, DemoBadge, ErrorBox, Eyebrow, HypoBadge, IllusBadge, Money, PageHeader, SectionHead, Skeleton, SkeletonCard, Stat, Tip } from '../components/ui'
import { AXIS, C, TipBox } from '../components/charts'
import { useAsync } from '../lib/useAsync'
import { friendlyError } from '../lib/errors'
import { pct, usd } from '../lib/format'
import { useStore, type TwinForm } from '../store'

const SEG = [C.blue, C.teal, C.amber]
const DEFAULT_MONTHLY = 300 // illustrative assumption: the demo dataset has no recorded contribution

function initialForm(d: Dashboard): TwinForm {
  return {
    initial: String(d.portfolio.total), monthly: String(DEFAULT_MONTHLY), baselineMonthly: String(DEFAULT_MONTHLY), years: '10', gross: '6',
    holdings: d.portfolio.holdings.map((h) => ({ name: h.name, weight: String(h.allocation_pct), er: String(h.expense_ratio_pct) })),
  }
}
const num = (s: string) => (s.trim() === '' ? NaN : Number(s))

/** Client-side validation mirrors the backend rules so users get instant, specific messages. */
function validate(f: TwinForm) {
  const e: Record<string, string> = {}
  const inRange = (k: string, v: number, lo: number, hi: number, label: string, int = false) => {
    if (Number.isNaN(v)) e[k] = `${label} is required`
    else if (v < lo || v > hi) e[k] = `${label} must be between ${lo} and ${hi}`
    else if (int && !Number.isInteger(v)) e[k] = `${label} must be a whole number`
  }
  inRange('initial', num(f.initial), 0, 1e9, 'Initial investment')
  inRange('monthly', num(f.monthly), 0, 1e7, 'Monthly contribution')
  inRange('baselineMonthly', num(f.baselineMonthly), 0, 1e7, 'Current contribution')
  inRange('years', num(f.years), 1, 50, 'Duration', true)
  inRange('gross', num(f.gross), -20, 30, 'Gross return')
  f.holdings.forEach((h, i) => { inRange(`w${i}`, num(h.weight), 0, 100, 'Weight'); inRange(`er${i}`, num(h.er), 0, 5, 'Expense ratio') })
  const total = Math.round(f.holdings.reduce((a, h) => a + (num(h.weight) || 0), 0) * 1e6) / 1e6
  if (!f.holdings.some((_, i) => e[`w${i}`]) && Math.abs(total - 100) > 1e-6) e.total = `Allocation must total 100% (currently ${total}%)`
  return { errors: e, total }
}

function toScenario(f: TwinForm, monthly: string, initial: string, holdings: { name: string; weight: string; er: string }[]): Scenario {
  return {
    initial_investment: num(initial), monthly_contribution: num(monthly), years: num(f.years), gross_return_pct: num(f.gross),
    holdings: holdings.map((h) => ({ name: h.name, weight_pct: num(h.weight), expense_ratio_pct: num(h.er) })),
  }
}

function NumField({ label, value, onChange, error, prefix, suffix, id, hint, compact }: { label: string; value: string; onChange: (v: string) => void; error?: string; prefix?: string; suffix?: string; id: string; hint?: ReactNode; compact?: boolean }) {
  return (
    <div>
      <label htmlFor={id} className="eyebrow mb-1 block !normal-case !tracking-normal !text-xs !font-medium !text-slate-700">{label}</label>
      <div className={`flex items-center rounded-lg border bg-white px-2.5 transition-shadow ${error ? 'border-danger' : 'border-line hover:border-slate-300'} focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/25`}>
        {prefix && <span className="mr-1 text-sm text-muted">{prefix}</span>}
        <input id={id} inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} className={`num w-full min-w-0 bg-transparent text-sm outline-none ${compact ? 'h-8' : 'h-9'}`} />
        {suffix && <span className="ml-1 whitespace-nowrap text-xs text-muted">{suffix}</span>}
      </div>
      {error ? <p id={`${id}-err`} className="mt-1 text-xs text-danger">{error}</p> : hint && <p className="mt-1 text-2xs leading-snug text-muted">{hint}</p>}
    </div>
  )
}

function AllocBar({ title, items, accent }: { title: string; items: { name: string; w: number }[]; accent?: boolean }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between"><Eyebrow>{title}</Eyebrow>{accent && <HypoBadge />}</div>
      <div className="flex h-3 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={items.map((i) => `${i.name} ${i.w}%`).join(', ')}>
        {items.map((it, i) => <div key={it.name} style={{ width: `${Math.max(it.w, 0)}%`, background: SEG[i % 3] }} className={`transition-[width] duration-300 ${i ? 'border-l-2 border-white' : ''}`} />)}
      </div>
      <ul className="mt-2 space-y-0.5 text-xs">{items.map((it, i) => <li key={it.name} className="flex items-center justify-between gap-2"><span className="flex min-w-0 items-center gap-1.5 text-muted"><span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: SEG[i % 3] }} /><span className="truncate">{it.name}</span></span><span className="num font-semibold">{it.w}%</span></li>)}</ul>
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
            className={`block w-full rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${done && right ? 'border-teal-500 bg-teal-50' : done && pick === k ? 'border-danger bg-red-50' : 'border-line bg-white hover:border-blue-300 hover:bg-blue-50/50'}`}>{o}</button>
        })}
      </div>
      {pick !== null && <div className="fade-in mt-3 rounded-lg bg-blue-50 p-3 text-sm" role="status"><b>{pick === q.answer ? 'Correct. ' : 'Not quite. '}</b>{q.why}
        {i < QUIZ.length - 1 && <button onClick={() => { setI(i + 1); setPick(null) }} className="ml-2 font-semibold text-brand underline">Next question</button>}</div>}
    </Card>
  )
}

/** Splits `rest` among the other holdings in proportion to their current weights, keeping the total at 100. */
function linkedWeights(f: TwinForm, i: number, v: number): TwinForm['holdings'] {
  const others = f.holdings.map((h, j) => ({ j, w: num(h.weight) || 0 })).filter((o) => o.j !== i)
  const rest = Math.round((100 - v) * 100) / 100
  const sum = others.reduce((a, o) => a + o.w, 0)
  const next = f.holdings.map((h) => ({ ...h }))
  next[i].weight = String(v)
  let used = 0
  others.forEach((o, k) => {
    const share = k === others.length - 1 ? Math.round((rest - used) * 100) / 100 : Math.round((sum > 0 ? (o.w / sum) * rest : rest / others.length) * 100) / 100
    used += share; next[o.j].weight = String(share)
  })
  return next
}

export default function Twin() {
  const { data: dash, error: dashErr, loading, retry } = useAsync(api.dashboard)
  const { twinForm, setTwinForm, setTwinContext, setPendingAsk } = useStore()
  const nav = useNavigate()
  const [form, setFormState] = useState<TwinForm | null>(twinForm)
  const [res, setRes] = useState<{ sim: SimResult; baseSim: SimResult; scenario: Scenario; baseline: Scenario } | null>(null)
  const [busy, setBusy] = useState(false)
  const [simErr, setSimErr] = useState<string | null>(null)
  const seq = useRef(0)

  useEffect(() => { if (dash && !form) setFormState(initialForm(dash)) }, [dash, form])
  const setForm = (f: TwinForm) => { setFormState(f); setTwinForm(f) }
  const v = useMemo(() => (form ? validate(form) : null), [form])
  const valid = !!v && Object.keys(v.errors).length === 0

  const run = (f: TwinForm) => {
    if (!dash) return
    const baseHoldings = dash.portfolio.holdings.map((h) => ({ name: h.name, weight: String(h.allocation_pct), er: String(h.expense_ratio_pct) }))
    const scenario = toScenario(f, f.monthly, f.initial, f.holdings)
    const baseline = toScenario(f, f.baselineMonthly, String(dash.portfolio.total), baseHoldings)
    const my = ++seq.current
    setBusy(true); setSimErr(null)
    Promise.all([api.simulate(scenario, baseline), api.simulate(baseline)])
      .then(([sim, baseSim]) => { if (my !== seq.current) return; setRes({ sim, baseSim, scenario, baseline }); setTwinContext({ scenario, baseline, results: sim }) })
      .catch((e: Error) => { if (my === seq.current) setSimErr(e.message) })
      .finally(() => { if (my === seq.current) setBusy(false) })
  }
  // Re-run (debounced) whenever the form is valid and changes.
  useEffect(() => {
    if (!form || !valid) return
    const t = setTimeout(() => run(form), 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, valid, dash])

  if (loading || (!form && !dashErr)) return (
    <><PageHeader title="Financial Twin" eyebrow="Simulation lab" /><div className="grid gap-4 lg:grid-cols-[340px_1fr]"><SkeletonCard lines={8} /><div className="space-y-4"><SkeletonCard lines={2} /><Card><Skeleton className="h-72 w-full" /></Card></div></div></>
  )
  if (dashErr || !dash || !form || !v) return <ErrorBox title="Starting portfolio unavailable" message={friendlyError(dashErr, 'the starting portfolio')} onRetry={retry} />

  const set = (patch: Partial<TwinForm>) => setForm({ ...form, ...patch })
  const setHolding = (i: number, patch: Partial<TwinForm['holdings'][0]>) => set({ holdings: form.holdings.map((h, j) => (j === i ? { ...h, ...patch } : h)) })
  const baseAlloc = dash.portfolio.holdings.map((h) => ({ name: h.name, w: h.allocation_pct }))
  const hypoAlloc = form.holdings.map((h) => ({ name: h.name, w: num(h.weight) || 0 }))
  const balance = () => {
    const rest = Math.round((100 - form.holdings.slice(0, -1).reduce((a, h) => a + (num(h.weight) || 0), 0)) * 100) / 100
    setHolding(form.holdings.length - 1, { weight: String(rest) })
  }
  const reset = () => setForm(initialForm(dash))

  const sim = res?.sim, bs = res?.baseSim
  const N = sim ? sim.hypothetical.yearly_values.length - 1 : 0
  const lineData = sim ? sim.hypothetical.yearly_values.map((y, i) => {
    const b = sim.baseline?.yearly_values[i] ?? y
    return { year: i, hypo: y, base: b, lo: Math.min(y, b), gap: Math.abs(y - b), up: y >= b }
  }) : []
  const riskData = sim ? sim.risk_scenarios.base.yearly_values.map((_, i) => ({ year: i, downside: sim.risk_scenarios.downside.yearly_values[i], base: sim.risk_scenarios.base.yearly_values[i], upside: sim.risk_scenarios.upside.yearly_values[i] })) : []
  const diff = sim?.difference_at_end ?? 0
  const gapColor = diff >= 0 ? C.teal : C.amber
  const explain = () => {
    setPendingAsk({ message: 'Explain this Financial Twin scenario to me in plain language. Use only the numbers provided.', scenario: true })
    nav('/companion')
  }
  const endLabel = (color: string, text: string, dy = 0) => (p: { x?: number | string; y?: number | string; index?: number }) =>
    p.index === N ? <text x={Number(p.x ?? 0) + 8} y={Number(p.y ?? 0) + 4 + dy} fontSize={11} fontWeight={600} fill={color}>{text}</text> : <g />

  return (
    <>
      <PageHeader title="Financial Twin" eyebrow="Simulation lab" sub="Explore how different investing choices might affect a hypothetical future. Change an input and every number is recalculated by the backend." />

      <div className="grid items-start gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* ───────── control panel ───────── */}
        <aside className="space-y-4 lg:sticky lg:top-[72px] lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto lg:pr-1" aria-label="Simulation controls">
          <Card>
            <div className="mb-3 flex items-center justify-between"><Eyebrow>Starting position</Eyebrow><DemoBadge /></div>
            <Stat label="Starting investment" amount={dash.portfolio.total} sub="Brokerage balance from the Dashboard (demo)" />
            <div className="mt-3"><NumField id="baseMonthly" label="Current monthly contribution" prefix="$" value={form.baselineMonthly} onChange={(x) => set({ baselineMonthly: x })} error={v.errors.baselineMonthly}
              hint={<><Badge tone="illus">Illustrative assumption</Badge> <span className="mt-1 inline-block">The demo data has no recorded contribution.</span></>} /></div>
            <div className="mt-4 border-t border-line pt-4"><AllocBar title="Current ETF allocation" items={baseAlloc} /></div>
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between"><Eyebrow>Controls</Eyebrow><HypoBadge>Hypothetical plan</HypoBadge></div>
            <div className="grid grid-cols-2 gap-3">
              <NumField id="initial" label="Initial investment" prefix="$" value={form.initial} onChange={(x) => set({ initial: x })} error={v.errors.initial} />
              <NumField id="years" label="Duration" suffix="years" value={form.years} onChange={(x) => set({ years: x })} error={v.errors.years} />
              <NumField id="monthly" label="Monthly contribution" prefix="$" value={form.monthly} onChange={(x) => set({ monthly: x })} error={v.errors.monthly} hint="Added at month end" />
              <NumField id="gross" label="Gross annual return" suffix="%" value={form.gross} onChange={(x) => set({ gross: x })} error={v.errors.gross} hint="Your assumption, not a prediction" />
            </div>
            <fieldset className="mt-5 border-t border-line pt-4">
              <legend className="mb-2 flex w-full items-center justify-between text-xs font-medium text-slate-700"><Tip text="How your money is split between funds. The percentages always add up to 100%.">ETF allocation</Tip>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-2xs font-semibold ${v.errors.total ? 'bg-red-50 text-danger' : 'bg-teal-50 text-teal-800'}`}>{v.errors.total ? <TriangleAlert size={11} /> : <Lock size={11} />}{v.total}% / 100%</span></legend>
              {/* the meter: segments always sum to the 100% track */}
              <div className="relative mb-3 h-2.5 overflow-hidden rounded-full bg-slate-100 ring-1 ring-inset ring-slate-200" aria-hidden>
                <div className="flex h-full" style={{ width: `${Math.min(100, v.total)}%` }}>{hypoAlloc.map((a, i) => <div key={a.name} style={{ width: `${v.total > 0 ? (a.w / v.total) * 100 : 0}%`, background: SEG[i % 3] }} className="transition-[width] duration-200" />)}</div>
                {v.total > 100 && <div className="absolute inset-0 bg-red-600/30" />}
              </div>
              <div className="space-y-3">
                {form.holdings.map((h, i) => (
                  <div key={h.name} className="rounded-lg border border-line bg-slate-25 p-2.5">
                    <div className="mb-1 flex items-center justify-between text-xs"><span className="flex min-w-0 items-center gap-1.5 font-medium"><span className="h-2 w-2 shrink-0 rounded-sm" style={{ background: SEG[i % 3] }} /><span className="truncate">{h.name}</span></span><span className="num text-sm font-semibold text-blue-700">{num(h.weight) || 0}%</span></div>
                    <input type="range" min={0} max={100} step={1} value={Math.min(100, Math.max(0, num(h.weight) || 0))} aria-label={`${h.name} weight`}
                      onChange={(e) => set({ holdings: linkedWeights(form, i, Number(e.target.value)) })} className="w-full" />
                    <div className="mt-1.5 grid grid-cols-2 gap-2">
                      <NumField compact id={`w${i}`} label="Weight" suffix="%" value={h.weight} onChange={(x) => setHolding(i, { weight: x })} error={v.errors[`w${i}`]} />
                      <NumField compact id={`er${i}`} label="Expense ratio" suffix="%/yr" value={h.er} onChange={(x) => setHolding(i, { er: x })} error={v.errors[`er${i}`]} />
                    </div>
                  </div>))}
              </div>
              <p className="mt-2 text-2xs text-muted">Sliders move the other funds to keep the total at 100%. Typing a weight directly can break the total, and the plan won’t update until it’s fixed.</p>
              {v.errors.total && <div role="alert" className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-red-50 px-2.5 py-2 text-xs text-danger"><span>{v.errors.total}</span>
                {!form.holdings.slice(0, -1).some((_, i) => v.errors[`w${i}`]) && <button type="button" onClick={balance} className="font-semibold underline">Set last fund to the remaining %</button>}</div>}
              {!v.errors.total && <div role="status" className="mt-2 text-xs text-teal-800">Allocation totals {v.total}% ✓</div>}
            </fieldset>
            <div className="mt-4 flex gap-2"><Button onClick={() => valid && run(form)} disabled={!valid || busy} className="flex-1">{busy ? 'Running…' : 'Run Simulation'}</Button><Button variant="secondary" onClick={reset} aria-label="Reset to starting values"><RefreshCw size={14} />Reset</Button></div>
          </Card>
        </aside>

        {/* ───────── results ───────── */}
        <div className="min-w-0 space-y-4">
          {!valid && <ErrorBox title="Inputs need attention" message="Fix the highlighted inputs to update the projection. Showing the last valid results below." />}
          {simErr && <ErrorBox title="Simulation failed" message={friendlyError(simErr, 'the simulation')} onRetry={() => run(form)} />}
          {!sim ? (!simErr && <div role="status" aria-label="Running simulation…" className="space-y-4"><SkeletonCard lines={1} /><Card><Skeleton className="h-72 w-full" /></Card></div>) : (<>
            <div className="sticky top-14 z-20 -mx-1 rounded-xl border border-line bg-white/95 px-4 py-3 shadow-md backdrop-blur" aria-label="Summary" role="region">
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                  <div><Eyebrow>Hypothetical ending value</Eyebrow><div className="flex items-center gap-2"><Money value={sim.hypothetical.ending_value} className="text-2xl font-semibold text-blue-700" />{busy && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" aria-label="Updating" />}</div></div>
                  <div><Eyebrow>vs current plan</Eyebrow><div className={`num text-lg font-semibold ${diff >= 0 ? 'text-teal-700' : 'text-danger'}`} data-testid="summary-diff">{diff >= 0 ? '+' : '−'}{usd(Math.abs(diff))}</div></div>
                  <div className="hidden sm:block"><Eyebrow>Weighted fee</Eyebrow><div className="num text-lg font-semibold">{pct(sim.weighted_expense_ratio_pct)}</div></div>
                </div>
                <div className="flex items-center gap-2"><HypoBadge>Illustrative estimate</HypoBadge><Button size="sm" onClick={explain} className="whitespace-nowrap"><Sparkles size={14} />Explain This Scenario</Button></div>
              </div>
            </div>

            <div className={`space-y-4 transition-opacity ${busy ? 'opacity-75' : ''}`}>
              <Card>
                <SectionHead title="Investment projection" sub={`Illustrative growth over ${res!.scenario.years} years`} right={<HypoBadge>Illustrative estimate</HypoBadge>} />
                <div className="grid gap-4 sm:grid-cols-3">
                  <Stat label="Illustrative ending value" amount={sim.hypothetical.ending_value} sub="Hypothetical plan, including the starting balance" />
                  <Stat label="Total contributed" amount={sim.hypothetical.total_contributions} sub="Initial investment + all monthly contributions" />
                  <Stat label="Modeled growth" amount={sim.hypothetical.modeled_growth} sub="Above total contributed, before taxes and inflation" />
                </div>
                <div className="mt-4 h-72" role="img" aria-label="Line chart of baseline versus hypothetical portfolio value by year, with the gap shaded">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={lineData} margin={{ left: 0, right: 92, top: 10, bottom: 4 }}>
                      <CartesianGrid stroke={C.grid} vertical={false} />
                      <XAxis dataKey="year" tickLine={false} axisLine={{ stroke: C.grid }} tick={AXIS} minTickGap={14} tickFormatter={(y) => `Y${y}`} />
                      <YAxis tickFormatter={(x) => `$${Math.round(x / 1000)}k`} tickLine={false} axisLine={false} width={48} tick={AXIS} />
                      <Tooltip cursor={{ stroke: '#141c30', strokeDasharray: '3 3', strokeOpacity: 0.5 }} content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const p = payload[0].payload as (typeof lineData)[number]
                        return <TipBox title={`Year ${p.year}`} rows={[{ label: 'Hypothetical', value: usd(p.hypo), color: C.blue, strong: true }, { label: 'Current plan', value: usd(p.base), color: C.teal }]} foot={<>Gap <b className="num text-white">{p.up ? '+' : '−'}{usd(p.gap)}</b></>} />
                      }} />
                      <Area dataKey="lo" stackId="g" stroke="none" fill="transparent" isAnimationActive={false} activeDot={false} legendType="none" />
                      <Area dataKey="gap" stackId="g" stroke="none" fill={gapColor} fillOpacity={0.16} isAnimationActive={false} activeDot={false} legendType="none" />
                      <Line dataKey="base" name="Current plan" stroke={C.teal} strokeWidth={2.25} dot={false} activeDot={{ r: 4 }} animationDuration={600} label={endLabel(C.tealDeep, 'Current plan', 10)} />
                      <Line dataKey="hypo" name="Hypothetical" stroke={C.blue} strokeWidth={2.75} dot={false} activeDot={{ r: 5 }} animationDuration={600} label={endLabel(C.blueDeep, 'Hypothetical', -6)} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <p className="mt-2 text-sm" data-testid="diff">Difference at year {res!.scenario.years}: <b className={diff >= 0 ? 'text-teal-700' : 'text-danger'}>{diff >= 0 ? '+' : '−'}{usd(Math.abs(diff))}</b> versus the current plan ({usd(sim.baseline?.ending_value ?? 0)}). The shaded band is that gap. The baseline uses your current allocation and the same duration and return.</p>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <SectionHead title="Portfolio comparison" sub="Current versus hypothetical allocation" />
                  <div className="space-y-5"><AllocBar title="Current allocation" items={baseAlloc} /><AllocBar title="Hypothetical allocation" items={hypoAlloc} accent /></div>
                </Card>
                <Card>
                  <SectionHead title="ETF fee impact" sub="Same inputs, with and without fund fees" right={<IllusBadge>Fee comparison</IllusBadge>} />
                  <div className="grid gap-3">
                    <div className="rounded-lg border border-line p-3"><div className="text-xs text-muted"><Tip text="Weighted expense ratio = each fund's fee × its share of the portfolio, added up.">Current plan · weighted fee {pct(sim.baseline_expense_ratio_pct ?? 0)}</Tip></div>
                      <Money value={bs?.fee_impact.cost_of_fees ?? 0} className="text-xl font-semibold" /><p className="text-2xs text-muted">Modeled cost of fees over {res!.scenario.years} years</p></div>
                    <div className="rounded-lg border border-teal-200 bg-teal-50 p-3"><div className="text-xs text-teal-800">Hypothetical plan · weighted fee {pct(sim.weighted_expense_ratio_pct)}</div>
                      <Money value={sim.fee_impact.cost_of_fees} className="text-xl font-semibold" /><p className="text-2xs text-muted">Modeled cost of fees over {res!.scenario.years} years</p></div>
                  </div>
                  <p className="mt-3 text-xs">Fee cost difference: <b>{usd(Math.abs(sim.fee_impact.cost_of_fees - (bs?.fee_impact.cost_of_fees ?? 0)))}</b> {sim.fee_impact.cost_of_fees <= (bs?.fee_impact.cost_of_fees ?? 0) ? 'less' : 'more'} in fees for the hypothetical plan. Contribution and balance differences also affect this figure.</p>
                </Card>
              </div>

              <Card>
                <SectionHead title="Risk scenarios" sub="Three assumptions, not predictions" right={<IllusBadge>Illustrative scenarios</IllusBadge>} />
                <div className="grid gap-3 md:grid-cols-3">
                  {(['downside', 'base', 'upside'] as const).map((k) => (
                    <div key={k} className={`rounded-lg border p-3 ${k === 'base' ? 'border-blue-200 bg-blue-50' : 'border-line'}`}>
                      <div className="flex items-center gap-2 text-xs font-semibold capitalize"><span className="h-2 w-2 rounded-sm" style={{ background: k === 'downside' ? C.amber : k === 'base' ? C.blue : C.teal }} />{k}</div>
                      <Money value={sim.risk_scenarios[k].ending_value} className="text-xl font-semibold" />
                      <p className="text-2xs text-muted">{pct(sim.risk_scenarios[k].gross_return_pct, 0)} gross return{k === 'base' ? ' · your chosen assumption' : ''}</p>
                    </div>))}
                </div>
                <div className="mt-4 h-56" role="img" aria-label="Line chart of downside, base and upside scenarios">
                  <ResponsiveContainer width="100%" height="100%"><LineChart data={riskData} margin={{ left: 0, right: 76, top: 8 }}>
                    <CartesianGrid stroke={C.grid} vertical={false} /><XAxis dataKey="year" tickLine={false} axisLine={{ stroke: C.grid }} tick={AXIS} minTickGap={14} tickFormatter={(y) => `Y${y}`} />
                    <YAxis tickFormatter={(x) => `$${Math.round(x / 1000)}k`} tickLine={false} axisLine={false} width={48} tick={AXIS} />
                    <Tooltip cursor={{ stroke: '#141c30', strokeDasharray: '3 3', strokeOpacity: 0.5 }} content={({ active, payload }) => {
                      if (!active || !payload?.length) return null; const p = payload[0].payload
                      return <TipBox title={`Year ${p.year}`} rows={[{ label: 'Upside', value: usd(p.upside), color: C.teal }, { label: 'Base', value: usd(p.base), color: C.blue, strong: true }, { label: 'Downside', value: usd(p.downside), color: C.amber }]} />
                    }} />
                    <ReferenceLine y={0} stroke={C.grid} />
                    <Line dataKey="upside" stroke={C.teal} strokeWidth={2} dot={false} animationDuration={600} label={endLabel(C.tealDeep, 'Upside')} />
                    <Line dataKey="base" stroke={C.blue} strokeWidth={2.5} dot={false} animationDuration={600} label={endLabel(C.blueDeep, 'Base')} />
                    <Line dataKey="downside" stroke={C.amber} strokeWidth={2} dot={false} animationDuration={600} label={endLabel('#8a5a0e', 'Downside')} />
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
              </Card>

              <Card>
                <SectionHead title="AI explanation" sub="Plain-language summary of these exact results, via Backboard" right={<Badge tone="hypo">Opens AI Companion</Badge>} />
                <p className="mb-3 text-sm text-muted">The assistant receives the calculated numbers from this page (inputs, ending values, fees, risk scenarios). It is instructed to explain only those figures and never to calculate its own.</p>
                <Button onClick={explain}><Sparkles size={15} />Explain This Scenario</Button>
              </Card>
            </div>
          </>)}
          <Quiz />
        </div>
      </div>
    </>
  )
}
