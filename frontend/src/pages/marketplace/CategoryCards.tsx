import { forwardRef } from 'react'
import { Search } from 'lucide-react'
import type { Category, Product } from '../../api'
import { CATS, TINT } from './categories'

/** Four category cards in one desktop row (2×2 on phones). Selecting one filters the grid in place; selecting it again clears it. */
export const CategoryCards = forwardRef<HTMLDivElement, { all: Product[]; category: Category | null; onSelect: (c: Category) => void }>(function CategoryCards({ all, category, onSelect }, ref) {
  return (
    <div ref={ref} className="grid grid-cols-2 gap-3 md:grid-cols-4" role="group" aria-label="Categories">
      {CATS.map((c) => {
        const on = category === c.id, n = all.filter((p) => p.category === c.id).length
        return (
          <button key={c.id} type="button" aria-pressed={on} onClick={() => onSelect(c.id)}
            className={`group flex min-h-[88px] items-center gap-3 rounded-[20px] border p-3.5 text-left shadow-xs transition-all duration-200 active:scale-[0.99] ${on ? `${TINT[c.id].band} border-transparent ring-2 ${TINT[c.id].ring}` : 'border-sand-200 bg-card hover:-translate-y-0.5 hover:border-forest-300 hover:shadow-md'}`}>
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${TINT[c.id].icon}`}><c.icon size={20} /></span>
            <span className="min-w-0"><span className="block font-semibold leading-tight">{c.label}</span><span className="mt-0.5 block text-xs text-muted">{n ? `${n} demo products` : c.blurb}</span></span>
          </button>)
      })}
    </div>
  )
})

/**
 * Sticky filter bar: appears under the top bar once the category cards scroll out of view.
 * Desktop: compact search + category pills. Phones: a horizontally scrolling pill row with a search icon.
 */
export function StickyFilterBar({ visible, q, setQ, category, onSelect, onClear }: { visible: boolean; q: string; setQ: (v: string) => void; category: Category | null; onSelect: (c: Category) => void; onClear: () => void }) {
  if (!visible) return null
  const pill = (on: boolean) => `inline-flex h-9 shrink-0 items-center rounded-full border px-3.5 text-sm font-semibold transition-colors ${on ? 'border-transparent bg-lime-400 text-forest-900' : 'border-sand-300 bg-card text-slate-700 hover:border-forest-300 hover:bg-forest-50'}`
  return (
    <div className="fade-in fixed inset-x-0 top-14 z-20 border-b border-sand-200 bg-ivory/90 backdrop-blur md:left-[72px]" role="region" aria-label="Filter bar">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-2.5 px-4 sm:px-6 lg:px-8">
        <button type="button" aria-label="Go to search" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => document.getElementById('mp-search')?.focus(), 350) }} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-sand-300 bg-card text-muted hover:text-forest-900 md:hidden"><Search size={16} /></button>
        <div className="relative hidden w-60 shrink-0 md:block">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" aria-label="Search products or providers (filter bar)" className="h-9 w-full rounded-full border border-sand-300 bg-card pl-8 pr-3 text-sm outline-none focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20" />
        </div>
        <div role="group" aria-label="Category filter" className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto py-1">
          <button type="button" aria-pressed={!category} onClick={onClear} className={pill(!category)}>All</button>
          {CATS.map((c) => <button key={c.id} type="button" aria-pressed={category === c.id} onClick={() => onSelect(c.id)} className={pill(category === c.id)}><c.icon size={14} className="mr-1.5" />{c.label}</button>)}
        </div>
      </div>
    </div>
  )
}
