import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Search } from 'lucide-react'
import { api, type Category, type Comparison, type Product } from '../api'
import { Button, EmptyState, ErrorBox, Skeleton } from '../components/ui'
import { friendlyError } from '../lib/errors'
import { useStore } from '../store'
import { CategoryCards, StickyFilterBar } from './marketplace/CategoryCards'
import { GoalCards, GoalsStrip } from './marketplace/GoalCards'
import Header from './marketplace/Header'
import Legacy from './marketplace/Legacy'
import ProductCard from './marketplace/ProductCard'
import SearchBar from './marketplace/SearchBar'

/**
 * Discovery and comparison. Same state and API calls as before (products ×2, recommendations, compare); the compare rules
 * (same category only, two different products) and the Companion hand-off are unchanged.
 */
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
  const [recsLoaded, setRecsLoaded] = useState(false)
  const [open, setOpen] = useState<Product | null>(null)
  const [sel, setSel] = useState<string[]>([])
  const [notice, setNotice] = useState<string | null>(null)
  const [cmp, setCmp] = useState<Comparison | null>(null)
  const [cmpErr, setCmpErr] = useState<string | null>(null)
  const [stuck, setStuck] = useState(false)
  const cmpRef = useRef<HTMLDivElement>(null)
  const catRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLElement>(null)
  const wantScroll = useRef(false) // bring the results into view once the next list has loaded (filters used from the sticky bar / goal cards)

  useEffect(() => { const t = setTimeout(() => setDebounced(q.trim()), 250); return () => clearTimeout(t) }, [q])
  useEffect(() => { api.products().then((r) => setAll(r.products)).catch((e: Error) => setErr(e.message)) }, [])
  useEffect(() => {
    api.products(category ?? undefined, debounced || undefined).then((r) => {
      setList(r.products); setDisclaimer(r.disclaimer); setErr(null)
      if (wantScroll.current) { wantScroll.current = false; requestAnimationFrame(() => requestAnimationFrame(() => gridRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' }))) }
    }).catch((e: Error) => setErr(e.message))
  }, [category, debounced])
  useEffect(() => {
    if (!profile?.goals.length) { setRecs([]); setRecsLoaded(true); return }
    api.recommendations(profile.goals).then((r) => setRecs(r.recommendations)).catch(() => setRecs([])).finally(() => setRecsLoaded(true))
  }, [profile])
  useEffect(() => { if (!open) return; const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(null); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, [open])

  // Sticky filter bar: shown once the category cards have scrolled out of view above the viewport.
  useEffect(() => {
    const el = catRef.current; if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting && e.boundingClientRect.top < 0), { rootMargin: '-56px 0px 0px 0px' })
    io.observe(el); return () => io.disconnect()
  }, [])

  const byId = (id: string) => all.find((p) => p.id === id)
  const setCategory = (c: Category | null) => { const n = new URLSearchParams(params); if (c && c !== category) n.set('category', c); else n.delete('category'); setParams(n, { preventScrollReset: true }) }
  const pickGoalCategory = (c: Category) => { const n = new URLSearchParams(params); n.set('category', c); if (c !== category) wantScroll.current = true; setParams(n, { preventScrollReset: true }) }
  const fromBar = (fn: () => void) => { wantScroll.current = true; fn() }
  const clearAll = () => { setQ(''); setDebounced(''); const n = new URLSearchParams(params); n.delete('category'); setParams(n, { preventScrollReset: true }) }

  // Compare rules (unchanged): same category only; two different products; a product from another category replaces the selection.
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

  return (
    <div className={sel.length ? 'pb-24' : ''}>
      <Header total={all.length} selected={sel.length} />
      <SearchBar q={q} setQ={setQ} query={debounced} category={category} shown={list?.length ?? 0} total={all.length} loading={!list && !err}
        onClearCategory={() => setCategory(null)} onClearAll={clearAll} />
      <div className="mt-4"><CategoryCards ref={catRef} all={all} category={category} onSelect={setCategory} /></div>
      <StickyFilterBar visible={stuck} q={q} setQ={(v) => fromBar(() => setQ(v))} category={category} onSelect={(c) => fromBar(() => setCategory(c))} onClear={() => fromBar(() => setCategory(null))} />

      {recsLoaded && (profile?.goals.length ? <GoalCards recs={recs} onPick={pickGoalCategory} /> : <GoalsStrip />)}

      <section ref={gridRef} className="mt-8 scroll-mt-32" aria-label="Products">
        <h2 className="text-xl font-semibold">Explore Financial Products</h2><p className="mb-4 text-sm text-muted">Understand the details. Make your own connections.</p>
        {err && <ErrorBox title="Marketplace unavailable" message={friendlyError(err, 'products')} onRetry={() => { setErr(null); setCategory(category) }} />}
        {!list && !err && <div role="status" aria-label="Loading products" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="overflow-hidden rounded-[20px] border border-sand-200 bg-card"><Skeleton className="h-11 w-full !rounded-none" /><div className="p-4"><Skeleton className="h-5 w-40" /><Skeleton className="mt-4 h-9 w-28" /><Skeleton className="mt-4 h-16 w-full" /><Skeleton className="mt-4 h-10 w-full" /></div></div>)}</div>}
        {notice && <div role="status" className="fade-in mb-3 rounded-2xl border border-forest-300 bg-forest-50 p-3 text-sm text-forest-900">{notice}</div>}
        {list && list.length === 0 && <EmptyState icon={<Search size={18} />} title="No products match" text={`Nothing matches your search${category ? ` in ${category}` : ''}. Try a different term or clear the filter.`} action={<Button variant="secondary" onClick={clearAll}>Clear search and filters</Button>} />}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{list?.map((p) => <ProductCard key={p.id} p={p} selected={sel.includes(p.id)} onDetails={() => setOpen(p)} onCompare={() => toggleCompare(p)} />)}</div>
        <p className="mt-4 text-xs text-muted">{disclaimer} All providers are fictional.</p>
      </section>

      <Legacy cmp={cmp} cmpRef={cmpRef} remove={remove} explain={explain} sel={sel} selProducts={selProducts} selCat={selProducts[0]?.category} doCompare={doCompare} cmpErr={cmpErr} open={open} setOpen={setOpen} toggleCompare={toggleCompare} />
    </div>
  )
}
