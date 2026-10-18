import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowRight, Check, Lightbulb } from 'lucide-react'
import { api, type Dashboard as D } from '../api'
import { Badge, Card, DemoBadge, Eyebrow, ErrorBox, Money, SectionHead, Spinner, Stat, Tip } from '../components/ui'
import { AXIS, C, TipBox } from '../components/charts'
import { useAsync } from '../lib/useAsync'
import { friendlyError } from '../lib/errors'
import { usd, pct } from '../lib/format'
import { buildRoadmap, goalLabel } from '../lib/roadmap'
import { useStore } from '../store'

const SEG = [C.blue, C.teal, C.violet, C.amber]
const TYPE_LABEL = { checking: 'Checking', savings: 'Savings', investment: 'Investment', liability: 'Credit / liability' }

/** A small ratio gauge (not a trend: the demo data has no history). */
function Chip({ label, value, ratio, color }: { label: string; value: string; ratio: number; color: string }) {
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2 shadow-xs">
      <div className="flex items-baseline justify-between gap-2"><span className="text-xs text-muted">{label}</span><span className="num text-sm font-semibold">{value}</span></div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${Math.max(2, Math.min(100, ratio))}%`, background: color }} /></div>
    </div>
  )
}

function useDone() {
  const [done, setDone] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('mb.roadmapDone') || '[]') } catch { return [] } })
  useEffect(() => { try { localStorage.setItem('mb.roadmapDone', JSON.stringify(done)) } catch { /* ignore */ } }, [done])
  return [done, (t: string) => setDone((d) => (d.includes(t) ? d.filter((x) => x !== t) : [...d, t]))] as const
}

export default function Dashboard() {
  const { data, error, loading, retry } = useAsync(api.dashboard)
  const { profile } = useStore()
  const [done, toggleDone] = useDone()
  if (loading) return <Spinner label="Loading your overview…" />
  if (error || !data) return <ErrorBox title="Dashboard unavailable" message={friendlyError(error, 'the dashboard')} onRetry={retry} />
  const d: D = data
  const roadmap = buildRoadmap(profile?.goals ?? [])
  const firstOpen = roadmap.findIndex((s) => !done.includes(s.title))
  const cf = [{ name: 'Income', value: d.cash_flow.monthly_income, fill: 'url(#gBlue)' }, { name: 'Expenses', value: d.cash_flow.monthly_expenses, fill: 'url(#gTeal)' }]
  const surplus = d.cash_flow.monthly_surplus
  const surplusShare = (surplus / d.cash_flow.monthly_income) * 100
  const investShare = (d.portfolio.total / d.total_assets) * 100
  const debtShare = (d.total_liabilities / d.total_assets) * 100
  const assetAccts = d.accounts.filter((a) => a.type !== 'liability')

  return (
    <>
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div><Eyebrow className="mb-1">Welcome back, {profile?.name}</Eyebrow><h1 className="text-2xl font-semibold sm:text-3xl">Your financial overview</h1></div>
        <div className="flex items-center gap-2"><DemoBadge /><span className="text-xs text-muted">Static demo snapshot · not synced to any bank</span></div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="lg:col-span-1"><Stat label="Net worth" amount={d.net_worth} sub="Assets − liabilities" /></Card>
        <Card><Stat label="Total assets" amount={d.total_assets} sub="Checking, savings, investments" /></Card>
        <Card><Stat label="Total liabilities" amount={d.total_liabilities} sub="Credit card balance" /></Card>
        <Card><Stat label="Monthly surplus" amount={surplus} tone={surplus >= 0 ? 'pos' : 'neg'} sub="Income − expenses" /></Card>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3" aria-label="Key ratios">
        <Chip label="Surplus rate" value={pct(surplusShare, 0)} ratio={surplusShare} color={C.teal} />
        <Chip label="Investments / assets" value={pct(investShare, 0)} ratio={investShare} color={C.blue} />
        <Chip label="Liabilities / assets" value={pct(debtShare, 0)} ratio={debtShare} color={C.amber} />
      </div>

      <Card className="mt-4">
        <SectionHead title="Net worth composition" sub="Where your assets sit, and what is owed" right={<DemoBadge />} />
        <div role="img" aria-label={`Assets ${usd(d.total_assets)}, liabilities ${usd(d.total_liabilities)}`}>
          <div className="mb-1 flex justify-between text-xs"><span className="eyebrow">Assets</span><span className="num font-semibold">{usd(d.total_assets)}</span></div>
          <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">{assetAccts.map((a, i) => <div key={a.id} title={`${a.name} ${usd(a.balance)}`} style={{ width: `${(a.balance / d.total_assets) * 100}%`, background: SEG[i] }} className={i ? 'border-l-2 border-white' : ''} />)}</div>
          <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs">{assetAccts.map((a, i) => <li key={a.id} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm" style={{ background: SEG[i] }} /><span className="text-muted">{a.name}</span><span className="num font-semibold">{usd(a.balance)}</span></li>)}</ul>
          <div className="mb-1 mt-4 flex justify-between text-xs"><span className="eyebrow">Liabilities</span><span className="num font-semibold text-danger">−{usd(d.total_liabilities)}</span></div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-red-600/80" style={{ width: `${debtShare}%` }} /></div>
          <p className="mt-1 text-xs text-muted">Bars share one scale: liabilities are {pct(debtShare, 0)} of assets.</p>
        </div>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <SectionHead title="Monthly cash flow" sub="Income versus expenses" right={<DemoBadge />} />
          <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
            <div><span className="eyebrow">Surplus</span> <Money value={surplus} className="text-xl font-semibold text-teal-700" /></div>
          </div>
          <div className="mt-2 h-60" role="img" aria-label={`Income ${usd(d.cash_flow.monthly_income)} versus expenses ${usd(d.cash_flow.monthly_expenses)} per month`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cf} barSize={72} margin={{ top: 24, right: 8 }}>
                <defs>
                  <linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5a90ec" /><stop offset="1" stopColor="#2c66c4" /></linearGradient>
                  <linearGradient id="gTeal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3fb39a" /><stop offset="1" stopColor="#178a72" /></linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke={C.grid} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ ...AXIS, fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `$${v / 1000}k`} tickLine={false} axisLine={false} width={40} tick={AXIS} />
                <Tooltip cursor={{ fill: 'rgb(54 118 216 / 0.06)' }} content={({ active, payload }) => active && payload?.length ? <TipBox title={String(payload[0].payload.name)} rows={[{ label: 'Per month', value: usd(Number(payload[0].value)), strong: true }]} foot="Demo data" /> : null} />
                <Bar dataKey="value" radius={[8, 8, 2, 2]} animationDuration={700}>
                  {cf.map((c) => <Cell key={c.name} fill={c.fill} />)}
                  <LabelList dataKey="value" position="top" formatter={(v) => usd(Number(v))} style={{ fontSize: 12, fontWeight: 600, fill: '#141c30' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-1 text-xs text-muted">The demo dataset has one month of values, so no trend is drawn. History would appear here only if real data existed.</p>
        </Card>

        <Card className="lg:col-span-2">
          <SectionHead title="Investment portfolio" sub={`${usd(d.portfolio.total)} · fictional ETFs`} right={<DemoBadge />} />
          <div className="relative mx-auto h-44 w-44" role="img" aria-label="Portfolio allocation donut chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>{[0, 1].map((i) => <linearGradient key={i} id={`gp${i}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={SEG[i]} stopOpacity={0.75} /><stop offset="1" stopColor={SEG[i]} /></linearGradient>)}</defs>
                <Pie data={d.portfolio.holdings} dataKey="value" nameKey="name" innerRadius={56} outerRadius={82} paddingAngle={3} cornerRadius={5} stroke="none" animationDuration={700}>
                  {d.portfolio.holdings.map((_, i) => <Cell key={i} fill={`url(#gp${i})`} />)}</Pie>
                <Tooltip content={({ active, payload }) => active && payload?.length ? <TipBox title={String(payload[0].name)} rows={[{ label: 'Value', value: usd(Number(payload[0].value)), strong: true }, { label: 'Allocation', value: pct(payload[0].payload.allocation_pct, 0) }]} /> : null} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="eyebrow">Total</span><Money value={d.portfolio.total} className="text-lg font-semibold" /></div>
          </div>
          <ul className="mt-3 space-y-2.5 text-sm">
            {d.portfolio.holdings.map((h, i) => (
              <li key={h.name}>
                <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: SEG[i] }} />{h.name}</span><b className="num">{pct(h.allocation_pct, 0)}</b></div>
                <div className="ml-[18px] text-xs text-muted">{usd(h.value)} · <Tip text="Expense ratio is the yearly fee a fund charges, as a % of what you hold.">expense ratio {pct(h.expense_ratio_pct)}</Tip></div>
              </li>))}
          </ul>
        </Card>
      </div>

      <Card className="mt-4">
        <SectionHead title="Accounts" sub="Name, type, balance and data source" />
        <div className="-mx-1 overflow-x-auto px-1">
          <table className="w-full min-w-[480px] text-sm">
            <thead><tr className="border-b border-line text-left"><th className="eyebrow py-2 pr-3 font-semibold">Account</th><th className="eyebrow py-2 pr-3 font-semibold">Type</th><th className="eyebrow py-2 pr-3 text-right font-semibold">Balance</th><th className="eyebrow py-2 pl-3 font-semibold">Source</th></tr></thead>
            <tbody>{d.accounts.map((a) => (
              <tr key={a.id} className="border-b border-line/70 transition-colors last:border-0 hover:bg-slate-50">
                <td className="py-2.5 pr-3 font-medium">{a.name}</td><td className="py-2.5 pr-3 text-muted">{TYPE_LABEL[a.type]}</td>
                <td className={`num py-2.5 pr-3 text-right font-semibold ${a.type === 'liability' ? 'text-danger' : ''}`}>{a.type === 'liability' ? '−' : ''}{usd(a.balance)}</td>
                <td className="py-2.5 pl-3">{a.source === 'demo' ? <DemoBadge /> : <Badge>Manual</Badge>}</td>
              </tr>))}</tbody>
          </table>
        </div>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <SectionHead title="Your goals" sub="From your onboarding choices" />
          {profile?.goals.length ? (
            <ul className="space-y-2">{profile.goals.map((g) => (
              <li key={g} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-slate-25 px-3 py-2.5 text-sm"><span className="font-medium">{goalLabel(g)}</span><Badge>No progress data</Badge></li>))}</ul>
          ) : <p className="text-sm text-muted">No goals selected yet. Add some in <Link to="/settings" className="font-semibold text-brand underline-offset-2 hover:underline">Settings</Link>.</p>}
          <p className="mt-3 text-xs text-muted">Progress bars appear only when real balances exist for a goal. None are invented.</p>
        </Card>
        <Card className="lg:col-span-3">
          <SectionHead title="Your roadmap" sub="Rule-based steps from your goals" />
          <ol className="relative">{roadmap.map((s, i) => {
            const isDone = done.includes(s.title), current = i === firstOpen
            return (
              <li key={s.title} className="relative flex gap-3 pb-5 last:pb-0">
                {i < roadmap.length - 1 && <span aria-hidden className={`absolute left-[13px] top-7 h-[calc(100%-1.5rem)] w-px ${isDone ? 'bg-teal-400' : 'bg-slate-200'}`} />}
                <button onClick={() => toggleDone(s.title)} aria-pressed={isDone} aria-label={`${isDone ? 'Mark not done' : 'Mark done'}: ${s.title}`}
                  className={`z-10 mt-0.5 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors ${isDone ? 'border-teal-500 bg-teal-500 text-white' : current ? 'border-brand bg-white text-brand' : 'border-slate-300 bg-white text-slate-500'}`}>{isDone ? <Check size={14} strokeWidth={3} /> : i + 1}</button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><span className="eyebrow !text-violet">{s.tag}</span>
                    <Badge tone={isDone ? 'demo' : current ? 'hypo' : 'neutral'}>{isDone ? 'Done' : current ? 'Current' : 'Up next'}</Badge></div>
                  <div className={`font-semibold ${isDone ? 'text-muted line-through decoration-slate-300' : ''}`}>{s.title}</div>
                  <p className="text-sm text-muted">{s.text}</p>
                  <Link to={s.to} className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-brand transition-colors hover:text-blue-800">{s.cta}<ArrowRight size={14} /></Link>
                </div>
              </li>)
          })}</ol>
        </Card>
      </div>

      <Card className="mt-4" tone="brand">
        <div className="flex flex-wrap items-start gap-3"><Lightbulb className="mt-0.5 shrink-0 text-brand" size={18} />
          <div className="min-w-0 flex-1"><h2 className="font-semibold">Insights from your demo data</h2>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-sm">
              <li>Your monthly surplus is {usd(surplus)}, or {pct(surplusShare, 0)} of income.</li>
              <li>Investments make up {pct(investShare, 0)} of your assets ({usd(d.portfolio.total)} of {usd(d.total_assets)}).</li>
            </ul>
            <p className="mt-1.5 text-xs text-muted">Simple ratios of the demo values above. Not advice.</p></div>
          <Link to="/twin" className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-brand px-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98]">Explore in Financial Twin<ArrowRight size={14} /></Link>
        </div>
      </Card>
    </>
  )
}
