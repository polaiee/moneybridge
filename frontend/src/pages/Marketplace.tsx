import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Banknote, CreditCard, LineChart, PiggyBank, Search, Sparkles, X } from 'lucide-react'
import { api, type Category, type Comparison, type Product } from '../api'
import { Badge, Button, EmptyState, ErrorBox, Eyebrow, PageHeader, Skeleton } from '../components/ui'
import { friendlyError } from '../lib/errors'
import { useStore } from '../store'

const CATS: { id: Category; label: string; icon: typeof Banknote; blurb: string }[] = [
  { id: 'banking', label: 'Banking', icon: Banknote, blurb: 'Everyday checking accounts' },
  { id: 'savings', label: 'Savings', icon: PiggyBank, blurb: 'Build a financial buffer' },
  { id: 'credit', label: 'Credit', icon: CreditCard, blurb: 'Cards and credit building' },
  { id: 'investing', label: 'Investing', icon: LineChart, blurb: 'Index and guided accounts' },
]
const GOAL_COPY: Record<string, { title: string; text: string }> = {
  emergency_savings: { title: 'Emergency fund', text: 'Discover savings options for your financial buffer.' },
  budgeting: { title: 'Everyday money', text: 'Explore banking options for daily spending.' },
  credit_building: { title: 'Credit building', text: 'See card terms side by side.' },
  investing: { title: 'Investing', text: 'Explore low-minimum investing accounts.' },
  learning_etfs: { title: 'Learning about ETFs', text: 'Compare expense ratios and platform fees.' },
  retirement: { title: 'Long-term saving', text: 'Explore investing accounts for long horizons.' },
}
const LABELS: Record<string, string> = {
  monthly_fee: 'Monthly fee', opening_deposit: 'Opening deposit', minimum_balance: 'Minimum balance', waiver: 'Fee waiver',
  apy_pct: 'Variable APY', minimum_to_earn: 'Minimum to earn APY', withdrawal_limits: 'Withdrawal limits',
  apr_pct: 'Variable purchase APR', annual_fee: 'Annual fee', security_deposit: 'Security deposit', restrictions: 'Restrictions',
  min_investment: 'Account minimum', account_fee: 'Platform fee', etf_expense_ratio_pct: 'ETF expense ratio', services: 'Services',
}
const MONEY = new Set(['monthly_fee', 'opening_deposit', 'minimum_balance', 'minimum_to_earn', 'annual_fee', 'security_deposit', 'min_investment'])
function fmt(k: string, v: unknown): string {
  if (v === undefined || v === null || v === '') return 'Not provided'
  if (typeof v === 'number') {
    if (k.endsWith('_pct')) return `${v.toFixed(2)}%${k === 'etf_expense_ratio_pct' ? '/yr' : ''}`
    if (MONEY.has(k)) return `$${v.toLocaleString('en-US')}`
    if (k === 'account_fee') return v === 0 ? '$0' : `${v}% (as listed)`
  }
  return String(v)
}
const FIELDS: Record<Category, string[]> = {
  banking: ['monthly_fee', 'opening_deposit', 'minimum_balance', 'waiver'], savings: ['apy_pct', 'monthly_fee', 'minimum_to_earn', 'withdrawal_limits'],
  credit: ['apr_pct', 'annual_fee', 'security_deposit', 'restrictions'], investing: ['min_investment', 'account_fee', 'etf_expense_ratio_pct', 'services'],
}
const EDU: Record<Category, { desc: string; features: string; reqs: string; risks: string }> = {
  banking: { desc: 'An illustrative everyday account for deposits and spending.', features: 'Terms shown are fictional and vary by product. Check fees, waivers and balance rules.', reqs: 'Eligibility and identity requirements are not specified in this demo.', risks: 'Fees can apply if waiver or balance conditions are not met. Not a verified offer.' },
  savings: { desc: 'An illustrative savings account to explore as you build a financial buffer.', features: 'A displayed variable APY may require a minimum balance. Rates can change.', reqs: 'Eligibility and identity requirements are not specified in this demo.', risks: 'Variable rates can fall. Withdrawal limits may apply. No deposit insurance has been verified.' },
  credit: { desc: 'An illustrative credit card to explore how APR, fees and deposits compare.', features: 'APR is variable and fictional. A security deposit may be refundable under account terms.', reqs: 'Approval is never guaranteed. Enrollment or deposit rules may apply.', risks: 'Carrying a balance costs interest at the APR. Late payments can hurt credit history.' },
  investing: { desc: 'An illustrative investing account for exploring fees and ETF access.', features: 'Fictional ETFs only. Expense ratios are annual fund costs.', reqs: 'Eligibility is not specified in this demo.', risks: 'No returns are promised. Capital is at risk and you can lose money.' },
}

function ProductCard({ p, selected, onDetails, onCompare }: { p: Product; selected: boolean; onDetails: () => void; onCompare: () => void }) {
  const Icon = CATS.find((c) => c.id === p.category)!.icon
  const [head, ...rest] = FIELDS[p.category]
  return (
    <article className={`group flex flex-col rounded-xl border bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${selected ? 'border-blue-400 ring-1 ring-blue-400' : 'border-line hover:border-slate-300'}`} aria-label={p.name}>
      <div className="flex items-center justify-between text-xs"><span className="flex items-center gap-1.5 font-semibold text-blue-700"><span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50"><Icon size={13} /></span>{CATS.find((c) => c.id === p.category)!.label}</span><Badge tone="demo">Demo Product</Badge></div>
      <h3 className="mt-3 text-base font-semibold">{p.name}</h3><p className="text-sm text-muted">{p.provider}</p>
      <div className="num mt-3 text-3xl font-semibold">{fmt(head, p[head])}</div><Eyebrow className="mt-0.5">{LABELS[head]}</Eyebrow>
      <dl className="mt-3 space-y-1.5 border-t border-line pt-3 text-xs">{rest.slice(0, 2).map((k) => <div key={k} className="flex justify-between gap-3"><dt className="text-muted">{LABELS[k]}</dt><dd className="text-right font-medium">{fmt(k, p[k])}</dd></div>)}</dl>
      <div className="mt-auto flex gap-2 pt-4">
        <Button onClick={onDetails} className="flex-1">View Details</Button>
        <Button variant={selected ? 'primary' : 'secondary'} aria-pressed={selected} onClick={onCompare}>{selected ? '✓ Compare' : 'Compare'}</Button>
      </div>
    </article>
  )
}

export default function Marketplace() {
  const [params, setParams] = useSearchParams()
  const category = (params.get('category') as Category | null) || null
  const { profile, setCompareContext, setPendingAsk } = useStore()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')
  const [all, setAll] = useState<Product[]>([])
  const [list, setList] = useState<Product[] | null>(null)
  const [disclaimer, setDisclaimer] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [recs, setRecs] = useState<{ goal: string; category: Category }[]>([])
  const [open, setOpen] = useState<Product | null>(null)
  const [sel, setSel] = useState<string[]>([])
  const [notice, setNotice] = useState<string | null>(null)
  const [cmp, setCmp] = useState<Comparison | null>(null)
  const [cmpErr, setCmpErr] = useState<string | null>(null)
  const cmpRef = useRef<HTMLDivElement>(null)

  useEffect(() => { const t = setTimeout(() => setDebounced(q.trim()), 250); return () => clearTimeout(t) }, [q])
  useEffect(() => { api.products().then((r) => setAll(r.products)).catch((e: Error) => setErr(e.message)) }, [])
  useEffect(() => {
    api.products(category ?? undefined, debounced || undefined).then((r) => { setList(r.products); setDisclaimer(r.disclaimer); setErr(null) }).catch((e: Error) => setErr(e.message))
  }, [category, debounced])
  useEffect(() => { if (profile?.goals.length) api.recommendations(profile.goals).then((r) => setRecs(r.recommendations)).catch(() => setRecs([])) }, [profile])
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, [open])

  const byId = (id: string) => all.find((p) => p.id === id)
  const setCategory = (c: Category | null) => { const n = new URLSearchParams(params); if (c && c !== category) n.set('category', c); else n.delete('category'); setParams(n) }

  const toggleCompare = (p: Product) => {
    setCmp(null); setCmpErr(null); setNotice(null)
    if (sel.includes(p.id)) return setSel(sel.filter((x) => x !== p.id))
    const first = byId(sel[0])
    if (first && first.category !== p.category) { setSel([p.id]); return setNotice(`You can only compare products in the same category, so your ${first.category} selection was replaced.`) }
    if (sel.length >= 2) return setNotice('Two products are already selected. Remove or replace one first.')
    setSel([...sel, p.id])
  }
  const doCompare = async () => {
    setCmpErr(null)
    try { const c = await api.compare(sel[0], sel[1]); setCmp(c); setCompareContext({ a: sel[0], b: sel[1], label: `${c.products[0].name} vs ${c.products[1].name}` }); setTimeout(() => cmpRef.current?.scrollIntoView({ behavior: 'smooth' }), 50) }
    catch (e) { setCmpErr((e as Error).message) }
  }
  const remove = (id: string) => { setSel(sel.filter((x) => x !== id)); setCmp(null) }
  const explain = () => {
    if (!cmp) return
    setPendingAsk({ message: `Explain the trade-offs between ${cmp.products[0].name} and ${cmp.products[1].name} in plain language, using only the comparison data provided.`, compare: true })
    nav('/companion')
  }
  const selProducts = sel.map(byId).filter(Boolean) as Product[]
  const selCat = selProducts[0]?.category

  return (
    <div className={sel.length ? 'pb-24' : ''}>
      <PageHeader eyebrow="Your next financial connection" title="Financial Marketplace" sub="Discover and compare financial products that support your goals." />
      <label className="block"><span className="eyebrow mb-1.5 block">Search</span>
        <div className="flex h-11 items-center gap-2 rounded-lg border border-line bg-white px-3.5 shadow-xs transition-shadow hover:border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/25"><Search size={16} className="text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products or providers…" className="h-full w-full bg-transparent text-sm outline-none" /></div></label>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4" role="group" aria-label="Categories">
        {CATS.map((c) => (
          <button key={c.id} aria-pressed={category === c.id} onClick={() => setCategory(c.id)}
            className={`flex items-center gap-3 rounded-xl border p-3.5 text-left shadow-xs transition-all active:scale-[0.99] ${category === c.id ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-line bg-white hover:border-slate-300 hover:shadow-sm'}`}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700"><c.icon size={18} /></span>
            <span><span className="block font-semibold">{c.label}</span><span className="block text-xs text-muted">{all.filter((p) => p.category === c.id).length} demo products</span></span>
          </button>))}
      </div>
      {category && <button onClick={() => setCategory(null)} className="mt-2 text-sm font-semibold text-brand-dark">Clear category filter ✕</button>}

      {recs.length > 0 && (
        <section className="mt-8" aria-label="Relevant to Your Goals">
          <h2 className="text-xl font-semibold">Relevant to Your Goals</h2><p className="mb-3 text-sm text-muted">Based on the goals you chose. A starting point, not a recommendation.</p>
          <div className="grid gap-4 md:grid-cols-2">{recs.map((r) => {
            const c = CATS.find((x) => x.id === r.category)!; const copy = GOAL_COPY[r.goal]
            return <button key={r.goal} onClick={() => setCategory(r.category)} className="flex items-start gap-3 rounded-xl border border-line bg-white p-4 text-left shadow-xs transition-all hover:border-teal-300 hover:shadow-sm active:scale-[0.99]">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-800"><c.icon size={18} /></span>
              <span><span className="block font-semibold">{copy.title}</span><span className="block text-sm text-muted">{copy.text}</span><span className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-brand">Explore Products <ArrowRight size={14} /></span></span></button>
          })}</div>
        </section>)}

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Explore Financial Products</h2><p className="mb-4 text-sm text-muted">Understand the details. Make your own connections.</p>
        {err && <ErrorBox title="Marketplace unavailable" message={friendlyError(err, 'products')} onRetry={() => { setErr(null); setCategory(category) }} />}
        {!list && !err && <div role="status" aria-label="Loading products" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="rounded-xl border border-line bg-white p-4"><Skeleton className="h-3 w-20" /><Skeleton className="mt-4 h-5 w-40" /><Skeleton className="mt-4 h-8 w-24" /><Skeleton className="mt-4 h-9 w-full" /></div>)}</div>}
        {notice && <div role="status" className="mb-3 rounded-xl bg-brand-soft p-3 text-sm text-brand-dark">{notice}</div>}
        {list && list.length === 0 && <EmptyState icon={<Search size={18} />} title="No products match" text={`Nothing matches your search${category ? ` in ${category}` : ''}. Try a different term or clear the filter.`} action={<Button variant="secondary" onClick={() => { setQ(''); setCategory(null) }}>Clear search and filters</Button>} />}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{list?.map((p) => <ProductCard key={p.id} p={p} selected={sel.includes(p.id)} onDetails={() => setOpen(p)} onCompare={() => toggleCompare(p)} />)}</div>
        <p className="mt-4 text-xs text-muted">{disclaimer} All providers are fictional.</p>
      </section>

      {cmp && (
        <section ref={cmpRef} className="mt-10" aria-label="Comparison">
          <h2 className="text-xl font-semibold">A clearer view, side by side.</h2><p className="mb-3 text-sm text-muted">Comparing two {cmp.category} products</p>
          <div className="overflow-x-auto rounded-xl border border-line bg-white shadow-sm">
            <table className="w-full min-w-[560px] text-sm">
              <thead><tr className="bg-gradient-to-b from-blue-50 to-white align-top"><th className="eyebrow w-1/3 p-4 text-left">Compare products</th>
                {cmp.products.map((p) => <th key={p.id} className="p-4 text-left"><Badge tone="demo">Demo Product</Badge><div className="mt-1 text-lg font-semibold">{p.name}</div><div className="text-xs font-normal text-muted">{p.provider}</div>
                  <div className="mt-1 flex gap-3 text-xs"><button onClick={() => remove(p.id)} className="font-semibold text-brand-dark">Remove ✕</button><button onClick={() => { remove(p.id); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="font-semibold text-brand-dark">Replace ⇄</button></div></th>)}</tr></thead>
              <tbody>{cmp.fields.map((f) => <tr key={f} className="border-t border-line transition-colors hover:bg-slate-50"><th scope="row" className="p-4 text-left font-normal text-muted">{LABELS[f]}</th>{cmp.products.map((p) => <td key={p.id} className="num p-4 text-base font-medium">{fmt(f, p[f])}</td>)}</tr>)}</tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted">Check the conditions, not just the rate. Illustrative, not a recommendation. Missing information is marked “Not provided”.</p>
          <Button className="mt-4" onClick={explain}><Sparkles size={16} />Explain with MoneyBridge AI</Button>
        </section>)}

      {sel.length > 0 && (
        <div className="fade-in fixed inset-x-0 bottom-16 z-30 border-t border-line bg-white/95 px-4 py-3 shadow-pop backdrop-blur md:bottom-0 md:left-[72px]" role="region" aria-label="Comparison bar">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3">
            <div className="flex-1 text-sm"><b>{sel.length} of 2 selected</b> · {selCat} {selProducts.map((p) => <span key={p.id} className="ml-2 inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-xs">{p.name}<button aria-label={`Remove ${p.name}`} onClick={() => remove(p.id)}><X size={12} /></button></span>)}</div>
            {cmpErr && <span className="text-xs text-danger">{cmpErr}</span>}
            <Button disabled={sel.length !== 2} onClick={doCompare}>Compare</Button>
          </div>
        </div>)}

      {open && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={`${open.name} details`}>
          <div className="fade-in absolute inset-0 bg-slate-900/40" onClick={() => setOpen(null)} />
          <aside className="drawer-enter absolute inset-y-0 right-0 flex w-full flex-col overflow-y-auto bg-white p-6 shadow-pop sm:w-[440px]">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted">Product details<button onClick={() => setOpen(null)} className="flex items-center gap-1 normal-case">Close <X size={16} /></button></div>
            <div className="mt-5 flex items-center justify-between text-xs"><span className="capitalize text-brand-dark">{open.category}</span><Badge tone="demo">Demo Product</Badge></div>
            <h2 className="mt-1 text-2xl font-semibold">{open.name}</h2><p className="text-sm text-muted">{open.provider}</p><p className="mt-2 text-sm">{EDU[open.category].desc}</p>
            <dl className="mt-4 divide-y divide-blue-100 rounded-xl bg-blue-50 px-4 text-sm">{FIELDS[open.category].map((k) => <div key={k} className="flex justify-between gap-3 py-2.5"><dt className="text-muted">{LABELS[k]}</dt><dd className="num text-right font-semibold">{fmt(k, open[k])}</dd></div>)}</dl>
            <h3 className="mt-5 text-sm font-semibold">Key features</h3><p className="text-sm text-muted">{EDU[open.category].features}</p>
            <h3 className="mt-4 text-sm font-semibold">Requirements</h3><p className="text-sm text-muted">{EDU[open.category].reqs}</p>
            <h3 className="mt-4 text-sm font-semibold">Risks and limitations</h3><p className="text-sm text-muted">{EDU[open.category].risks}</p>
            <p className="mt-4 text-xs text-muted">Illustrative demo product. Provider, rates and fees are fictional and not verified offers or financial advice.</p>
            <Button className="mt-auto" variant={sel.includes(open.id) ? 'secondary' : 'primary'} onClick={() => toggleCompare(open)}>{sel.includes(open.id) ? '✓ Added to Compare (click to remove)' : 'Add to Compare'}</Button>
            <p className="mt-2 text-center text-xs text-muted">{sel.length} of 2 products selected</p>
          </aside>
        </div>)}
    </div>
  )
}
