import { useState } from 'react'
import { ChevronDown, Info } from 'lucide-react'
import type { SimResult } from '../../api'
import { Badge, Card } from '../../components/ui'

/** Always-visible one-line assumptions strip (from the backend's `assumptions`). */
export function AssumptionsStrip({ sim, className = '' }: { sim: SimResult; className?: string }) {
  const a = sim.assumptions
  return (
    <div role="note" aria-label="Calculation assumptions" className={`flex items-start gap-2.5 rounded-2xl border border-dashed border-forest-300 bg-forest-50 px-4 py-2.5 text-xs leading-relaxed text-forest-900 ${className}`}>
      <Info size={14} className="mt-0.5 shrink-0 text-forest-600" />
      <p><b>Monthly rate</b> = {a.monthly_rate} · <b>Contributions</b> at {a.contribution_timing} · <b>Excluded:</b> {a.excluded.join(', ')} · {a.disclaimer}</p>
    </div>
  )
}

/** Closed-by-default accordion with the full assumptions. */
export function AssumptionsAccordion({ sim, className = '' }: { sim: SimResult; className?: string }) {
  const [open, setOpen] = useState(false)
  const a = sim.assumptions
  const rows: [string, string][] = [['Monthly rate', a.monthly_rate], ['Contribution timing', a.contribution_timing], ['Excluded', a.excluded.join(', ')], ['Rounding', 'cents, at output only'], ['Scenario returns', 'downside and upside are fixed by the backend; base is your chosen return']]
  return (
    <Card className={className}>
      <h2>
        <button type="button" aria-expanded={open} aria-controls="assumptions-detail" onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-3 text-left">
          <span><span className="block text-lg font-semibold leading-tight">How it’s calculated</span><span className="block text-sm font-normal text-muted">Everything is computed by deterministic backend code</span></span>
          <ChevronDown size={18} className={`shrink-0 text-forest-700 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
      </h2>
      {open && (
        <div id="assumptions-detail" className="fade-in mt-4">
          <dl className="divide-y divide-dashed divide-sand-300 text-sm">{rows.map(([k, v]) => <div key={k} className="flex flex-wrap justify-between gap-x-4 py-2"><dt className="font-medium">{k}</dt><dd className="num text-right text-muted">{v}</dd></div>)}</dl>
          <p className="mt-3 text-xs text-muted">{a.disclaimer} Educational illustration, not individualized investment advice.</p>
          <div className="mt-2"><Badge tone="hypo">Hypothetical</Badge></div>
        </div>)}
    </Card>
  )
}
