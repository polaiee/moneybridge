import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowRight, BookOpen, Lightbulb } from 'lucide-react'
import { api, type Dashboard as D } from '../api'
import { Badge, Card, DemoBadge, ErrorBox, SectionHead, Spinner, Stat, Tip } from '../components/ui'
import { useAsync } from '../lib/useAsync'
import { usd, pct } from '../lib/format'
import { buildRoadmap, goalLabel } from '../lib/roadmap'
import { useStore } from '../store'

const COLORS = ['#3676d8', '#22a58a', '#7b5fc9', '#e8a03a']
const TYPE_LABEL = { checking: 'Checking', savings: 'Savings', investment: 'Investment', liability: 'Credit / liability' }

export default function Dashboard() {
  const { data, error, loading, retry } = useAsync(api.dashboard)
  const { profile } = useStore()
  if (loading) return <Spinner label="Loading your overview…" />
  if (error || !data) return <ErrorBox message={`Couldn’t load the dashboard (${error}). Is the backend running on port 8000?`} onRetry={retry} />
  const d: D = data
  const roadmap = buildRoadmap(profile?.goals ?? [])
  const cf = [{ name: 'Income', value: d.cash_flow.monthly_income }, { name: 'Expenses', value: d.cash_flow.monthly_expenses }]
  const surplus = d.cash_flow.monthly_surplus
  const surplusShare = (surplus / d.cash_flow.monthly_income) * 100
  const investShare = (d.portfolio.total / d.total_assets) * 100

  return (
    <>
      <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-soft via-white to-teal-soft p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted">Welcome back, {profile?.name}</p>
            <h1 className="mt-1 text-3xl font-semibold sm:text-4xl">Your financial overview</h1>
          </div>
          <div className="flex flex-col items-start gap-1 sm:items-end"><DemoBadge /><span className="text-xs text-muted">Static demo snapshot · not synced to any bank</span></div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><Stat label="Net worth" value={usd(d.net_worth)} sub="Assets − liabilities" /></Card>
        <Card><Stat label="Total assets" value={usd(d.total_assets)} sub="Checking, savings, investments" /></Card>
        <Card><Stat label="Total liabilities" value={usd(d.total_liabilities)} sub="Credit card balance" /></Card>
        <Card><Stat label="Monthly surplus" value={usd(surplus)} tone={surplus >= 0 ? 'pos' : 'neg'} sub="Income − expenses" /></Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <SectionHead title="Monthly cash flow" sub="Income versus expenses for the demo persona" right={<DemoBadge />} />
          <div className="h-64" role="img" aria-label={`Income ${usd(d.cash_flow.monthly_income)} versus expenses ${usd(d.cash_flow.monthly_expenses)} per month`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cf} barSize={64}>
                <CartesianGrid vertical={false} stroke="#e3eaf5" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(v) => `$${v / 1000}k`} tickLine={false} axisLine={false} width={44} />
                <Tooltip formatter={(v) => usd(Number(v))} cursor={{ fill: '#eaf1fd' }} />
                <Bar isAnimationActive={false} dataKey="value" radius={[8, 8, 0, 0]}>{cf.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-muted">The demo dataset has one month of values, so no trend is drawn. Month-by-month history would appear here only if real data existed.</p>
        </Card>

        <Card className="lg:col-span-2">
          <SectionHead title="Investment portfolio" sub={`Total ${usd(d.portfolio.total)} · fictional ETFs`} right={<DemoBadge />} />
          <div className="flex flex-col items-center gap-4">
            <div className="h-44 w-44 shrink-0" role="img" aria-label="Portfolio allocation donut chart">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie isAnimationActive={false} data={d.portfolio.holdings} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {d.portfolio.holdings.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}</Pie><Tooltip formatter={(v) => usd(Number(v))} /></PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="w-full space-y-3 text-sm">
              {d.portfolio.holdings.map((h, i) => (
                <li key={h.name}>
                  <div className="flex items-center justify-between gap-2"><span className="flex items-center gap-2 whitespace-nowrap"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS[i] }} />{h.name}</span><b className="tabular">{pct(h.allocation_pct, 0)}</b></div>
                  <div className="ml-4.5 text-xs text-muted">{usd(h.value)} · <Tip text="Expense ratio is the yearly fee a fund charges, as a % of what you hold.">expense ratio {pct(h.expense_ratio_pct)}</Tip></div>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </div>

      <Card className="mt-5">
        <SectionHead title="Accounts" sub="Name, type, balance and where the data comes from" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-sm">
            <thead><tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted"><th className="py-2 pr-3 font-medium">Account</th><th className="py-2 pr-3 font-medium">Type</th><th className="py-2 pr-3 text-right font-medium">Balance</th><th className="py-2 pl-3 font-medium">Source</th></tr></thead>
            <tbody>
              {d.accounts.map((a) => (
                <tr key={a.id} className="border-b border-line/60 last:border-0">
                  <td className="py-3 pr-3 font-medium">{a.name}</td><td className="py-3 pr-3 text-muted">{TYPE_LABEL[a.type]}</td>
                  <td className={`tabular py-3 pr-3 text-right font-medium ${a.type === 'liability' ? 'text-danger' : ''}`}>{a.type === 'liability' ? '−' : ''}{usd(a.balance)}</td>
                  <td className="py-3 pl-3">{a.source === 'demo' ? <DemoBadge /> : <Badge>Manual</Badge>}</td>
                </tr>))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <SectionHead title="Your goals" sub="From your onboarding choices" />
          {profile?.goals.length ? (
            <ul className="space-y-3">{profile.goals.map((g) => (
              <li key={g} className="flex items-center justify-between gap-3 rounded-xl border border-line p-3 text-sm"><span className="font-medium">{goalLabel(g)}</span><span className="text-xs text-muted">No progress data yet</span></li>))}</ul>
          ) : <p className="text-sm text-muted">No goals selected yet. Add some in <Link to="/settings" className="font-semibold text-brand-dark">Settings</Link>.</p>}
          <p className="mt-3 text-xs text-muted">Progress bars appear only when real balances exist for a goal. The demo dataset has no goal targets, so none are invented.</p>
        </Card>
        <Card>
          <SectionHead title="Your next steps" sub="Rule-based roadmap from your goals" />
          <ul className="space-y-4">{roadmap.map((s) => (
            <li key={s.title} className="flex gap-3">
              <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand"><BookOpen size={17} /></span>
              <div><div className="text-[11px] font-semibold uppercase tracking-wide text-violet">{s.tag}</div><div className="font-semibold">{s.title}</div><p className="text-sm text-muted">{s.text}</p>
                <Link to={s.to} className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-brand-dark hover:underline">{s.cta}<ArrowRight size={14} /></Link></div>
            </li>))}</ul>
        </Card>
      </div>

      <Card className="mt-5" tone="brand">
        <div className="flex items-start gap-3"><Lightbulb className="mt-0.5 shrink-0 text-brand" size={20} />
          <div className="flex-1"><h2 className="font-semibold">Insights from your demo data</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              <li>Your monthly surplus is {usd(surplus)}, or {pct(surplusShare, 0)} of income.</li>
              <li>Investments make up {pct(investShare, 0)} of your assets ({usd(d.portfolio.total)} of {usd(d.total_assets)}).</li>
            </ul>
            <p className="mt-2 text-xs text-muted">Simple ratios of the demo values above. Not advice.</p></div>
          <Link to="/twin" className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">Explore in Financial Twin<ArrowRight size={14} /></Link>
        </div>
      </Card>
    </>
  )
}
