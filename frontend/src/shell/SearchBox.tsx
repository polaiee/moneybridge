import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { api } from '../api'
import { NAV, SETTINGS } from './nav'

interface Hit { id: string; group: string; label: string; sub: string; to: string }
const PAGES: Hit[] = [...NAV, SETTINGS].map((n) => ({ id: `p-${n.to}`, group: 'Pages', label: n.full, sub: 'Go to page', to: n.to }))

/** Minimal client-side jump-to search over pages, demo accounts, holdings and demo products. Reuses existing endpoints, lazily. */
export default function SearchBox() {
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [active, setActive] = useState(0)
  const [data, setData] = useState<Hit[]>([])
  const loaded = useRef(false)
  const input = useRef<HTMLInputElement>(null)
  const box = useRef<HTMLDivElement>(null)

  const load = () => {
    if (loaded.current) return
    loaded.current = true
    Promise.all([api.dashboard(), api.products()]).then(([d, p]) => setData([
      ...d.accounts.map((a): Hit => ({ id: `a-${a.id}`, group: 'Accounts', label: a.name, sub: 'Demo account', to: '/dashboard' })),
      ...d.portfolio.holdings.map((h): Hit => ({ id: `h-${h.name}`, group: 'Holdings', label: h.name, sub: 'Fictional ETF', to: '/dashboard' })),
      ...p.products.map((x): Hit => ({ id: `m-${x.id}`, group: 'Products', label: x.name, sub: `${x.provider} · ${x.category} · Demo product`, to: `/marketplace?category=${x.category}` })),
    ])).catch(() => { loaded.current = false })
  }

  const hits = useMemo(() => {
    const t = q.trim().toLowerCase()
    const all = [...PAGES, ...data]
    return (t ? all.filter((h) => `${h.label} ${h.sub}`.toLowerCase().includes(t)) : PAGES).slice(0, 8)
  }, [q, data])

  useEffect(() => { setActive(0) }, [q])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(t.tagName) && !t.isContentEditable) {
        e.preventDefault(); if (window.innerWidth < 768) setMobile(true); setTimeout(() => input.current?.focus(), 0)
      }
    }
    const onDown = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) { setOpen(false); setMobile(false) } }
    window.addEventListener('keydown', onKey); window.addEventListener('mousedown', onDown)
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('mousedown', onDown) }
  }, [])

  const go = (h: Hit) => { nav(h.to); setQ(''); setOpen(false); setMobile(false); input.current?.blur() }
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(hits.length - 1, a + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)) }
    else if (e.key === 'Enter' && hits[active]) { e.preventDefault(); go(hits[active]) }
    else if (e.key === 'Escape') { setOpen(false); setMobile(false); input.current?.blur() }
  }
  let lastGroup = ''
  return (
    <>
      <button type="button" aria-label="Search" onClick={() => { setMobile(true); setTimeout(() => input.current?.focus(), 0) }} className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-forest-100 md:hidden"><Search size={18} /></button>
      <div ref={box} className={mobile ? 'fixed inset-x-0 top-0 z-50 flex h-14 items-center bg-ivory px-3' : 'relative hidden min-w-0 flex-1 md:block md:max-w-[480px]'}>
        <div className="relative w-full">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input ref={input} value={q} onChange={(e) => { setQ(e.target.value); setOpen(true) }} onFocus={() => { load(); setOpen(true) }} onKeyDown={onKeyDown}
            role="combobox" aria-expanded={open} aria-controls="search-results" aria-activedescendant={open && hits[active] ? `sr-${hits[active].id}` : undefined} aria-label="Search pages, accounts and products" autoComplete="off"
            placeholder="Search pages, accounts, products…" className="h-10 w-full rounded-full border border-sand-300 bg-card pl-10 pr-12 text-sm outline-none transition-shadow placeholder:text-muted hover:border-forest-300 focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20" />
          {mobile ? <button type="button" aria-label="Close search" onClick={() => setMobile(false)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 hover:bg-forest-100"><X size={16} /></button>
            : <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-sand-300 bg-ivory px-1.5 text-2xs font-semibold text-muted">/</kbd>}
        </div>
        {open && (
          <ul id="search-results" role="listbox" aria-label="Search results" className="fade-in absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-[60vh] overflow-y-auto rounded-2xl border border-sand-200 bg-card p-1.5 shadow-pop">
            {hits.length === 0 && <li className="px-3 py-4 text-sm text-muted">No matches for “{q}”.</li>}
            {hits.map((h, i) => {
              const head = h.group !== lastGroup ? h.group : null; lastGroup = h.group
              return (
                <li key={h.id} role="presentation">
                  {head && <div className="eyebrow px-3 pb-1 pt-2">{head}</div>}
                  <div id={`sr-${h.id}`} role="option" aria-selected={i === active} onMouseEnter={() => setActive(i)} onMouseDown={(e) => { e.preventDefault(); go(h) }}
                    className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm ${i === active ? 'bg-lime-100' : ''}`}>
                    <span className="truncate font-medium">{h.label}</span><span className="truncate text-2xs text-muted">{h.sub}</span>
                  </div>
                </li>)
            })}
          </ul>)}
      </div>
    </>
  )
}
