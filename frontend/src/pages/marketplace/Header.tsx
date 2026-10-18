import { Badge } from '../../components/ui'

/** Compact header: the spec title and subtitle, a Demo catalog badge, and the comparison status. */
export default function Header({ total, selected }: { total: number; selected: number }) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-3xl leading-tight text-forest-900 sm:text-4xl">Financial Marketplace</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-muted">Discover and compare financial products that support your goals.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {selected > 0 && <span role="status" className="fade-in inline-flex items-center gap-1.5 rounded-full border border-forest-300 bg-forest-50 px-3 py-1 text-xs font-semibold text-forest-900">Comparing {selected} of 2</span>}
        <Badge tone="demo">Demo catalog{total ? ` · ${total} products` : ''}</Badge>
      </div>
    </header>
  )
}
