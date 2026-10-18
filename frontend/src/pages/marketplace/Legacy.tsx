// TEMPORARY (Pass 1): the details drawer, comparison bar, comparison view and the Explain button keep their previous
// layout and are rewritten in Pass 2 (details drawer, compare tray, versus panel, Explain card). Behavior is unchanged.
import type { RefObject } from 'react'
import { Sparkles, X } from 'lucide-react'
import type { Comparison, Product } from '../../api'
import { Badge, Button } from '../../components/ui'
import { EDU, FIELDS, LABELS, fmt } from '../../lib/products'

export default function Legacy({ cmp, cmpRef, remove, explain, sel, selProducts, selCat, doCompare, cmpErr, open, setOpen, toggleCompare }: {
  cmp: Comparison | null; cmpRef: RefObject<HTMLDivElement | null>; remove: (id: string) => void; explain: () => void
  sel: string[]; selProducts: Product[]; selCat?: string; doCompare: () => void; cmpErr: string | null
  open: Product | null; setOpen: (p: Product | null) => void; toggleCompare: (p: Product) => void
}) {
  return (
    <>
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
          <Button variant="ai" size="lg" className="mt-4" onClick={explain}><Sparkles size={16} />Explain with MoneyBridge AI</Button>
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
    </>
  )
}
