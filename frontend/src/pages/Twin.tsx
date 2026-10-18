import { useEffect, useMemo, useRef, useState } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { RefreshCw, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api, type Dashboard, type Scenario, type SimResult } from '../api'
import { Badge, Button, Card, DemoBadge, ErrorBox, HypoBadge, PageHeader, SectionHead, Spinner, Stat, Tip } from '../components/ui'
import { useAsync } from '../lib/useAsync'
import { pct, usd } from '../lib/format'
import { useStore, type TwinForm } from '../store'

const BLUE = '#3676d8', TEAL = '#22a58a', AMBER = '#e8a03a'
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

function NumField({ label, value, onChange, error, prefix, suffix, id, hint }: { label: string; value: string; onChange: (v: string) => void; error?: string; prefix?: string; suffix?: string; id: string; hint?: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">{label}</label>
      <div className={`flex items-center rounded-xl border bg-white px-3 ${error ? 'border-danger' : 'border-line'} focus-within:ring-2 focus-within:ring-brand/40`}>
        {prefix && <span className="mr-1 text-muted">{prefix}</span>}
        <input id={id} inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} className="tabular w-full bg-transparent py-2.5 outline-none" />
        {suffix && <span className="ml-1 text-muted">{suffix}</span>}
      </div>
      {error ? <p id={`${id}-err`} className="mt-1 text-xs text-danger">{error}</p> : hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  )
}

function AllocBar({ title, items, accent }: { title: string; items: { name: string; w: number }[]; accent?: boolean }) {
  const colors = [BLUE, TEAL, AMBER]
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm font-medium">{title}{accent && <HypoBadge />}</div>
      <div className="flex h-5 overflow-hidden rounded-full bg-line" role="img" aria-label={items.map((i) => `${i.name} ${i.w}%`).join(', ')}>
        {items.map((it, i) => <div key={it.name} style={{ width: `${Math.max(it.w, 0)}%`, background: colors[i % 3] }} />)}
      </div>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">{items.map((it, i) => <li key={it.name} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: colors[i % 3] }} />{it.name} · {it.w}%</li>)}</ul>
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
            className={`block w-full rounded-xl border p-3 text-left text-sm ${done && right ? 'border-teal bg-teal-soft' : done && pick === k ? 'border-danger bg-danger-soft' : 'border-line bg-white hover:border-brand/50'}`}>{o}</button>
        })}
      </div>
      {pick !== null && <div className="mt-3 rounded-xl bg-brand-soft/60 p-3 text-sm" role="status"><b>{pick === q.answer ? 'Correct. ' : 'Not quite. '}</b>{q.why}
        {i < QUIZ.length - 1 && <button onClick={() => { setI(i + 1); setPick(null) }} className="ml-2 font-semibold text-brand-dark underline">Next question</button>}</div>}
    </Card>
  )
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

  if (loading || (!form && !dashErr)) return <Spinner label="Loading your starting portfolio…" />
  if (dashErr || !dash || !form || !v) return <ErrorBox message={`Couldn’t load the starting portfolio (${dashErr}).`} onRetry={retry} />

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
  const lineData = sim ? sim.hypothetical.yearly_values.map((y, i) => ({ year: i, hypothetical: y, baseline: sim.baseline?.yearly_values[i] })) : []
  const riskData = sim ? sim.risk_scenarios.base.yearly_values.map((_, i) => ({ year: i, downside: sim.risk_scenarios.downside.yearly_values[i], base: sim.risk_scenarios.base.yearly_values[i], upside: sim.risk_scenarios.upside.yearly_values[i] })) : []
  const diff = sim?.difference_at_end ?? 0
  const explain = () => {
    setPendingAsk({ message: 'Explain this Financial Twin scenario to me in plain language. Use only the numbers provided.', scenario: true })
    nav('/companion')
  }

  return (
    <>
      <PageHeader title="Financial Twin" eyebrow="Simulation lab" sub="Explore how different investing choices might affect a hypothetical future. Change an input and every number below is recalculated by the backend."
        right={<div className="flex gap-2"><Button variant="secondary" onClick={reset}><RefreshCw size={15} />Reset</Button><Button onClick={() => valid && run(form)} disabled={!valid || busy}>{busy ? 'Running…' : 'Run Simulation'}</Button></div>} />

      <Card className="mb-5">
        <SectionHead title="Starting position" sub="Your current investment baseline" right={<DemoBadge />} />
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <Stat label="Starting investment" value={usd(dash.portfolio.total)} sub="Brokerage balance from the Dashboard (demo)" />
            <div className="mt-4 max-w-xs">
              <NumField id="baseMonthly" label="Current monthly contribution" prefix="$" value={form.baselineMonthly} onChange={(x) => set({ baselineMonthly: x })} error={v.errors.baselineMonthly}
                hint={<><Badge>Illustrative assumption</Badge> The demo data has no recorded contribution.</>} />
            </div>
          </div>
          <AllocBar title="Current ETF allocation" items={baseAlloc} />
        </div>
      </Card>

      <Card className="mb-5">
        <SectionHead title="Simulation controls" sub="Explore a hypothetical plan" right={<HypoBadge>Hypothetical plan</HypoBadge>} />
        <div className="grid gap-4 sm:grid-cols-2">
          <NumField id="initial" label="Initial investment" prefix="$" value={form.initial} onChange={(x) => set({ initial: x })} error={v.errors.initial} />
          <NumField id="years" label="Investment duration" suffix="years" value={form.years} onChange={(x) => set({ years: x })} error={v.errors.years} />
          <NumField id="monthly" label="Monthly contribution" prefix="$" value={form.monthly} onChange={(x) => set({ monthly: x })} error={v.errors.monthly} hint="Added at the end of each month" />
          <NumField id="gross" label="Assumed gross annual return" suffix="%" value={form.gross} onChange={(x) => set({ gross: x })} error={v.errors.gross} hint="An assumption you choose, not a prediction" />
        </div>
        <fieldset className="mt-6">
          <legend className="mb-1 text-sm font-semibold"><Tip text="How your money is split between funds. The percentages must add up to 100%.">ETF allocation</Tip></legend>
          <div className="space-y-4">
            {form.holdings.map((h, i) => (
              <div key={h.name} className="grid items-center gap-3 rounded-xl border border-line p-3 sm:grid-cols-[1fr_auto]">
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm"><span className="font-medium">{h.name}</span><span className="tabular font-semibold text-brand-dark">{num(h.weight) || 0}%</span></div>
                  <input type="range" min={0} max={100} step={1} value={num(h.weight) || 0} aria-label={`${h.name} weight`} onChange={(e) => setHolding(i, { weight: e.target.value })} className="w-full" />
                  {v.errors[`w${i}`] && <p className="text-xs text-danger">{v.errors[`w${i}`]}</p>}
                </div>
                <div className="w-full sm:w-40"><NumField id={`er${i}`} label="Expense ratio" suffix="%/yr" value={h.er} onChange={(x) => setHolding(i, { er: x })} error={v.errors[`er${i}`]} /></div>
              </div>
            ))}
          </div>
          <div className={`mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm ${v.errors.total ? 'bg-danger-soft text-danger' : 'bg-teal-soft text-teal-dark'}`} role={v.errors.total ? 'alert' : 'status'}>
            <span>{v.errors.total ?? `Allocation totals ${v.total}% ✓`}</span>
            {v.errors.total && !form.holdings.slice(0, -1).some((_, i) => v.errors[`w${i}`]) && <button type="button" onClick={balance} className="font-semibold underline">Set last fund to the remaining %</button>}
          </div>
        </fieldset>
      </Card>

      {!valid && <div className="mb-5"><ErrorBox message="Fix the highlighted inputs to update the projection. Showing the last valid results below." /></div>}
      {simErr && <div className="mb-5"><ErrorBox message={`Simulation failed: ${simErr}`} onRetry={() => run(form)} /></div>}
      {!sim ? <Spinner label="Running simulation…" /> : (
        <div className={busy ? 'opacity-70 transition-opacity' : 'transition-opacity'}>
          <Card className="mb-5">
            <SectionHead title="Investment projection" sub={`Illustrative growth over ${res!.scenario.years} years`} right={<HypoBadge>Illustrative estimate</HypoBadge>} />
            <div className="grid gap-4 sm:grid-cols-3">
              <Stat label="Illustrative ending value" value={usd(sim.hypothetical.ending_value)} sub="Hypothetical plan, including the starting balance" />
              <Stat label="Total contributed" value={usd(sim.hypothetical.total_contributions)} sub="Initial investment + all monthly contributions" />
              <Stat label="Modeled growth" value={usd(sim.hypothetical.modeled_growth)} sub="Above total contributed, before taxes and inflation" />
            </div>
            <div className="mt-5 h-72" role="img" aria-label="Line chart of baseline versus hypothetical portfolio value by year">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData} margin={{ left: 4, right: 12, top: 8 }}>
                  <CartesianGrid stroke="#e3eaf5" vertical={false} />
                  <XAxis dataKey="year" tickLine={false} label={{ value: 'Years', position: 'insideBottomRight', offset: -4, fontSize: 12 }} />
                  <YAxis tickFormatter={(x) => `$${Math.round(x / 1000)}k`} tickLine={false} axisLine={false} width={52} />
                  <Tooltip formatter={(x) => usd(Number(x))} labelFormatter={(y) => `Year ${y}`} />
                  <Legend verticalAlign="top" align="left" />
                  <Line name="Hypothetical plan" dataKey="hypothetical" stroke={BLUE} strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
                  <Line name="Current plan (baseline)" dataKey="baseline" stroke={TEAL} strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-sm" data-testid="diff">Difference at year {res!.scenario.years}: <b className={diff >= 0 ? 'text-teal-dark' : 'text-danger'}>{diff >= 0 ? '+' : '−'}{usd(Math.abs(diff))}</b> versus the current plan ({usd(sim.baseline?.ending_value ?? 0)}). The baseline uses your current allocation and the same duration and return.</p>
          </Card>

          <Card className="mb-5">
            <SectionHead title="Portfolio comparison" sub="Current versus hypothetical allocation" />
            <div className="grid gap-6 md:grid-cols-2"><AllocBar title="Current allocation" items={baseAlloc} /><AllocBar title="Hypothetical allocation" items={hypoAlloc} accent /></div>
          </Card>

          <Card className="mb-5">
            <SectionHead title="ETF fee impact" sub="Same inputs, with and without fund fees" right={<Badge>Fee comparison</Badge>} />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-line p-4"><div className="text-sm text-muted"><Tip text="Weighted expense ratio = each fund's fee × its share of the portfolio, added up.">Current plan · weighted fee {pct(sim.baseline_expense_ratio_pct ?? 0)}</Tip></div>
                <div className="tabular mt-1 text-2xl font-semibold">{usd(bs?.fee_impact.cost_of_fees ?? 0)}</div><p className="text-xs text-muted">Modeled cost of fees over {res!.scenario.years} years</p></div>
              <div className="rounded-xl border border-teal/30 bg-teal-soft p-4"><div className="text-sm text-teal-dark">Hypothetical plan · weighted fee {pct(sim.weighted_expense_ratio_pct)}</div>
                <div className="tabular mt-1 text-2xl font-semibold">{usd(sim.fee_impact.cost_of_fees)}</div><p className="text-xs text-muted">Modeled cost of fees over {res!.scenario.years} years</p></div>
            </div>
            <p className="mt-3 text-sm">Fee cost difference: <b>{usd(Math.abs(sim.fee_impact.cost_of_fees - (bs?.fee_impact.cost_of_fees ?? 0)))}</b> {sim.fee_impact.cost_of_fees <= (bs?.fee_impact.cost_of_fees ?? 0) ? 'less' : 'more'} in fees for the hypothetical plan. (Contribution and balance differences also affect this figure.)</p>
          </Card>

          <Card className="mb-5">
            <SectionHead title="Risk scenarios" sub="Three assumptions, not predictions" right={<Badge>Illustrative scenarios</Badge>} />
            <div className="grid gap-4 md:grid-cols-3">
              {(['downside', 'base', 'upside'] as const).map((k) => (
                <div key={k} className={`rounded-xl border p-4 ${k === 'base' ? 'border-teal/30 bg-teal-soft' : 'border-line'}`}>
                  <div className="text-sm font-medium capitalize">{k}</div>
                  <div className="tabular mt-1 text-2xl font-semibold">{usd(sim.risk_scenarios[k].ending_value)}</div>
                  <p className="text-xs text-muted">{pct(sim.risk_scenarios[k].gross_return_pct, 0)} gross return{k === 'base' ? ' · your chosen assumption' : ''}</p>
                </div>))}
            </div>
            <div className="mt-4 h-56" role="img" aria-label="Line chart of downside, base and upside scenarios">
              <ResponsiveContainer width="100%" height="100%"><LineChart data={riskData} margin={{ left: 4, right: 12 }}>
                <CartesianGrid stroke="#e3eaf5" vertical={false} /><XAxis dataKey="year" tickLine={false} />
                <YAxis tickFormatter={(x) => `$${Math.round(x / 1000)}k`} tickLine={false} axisLine={false} width={52} />
                <Tooltip formatter={(x) => usd(Number(x))} labelFormatter={(y) => `Year ${y}`} /><Legend />
                <Line dataKey="downside" stroke={AMBER} strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line dataKey="base" stroke={BLUE} strokeWidth={2.5} dot={false} isAnimationActive={false} />
                <Line dataKey="upside" stroke={TEAL} strokeWidth={2} dot={false} isAnimationActive={false} /></LineChart></ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-muted">Illustrative scenarios, not forecasts or probability ranges. The downside is not a floor: returns can be negative and capital can be lost.</p>
          </Card>

          <Card className="mb-5" tone="brand">
            <SectionHead title="Calculation assumptions" sub="Everything is computed by deterministic backend code" />
            <ul className="grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
              <li><b>Monthly rate:</b> {sim.assumptions.monthly_rate}</li><li><b>Contributions:</b> {sim.assumptions.contribution_timing}</li>
              <li><b>Excluded:</b> {sim.assumptions.excluded.join(', ')}</li><li><b>Rounding:</b> cents, at output only</li>
            </ul>
            <p className="mt-2 text-xs text-muted">{sim.assumptions.disclaimer} Educational illustration, not individualized investment advice.</p>
          </Card>

          <Card className="mb-5">
            <SectionHead title="AI explanation" sub="Plain-language summary of these exact results, via Backboard" right={<Badge>Opens AI Companion</Badge>} />
            <p className="mb-4 text-sm text-muted">The assistant receives the calculated numbers from this page (inputs, ending values, fees, risk scenarios). It is instructed to explain only those figures and never to calculate its own.</p>
            <Button onClick={explain}><Sparkles size={16} />Explain This Scenario</Button>
          </Card>
        </div>
      )}
      <Quiz />
    </>
  )
}
