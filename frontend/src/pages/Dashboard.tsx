import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowRight, ArrowUpRight, Banknote, Check, CreditCard, Landmark, LineChart, PiggyBank, Wallet } from 'lucide-react'
import { api, type Account, type Dashboard as D } from '../api'
import { Badge, Button, Card, DemoBadge, Eyebrow, ErrorBox, Money, SectionHead, Spinner, Tip } from '../components/ui'
import { AXIS, C, TipBox } from '../components/charts'
import { useAsync } from '../lib/useAsync'
import { friendlyError } from '../lib/errors'
import { usd, pct } from '../lib/format'
import { buildRoadmap, goalLabel } from '../lib/roadmap'
import { useStore } from '../store'

const HOLD = [C.forest, C.lime, C.sage, C.lilac]

function useDone() {
  const [done, setDone] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('mb.roadmapDone') || '[]') } catch { return [] } })
  useEffect(() => { try { localStorage.setItem('mb.roadmapDone', JSON.stringify(done)) } catch { /* ignore */ } }, [done])
  return [done, (t: string) => setDone((d) => (d.includes(t) ? d.filter((x) => x !== t) : [...d, t]))] as const
}

/** Icon chip + eyebrow label used at the top of every KPI card. */
const KpiHead = ({ icon, label }: { icon: ReactNode; label: string }) => (
  <div className="flex items-center justify-between"><Eyebrow>{label}</Eyebrow><span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-100 text-forest-800">{icon}</span></div>
)

/** Hero sparkline slot. The demo data is a single snapshot, so this is a labelled placeholder, never a fake trend. */
function SparklinePlaceholder() {
  return (
    <div className="mt-5">
      <svg viewBox="0 0 320 56" className="h-14 w-full" role="img" aria-label="No balance history available: single demo snapshot">
        <line x1="2" y1="40" x2="300" y2="40" stroke="#f8f7f2" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="3 6" strokeLinecap="round" />
        <circle cx="304" cy="40" r="9" fill="#c8ea54" fillOpacity="0.22" /><circle cx="304" cy="40" r="4.5" fill="#c8ea54" />
        <text x="304" y="14" textAnchor="end" fontSize="10" fill="#f8f7f2" fillOpacity="0.7">Today</text>
      </svg>
      <p className="mt-1 text-2xs text-ivory/65">One demo snapshot. A balance history will chart here once real data exists.</p>
    </div>
  )
}

/** 100-tick segmented ring: one tick per percentage point of allocation. */
function SegmentedRing({ holdings, total, hover, setHover }: { holdings: D['portfolio']['holdings']; total: number; hover: number | null; setHover: (i: number | null) => void }) {
  const ticks: number[] = []
  holdings.forEach((h, i) => { for (let k = 0; k < Math.round(h.allocation_pct); k++) ticks.push(i) })
  while (ticks.length < 100) ticks.push(holdings.length - 1)
  return (
    <div className="relative mx-auto h-52 w-52" role="img" aria-label={`Portfolio allocation: ${holdings.map((h) => `${h.name} ${h.allocation_pct}%`).join(', ')}`}>
      <svg viewBox="0 0 200 200" className="h-full w-full">
        {ticks.slice(0, 100).map((g, i) => {
          const a = ((i * 3.6 - 90) * Math.PI) / 180, r1 = 70, r2 = 92
          const dim = hover !== null && hover !== g
          return <line key={i} x1={100 + r1 * Math.cos(a)} y1={100 + r1 * Math.sin(a)} x2={100 + r2 * Math.cos(a)} y2={100 + r2 * Math.sin(a)}
            stroke={HOLD[g % HOLD.length]} strokeWidth="2.2" strokeLinecap="round" opacity={dim ? 0.2 : 1} style={{ transition: 'opacity .2s' }}
            onMouseEnter={() => setHover(g)} onMouseLeave={() => setHover(null)} />
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <Eyebrow>{hover !== null ? holdings[hover].name.replace('Demo ', '') : 'Portfolio'}</Eyebrow>
        <Money value={hover !== null ? holdings[hover].value : total} className="text-2xl font-medium" />
        <span className="num text-xs text-muted">{hover !== null ? pct(holdings[hover].allocation_pct, 0) : 'total value'}</span>
      </div>
    </div>
  )
}

const GROUPS: { key: string; label: string; icon: typeof Wallet; match: (a: Account) => boolean }[] = [
  { key: 'cash', label: 'Cash', icon: Banknote, match: (a) => a.type === 'checking' || a.type === 'savings' },
  { key: 'inv', label: 'Investments', icon: LineChart, match: (a) => a.type === 'investment' },
  { key: 'debt', label: 'Liabilities', icon: CreditCard, match: (a) => a.type === 'liability' },
]
const TYPE_LABEL = { checking: 'Checking', savings: 'Savings', investment: 'Investment', liability: 'Credit card' }

export default function Dashboard() {
  const { data, error, loading, retry } = useAsync(api.dashboard)
  const { profile } = useStore()
  const [done, toggleDone] = useDone()
  const [hover, setHover] = useState<number | null>(null)
  if (loading) return <Spinner label="Loading your overview…" />
  if (error || !data) return <ErrorBox title="Dashboard unavailable" message={friendlyError(error, 'the dashboard')} onRetry={retry} />
  const d: D = data
  const roadmap = buildRoadmap(profile?.goals ?? [])
  const firstOpen = roadmap.findIndex((s) => !done.includes(s.title))
  const { monthly_income: inc, monthly_expenses: exp, monthly_surplus: surplus } = d.cash_flow
  const surplusShare = (surplus / inc) * 100
  const debtShare = (d.total_liabilities / d.total_assets) * 100
  const gross = d.total_assets + d.total_liabilities
  const assetAccts = d.accounts.filter((a) => a.type !== 'liability')
  const maxAsset = Math.max(...assetAccts.map((a) => a.balance))
  const flow = [{ name: 'Income', value: inc, fill: C.forest }, { name: 'Expenses', value: exp, fill: C.coral }, { name: 'Surplus', value: surplus, fill: C.lime }]

  return (
    <div className="stagger">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Eyebrow className="mb-2">Welcome back, {profile?.name}</Eyebrow>
          <h1 className="text-5xl leading-[1.02] text-forest-900 sm:text-6xl">Your financial <em className="text-forest-600">overview</em></h1>
          <p className="mt-2 max-w-xl text-sm text-muted">A clear view of your accounts, cash flow and portfolio, with a few next moves.</p>
        </div>
        <div className="flex items-center gap-2"><DemoBadge /><span className="text-xs text-muted">Static snapshot · not synced to any bank</span></div>
      </header>

      {/* hero + KPI row */}
      <div className="grid gap-4 lg:grid-cols-12">
        <Card tone="dark" className="lg:col-span-5">
          <div className="flex items-start justify-between gap-3"><div className="text-sm text-ivory/80">Net worth</div><DemoBadge dark /></div>
          <div className="mt-2"><Money value={d.net_worth} className="text-6xl font-medium leading-none text-ivory sm:text-7xl" /></div>
          <div className="mt-1 text-xs text-ivory/65">Assets − liabilities</div>
          <SparklinePlaceholder />
          <div className="mt-5 border-t border-dashed border-ivory/25 pt-4">
            <div className="flex h-2 overflow-hidden rounded-full bg-ivory/15" role="img" aria-label={`Assets ${usd(d.total_assets)}, liabilities ${usd(d.total_liabilities)}`}>
              <div className="h-full rounded-full bg-lime-400" style={{ width: `${(d.total_assets / gross) * 100}%` }} /><div className="h-full bg-coral-500" style={{ width: `${(d.total_liabilities / gross) * 100}%` }} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
              <div><span className="flex items-center gap-2 text-ivory/70"><span className="h-2 w-2 rounded-full bg-lime-400" />Assets</span><Money value={d.total_assets} className="text-xl font-medium" /></div>
              <div><span className="flex items-center gap-2 text-ivory/70"><span className="h-2 w-2 rounded-full bg-coral-500" />Liabilities</span><Money value={d.total_liabilities} className="text-xl font-medium" /></div>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 sm:grid-cols-3 lg:col-span-7">
          <Card className="flex flex-col">
            <KpiHead icon={<Wallet size={15} />} label="Total assets" />
            <Money value={d.total_assets} className="mt-3 text-3xl font-medium" />
            <div className="mt-auto pt-4">
              <div className="flex h-12 items-end gap-1.5" role="img" aria-label={assetAccts.map((a) => `${a.name} ${usd(a.balance)}`).join(', ')}>
                {assetAccts.map((a, i) => <div key={a.id} title={`${a.name} ${usd(a.balance)}`} className="flex-1 rounded-t-md" style={{ height: `${Math.max(12, (a.balance / maxAsset) * 100)}%`, background: [C.sage, C.forest, C.lime][i] }} />)}
              </div>
              <p className="mt-2 text-2xs text-muted">{assetAccts.length} accounts · largest {usd(maxAsset)}</p>
            </div>
          </Card>
          <Card className="flex flex-col">
            <KpiHead icon={<CreditCard size={15} />} label="Liabilities" />
            <Money value={d.total_liabilities} className="mt-3 text-3xl font-medium" />
            <div className="mt-auto pt-4">
              <div className="h-2.5 overflow-hidden rounded-full bg-sand-100"><div className="h-full rounded-full bg-coral-500" style={{ width: `${Math.max(3, debtShare)}%` }} /></div>
              <p className="mt-2 text-2xs text-muted">{pct(debtShare, 0)} of total assets</p>
            </div>
          </Card>
          <Card className="flex flex-col">
            <KpiHead icon={<PiggyBank size={15} />} label="Monthly surplus" />
            <Money value={surplus} className="mt-3 text-3xl font-medium" />
            <div className="mt-auto space-y-1.5 pt-4" role="img" aria-label={`Income ${usd(inc)}, expenses ${usd(exp)}`}>
              <div className="h-2 overflow-hidden rounded-full bg-sand-100"><div className="h-full rounded-full bg-forest-900" style={{ width: '100%' }} /></div>
              <div className="h-2 overflow-hidden rounded-full bg-sand-100"><div className="h-full rounded-full bg-coral-500" style={{ width: `${(exp / inc) * 100}%` }} /></div>
              <p className="pt-0.5 text-2xs text-muted">{pct(surplusShare, 0)} of income saved</p>
            </div>
          </Card>
        </div>
      </div>

      {/* cash flow + accounts */}
      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <SectionHead title="Cash flow" sub="Monthly income, expenses and what is left" right={<DemoBadge />} />
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-lime-400 px-3.5 py-1.5 text-sm font-semibold text-forest-900"><ArrowUpRight size={15} />Surplus <Money value={surplus} className="font-semibold" /></span>
            <span className="text-sm text-muted">{pct(surplusShare, 0)} of monthly income</span>
          </div>
          <div className="h-60" role="img" aria-label={`Income ${usd(inc)}, expenses ${usd(exp)}, surplus ${usd(surplus)} per month`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={flow} barSize={64} margin={{ top: 26, right: 8 }}>
                <CartesianGrid vertical={false} stroke={C.grid} strokeDasharray="4 5" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ ...AXIS, fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `$${v / 1000}k`} tickLine={false} axisLine={false} width={40} tick={AXIS} />
                <Tooltip cursor={{ fill: 'rgb(200 234 84 / 0.14)', radius: 12 }} content={({ active, payload }) => active && payload?.length ? <TipBox title={String(payload[0].payload.name)} rows={[{ label: 'Per month', value: usd(Number(payload[0].value)), color: payload[0].payload.fill, strong: true }]} foot="Demo data" /> : null} />
                <Bar dataKey="value" radius={[14, 14, 4, 4]} animationDuration={700}>
                  {flow.map((f) => <Cell key={f.name} fill={f.fill} />)}
                  <LabelList dataKey="value" position="top" formatter={(v) => usd(Number(v))} style={{ fontSize: 12, fontWeight: 600, fill: '#14211e' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-3 border-t border-dashed border-sand-300 pt-4 text-sm">
            <div><div className="eyebrow">Income</div><div className="num mt-0.5 text-lg font-medium">{usd(inc)}</div></div>
            <div><div className="eyebrow">Expenses</div><div className="num mt-0.5 text-lg font-medium">{usd(exp)}</div></div>
            <div><div className="eyebrow">Savings rate</div><div className="num mt-0.5 text-lg font-medium">{pct(surplusShare, 0)}</div></div>
          </div>
          <p className="mt-3 text-2xs text-muted">One month of demo values, so no trend is drawn. History would appear here only if real data existed.</p>
        </Card>

        <Card className="lg:col-span-5">
          <SectionHead title="Accounts" sub="Grouped by what they do for you" />
          <ul aria-label="Accounts" className="space-y-5">
            {GROUPS.map((g) => {
              const rows = d.accounts.filter(g.match)
              if (!rows.length) return null
              const sub = rows.reduce((a, r) => a + r.balance, 0)
              return (
                <li key={g.key}>
                  <div className="mb-1 flex items-center justify-between"><span className="flex items-center gap-2 text-xs font-semibold text-forest-800"><g.icon size={14} />{g.label}</span><span className="num text-xs font-semibold text-muted">{g.key === 'debt' ? '−' : ''}{usd(sub)}</span></div>
                  <ul className="dashed-rows rounded-2xl border border-sand-200 bg-ivory/60 px-3.5">
                    {rows.map((a) => (
                      <li key={a.id} data-account className="flex items-center gap-3 py-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest-100 text-forest-800">{a.type === 'liability' ? <CreditCard size={16} /> : a.type === 'investment' ? <LineChart size={16} /> : a.type === 'savings' ? <PiggyBank size={16} /> : <Landmark size={16} />}</span>
                        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{a.name}</span><span className="flex items-center gap-1.5 text-2xs text-muted">{TYPE_LABEL[a.type]} · {a.source === 'demo' ? <DemoBadge /> : <Badge>Manual</Badge>}</span></span>
                        <span className={`num text-base font-medium ${a.type === 'liability' ? 'text-coral-600' : ''}`}>{a.type === 'liability' ? '−' : ''}{usd(a.balance)}</span>
                      </li>))}
                  </ul>
                </li>)
            })}
          </ul>
        </Card>
      </div>

      {/* portfolio */}
      <Card className="mt-4">
        <SectionHead title="Investment portfolio" sub={`${usd(d.portfolio.total)} across fictional ETFs · hover a row or the ring`} right={<DemoBadge />} />
        <div className="grid items-center gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4"><SegmentedRing holdings={d.portfolio.holdings} total={d.portfolio.total} hover={hover} setHover={setHover} /></div>
          <div className="overflow-x-auto lg:col-span-8">
            <div className="min-w-[520px]">
              <div className="eyebrow grid grid-cols-[1.6fr_1fr_1.6fr_1fr] gap-3 border-b border-dashed border-sand-300 pb-2"><span>Holding</span><span className="text-right">Value</span><span>Weight</span><span className="text-right">Expense ratio</span></div>
              <ul className="dashed-rows" aria-label="Holdings">
                {d.portfolio.holdings.map((h, i) => (
                  <li key={h.name} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
                    className={`grid grid-cols-[1.6fr_1fr_1.6fr_1fr] items-center gap-3 rounded-xl px-1 py-3.5 transition-colors ${hover === i ? 'bg-lime-50' : ''}`}>
                    <span className="flex min-w-0 items-center gap-2.5"><span className="h-3 w-3 shrink-0 rounded-md" style={{ background: HOLD[i % HOLD.length] }} /><span className="min-w-0"><span className="block truncate text-sm font-medium">{h.name}</span><span className="text-2xs text-muted">Fictional ETF</span></span></span>
                    <span className="num text-right text-sm font-medium">{usd(h.value)}</span>
                    <span className="flex items-center gap-2"><span className="h-2 flex-1 overflow-hidden rounded-full bg-sand-100"><span className="block h-full rounded-full transition-[width] duration-700" style={{ width: `${h.allocation_pct}%`, background: HOLD[i % HOLD.length] }} /></span><span className="num w-10 text-right text-sm font-semibold">{pct(h.allocation_pct, 0)}</span></span>
                    <span className="num text-right text-sm"><Tip text="Expense ratio is the yearly fee a fund charges, as a % of what you hold.">{pct(h.expense_ratio_pct)}</Tip></span>
                  </li>))}
              </ul>
            </div>
          </div>
        </div>
      </Card>

      {/* goals + roadmap */}
      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-5">
          <SectionHead title="Your goals" sub="From your onboarding choices" />
          {profile?.goals.length ? (
            <ul className="dashed-rows">{profile.goals.map((g) => (
              <li key={g} className="flex items-center justify-between gap-3 py-3 text-sm"><span className="flex items-center gap-2.5 font-medium"><span className="h-2 w-2 rounded-full bg-lime-500" />{goalLabel(g)}</span><Badge>No progress data</Badge></li>))}</ul>
          ) : <p className="text-sm text-muted">No goals selected yet. Add some in <Link to="/settings" className="font-semibold text-forest-800 underline-offset-2 hover:underline">Settings</Link>.</p>}
          <p className="mt-3 rounded-2xl border border-dashed border-sand-300 bg-ivory/60 p-3 text-2xs text-muted">Progress bars appear only when real balances exist for a goal. None are invented.</p>
        </Card>
        <Card className="lg:col-span-7">
          <SectionHead title="Your roadmap" sub="Rule-based steps from your goals" />
          <ol>{roadmap.map((s, i) => {
            const isDone = done.includes(s.title), current = i === firstOpen
            return (
              <li key={s.title} className="relative flex gap-4 pb-6 last:pb-0">
                {i < roadmap.length - 1 && <span aria-hidden className={`absolute left-[15px] top-9 h-[calc(100%-2rem)] border-l-2 border-dashed ${isDone ? 'border-forest-500' : 'border-sand-300'}`} />}
                <button onClick={() => toggleDone(s.title)} aria-pressed={isDone} aria-label={`${isDone ? 'Mark not done' : 'Mark done'}: ${s.title}`}
                  className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all active:scale-95 ${isDone ? 'border-forest-900 bg-forest-900 text-lime-400' : current ? 'border-lime-500 bg-lime-400 text-forest-900 shadow-sm' : 'border-sand-300 bg-card text-muted'}`}>{isDone ? <Check size={15} strokeWidth={3} /> : i + 1}</button>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><span className="eyebrow !text-lilac-600">{s.tag}</span><Badge tone={isDone ? 'demo' : current ? 'hypo' : 'neutral'}>{isDone ? 'Done' : current ? 'Current' : 'Up next'}</Badge></div>
                  <div className={`mt-0.5 font-semibold ${isDone ? 'text-muted line-through decoration-sand-300' : ''}`}>{s.title}</div>
                  <p className="text-sm text-muted">{s.text}</p>
                  <Link to={s.to} className="mt-1.5 inline-flex items-center gap-1 text-sm font-semibold text-forest-800 transition-colors hover:text-forest-950">{s.cta}<ArrowRight size={14} /></Link>
                </div>
              </li>)
          })}</ol>
        </Card>
      </div>

      <Card className="mt-4" tone="lime">
        <div className="flex flex-wrap items-center gap-4">
          <div className="min-w-0 flex-1"><Eyebrow className="!text-forest-800">Insights from your demo data</Eyebrow>
            <ul className="mt-2 space-y-1 text-base">
              <li>Your monthly surplus is <b className="num">{usd(surplus)}</b>, or {pct(surplusShare, 0)} of income.</li>
              <li>Investments make up {pct((d.portfolio.total / d.total_assets) * 100, 0)} of your assets (<span className="num">{usd(d.portfolio.total)}</span> of <span className="num">{usd(d.total_assets)}</span>).</li>
            </ul>
            <p className="mt-2 text-2xs text-forest-800/80">Simple ratios of the demo values above. Not advice.</p></div>
          <Link to="/twin"><Button size="lg">Explore in Financial Twin<ArrowRight size={16} /></Button></Link>
        </div>
      </Card>
    </div>
  )
}
