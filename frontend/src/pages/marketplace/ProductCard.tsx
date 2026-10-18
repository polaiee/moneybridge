import { Check } from 'lucide-react'
import type { Product } from '../../api'
import { Badge, Button, Eyebrow } from '../../components/ui'
import { KEY_FIELD, LABELS, cardRows, fmt, leadValue } from '../../lib/products'
import { catOf, TINT } from './categories'

/** A spec-sheet card: category band + Demo Product badge, headline metric, two attributes, the key requirement, actions. */
export default function ProductCard({ p, selected, onDetails, onCompare }: { p: Product; selected: boolean; onDetails: () => void; onCompare: () => void }) {
  const cat = catOf(p.category), t = TINT[p.category], lead = leadValue(p), key = KEY_FIELD[p.category]
  return (
    <article aria-label={p.name} data-category={p.category}
      className={`group relative flex flex-col overflow-hidden rounded-[20px] border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${selected ? `border-transparent ring-2 ${t.ring}` : 'border-sand-200 hover:border-forest-300'}`}>
      <div className={`flex items-center justify-between gap-2 px-4 py-2.5 ${t.band}`}>
        <span className="flex items-center gap-2 text-xs font-semibold text-forest-900"><span className={`flex h-7 w-7 items-center justify-center rounded-xl ${t.icon}`}><cat.icon size={15} /></span>{cat.label}</span>
        <Badge tone="demo">Demo Product</Badge>
      </div>
      {selected && <span aria-hidden className="pop-in absolute right-3 top-14 flex h-6 w-6 items-center justify-center rounded-full bg-forest-900 text-lime-400 shadow-sm"><Check size={14} strokeWidth={3} /></span>}

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-lg font-semibold leading-snug">{p.name}</h3>
        <p className="text-sm text-muted">{p.provider}</p>
        <div className="num mt-4 text-[34px] font-medium leading-none">{lead.text}</div>
        <Eyebrow className="mt-1.5">{LABELS[lead.field]}</Eyebrow>
        <dl className="dashed-rows mt-4 text-sm">
          {cardRows(p.category).map((k) => <div key={k} className="flex justify-between gap-3 py-2"><dt className="text-muted">{LABELS[k]}</dt><dd className="num text-right font-medium [overflow-wrap:anywhere]">{fmt(k, p[k])}</dd></div>)}
        </dl>
        <div className="mt-3 rounded-xl bg-forest-50 px-3 py-2 text-xs" data-key-requirement>
          <span className="eyebrow !text-forest-700">Key requirement</span>
          <div className="mt-0.5 font-medium text-forest-900"><span className="text-muted">{LABELS[key]}:</span> <span className="num">{fmt(key, p[key])}</span></div>
        </div>
        <div className="mt-auto flex gap-2 pt-4">
          <Button onClick={onDetails} className="flex-1">View Details</Button>
          <Button variant={selected ? 'accent' : 'secondary'} aria-pressed={selected} onClick={onCompare}>{selected ? '✓ Compare' : 'Compare'}</Button>
        </div>
      </div>
    </article>
  )
}
