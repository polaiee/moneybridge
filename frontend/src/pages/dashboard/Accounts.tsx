import { Banknote, CreditCard, Landmark, LineChart, PiggyBank } from 'lucide-react'
import { type Account, type Dashboard as D } from '../../api'
import { Badge, Card, DemoBadge, SectionHead } from '../../components/ui'
import { usd } from '../../lib/format'

const GROUPS = [
  { key: 'cash', label: 'Cash', icon: Banknote, match: (a: Account) => a.type === 'checking' || a.type === 'savings' },
  { key: 'inv', label: 'Investments', icon: LineChart, match: (a: Account) => a.type === 'investment' },
  { key: 'debt', label: 'Liabilities', icon: CreditCard, match: (a: Account) => a.type === 'liability' },
]
const TYPE_LABEL = { checking: 'Checking', savings: 'Savings', investment: 'Investment', liability: 'Credit card' }
const ICON = { checking: Landmark, savings: PiggyBank, investment: LineChart, liability: CreditCard }

/** Row D, cols 1–5: grouped list with subtotals and dashed dividers. No nested boxes. */
export default function Accounts({ d }: { d: D }) {
  return (
    <Card className="col-span-12 lg:col-span-5">
      <SectionHead title="Accounts" sub="Grouped by what they do for you" />
      <div className="space-y-5" aria-label="Accounts" role="list">
        {GROUPS.map((g) => {
          const rows = d.accounts.filter(g.match)
          if (!rows.length) return null
          const sub = rows.reduce((a, r) => a + r.balance, 0)
          return (
            <div key={g.key} role="listitem">
              <div className="flex items-center justify-between border-b border-dashed border-sand-300 pb-2"><span className="flex items-center gap-2 text-sm font-semibold text-forest-800"><g.icon size={15} />{g.label}</span><span className="num text-sm font-semibold text-muted">{g.key === 'debt' ? '−' : ''}{usd(sub)}</span></div>
              <ul className="dashed-rows">
                {rows.map((a) => { const I = ICON[a.type]; return (
                  <li key={a.id} data-account className="flex items-center gap-3 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-forest-100 text-forest-800"><I size={16} /></span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{a.name}</span><span className="flex flex-wrap items-center gap-1.5 text-2xs text-muted">{TYPE_LABEL[a.type]} {a.source === 'demo' ? <DemoBadge /> : <Badge>Manual</Badge>}</span></span>
                    <span className={`num text-base font-medium ${a.type === 'liability' ? 'text-coral-600' : ''}`}>{a.type === 'liability' ? '−' : ''}{usd(a.balance)}</span>
                  </li>) })}
              </ul>
            </div>)
        })}
      </div>
    </Card>
  )
}
