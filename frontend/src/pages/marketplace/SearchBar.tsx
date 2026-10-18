import { Search, X } from 'lucide-react'
import type { Category } from '../../api'
import { catOf } from './categories'

/** 56px search plus the result strip with removable filter chips. Filtering is server-side (q / category), debounced by the page. */
export default function SearchBar({ q, setQ, query, category, shown, total, loading, onClearCategory, onClearAll }: {
  q: string; setQ: (v: string) => void; query: string; category: Category | null; shown: number; total: number; loading: boolean
  onClearCategory: () => void; onClearAll: () => void
}) {
  const active = !!category || !!query
  return (
    <div>
      <div className="flex h-14 items-center gap-3 rounded-full border border-sand-300 bg-card px-5 shadow-xs transition-shadow hover:border-forest-300 focus-within:border-forest-600 focus-within:ring-2 focus-within:ring-forest-600/20">
        <Search size={18} className="shrink-0 text-muted" aria-hidden />
        <input id="mp-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products or providers…" aria-label="Search products or providers" autoComplete="off" className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted" />
        {q && <button type="button" aria-label="Clear search" onClick={() => setQ('')} className="rounded-full p-1.5 text-muted transition-colors hover:bg-forest-100 hover:text-forest-900"><X size={16} /></button>}
      </div>
      <div className="mt-2.5 flex min-h-[28px] flex-wrap items-center gap-x-3 gap-y-1.5 px-1 text-xs" aria-label="Active filters">
        <span role="status" aria-live="polite" className="text-muted">{loading ? 'Loading products…' : active ? <>Showing <b className="num text-ink">{shown}</b> of <b className="num text-ink">{total}</b> demo products</> : <>Showing all <b className="num text-ink">{total || shown}</b> demo products</>}</span>
        {category && <button type="button" aria-label={`Remove ${catOf(category).label} filter`} onClick={onClearCategory} className="inline-flex items-center gap-1 rounded-full border border-forest-300 bg-forest-50 px-2.5 py-0.5 font-semibold text-forest-900 transition-colors hover:bg-forest-100">{catOf(category).label}<X size={12} /></button>}
        {query && <button type="button" aria-label={`Clear search “${query}”`} onClick={() => setQ('')} className="inline-flex items-center gap-1 rounded-full border border-forest-300 bg-forest-50 px-2.5 py-0.5 font-semibold text-forest-900 transition-colors hover:bg-forest-100">“{query}”<X size={12} /></button>}
        {active && <button type="button" onClick={onClearAll} className="font-semibold text-forest-800 underline-offset-2 hover:underline">Clear all</button>}
      </div>
    </div>
  )
}
