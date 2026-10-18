import type { ReactNode } from 'react'
import { CreditCard, PiggyBank, Wallet } from 'lucide-react'
import { type Dashboard as D } from '../../api'
import { Card, Eyebrow, Money } from '../../components/ui'
import { C } from '../../components/charts'
import { usd, pct } from '../../lib/format'

/** Compact KPI tile: icon chip + label, value, a mini chart of real values, and a caption that keeps the Demo label visible. */
function KpiTile({ icon, label, amount, caption, children }: { icon: ReactNode; label: string; amount: number; caption: string; children: ReactNode }) {
  return (
    <Card className="relative flex min-w-[200px] snap-start flex-col !p-3.5 md:min-w-0 xl:col-span-2">
      <span aria-hidden className="absolute right-3.5 top-4 h-1.5 w-1.5 rounded-full bg-lime-600" />
      <div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-forest-100 text-forest-800">{icon}</span><Eyebrow>{label}</Eyebrow></div>
      <Money value={amount} className="mt-2.5 text-[26px] font-medium leading-none" />
      <div className="mt-2.5 flex h-7 items-end">{children}</div>
      <p className="mt-1.5 text-2xs text-muted"><span className="font-semibold text-forest-800">Demo data</span> · {caption}</p>
    </Card>
  )
}

/** Cols 7–12 on xl (2 cols each), 3-up below, scroll-snap row on mobile. */
export default function Kpis({ d }: { d: D }) {
  const { monthly_income: inc, monthly_expenses: exp, monthly_surplus: surplus } = d.cash_flow
  const assetAccts = d.accounts.filter((a) => a.type !== 'liability')
  const maxAsset = Math.max(...assetAccts.map((a) => a.balance))
  const debtShare = (d.total_liabilities / d.total_assets) * 100
  const surplusShare = (surplus / inc) * 100
  return (
    <div className="col-span-12 flex snap-x gap-3 overflow-x-auto pb-1 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:pb-0 xl:contents">
      <KpiTile icon={<Wallet size={13} />} label="Total assets" amount={d.total_assets} caption={`${assetAccts.length} accounts`}>
        <div className="flex h-7 w-full items-end gap-1.5" role="img" aria-label={assetAccts.map((a) => `${a.name} ${usd(a.balance)}`).join(', ')}>
          {assetAccts.map((a, i) => <div key={a.id} title={`${a.name} ${usd(a.balance)}`} className="flex-1 rounded-t-[5px]" style={{ height: `${Math.max(14, (a.balance / maxAsset) * 100)}%`, background: [C.sage, C.forest, C.lime][i] }} />)}
        </div>
      </KpiTile>
      <KpiTile icon={<CreditCard size={13} />} label="Liabilities" amount={d.total_liabilities} caption={`${pct(debtShare, 0)} of assets`}>
        <div className="h-2 w-full overflow-hidden rounded-full bg-sand-100" role="img" aria-label={`Liabilities are ${pct(debtShare, 0)} of assets`}><div className="h-full rounded-full bg-coral-500" style={{ width: `${Math.max(4, debtShare)}%` }} /></div>
      </KpiTile>
      <KpiTile icon={<PiggyBank size={13} />} label="Monthly surplus" amount={surplus} caption={`${pct(surplusShare, 0)} of income`}>
        <div className="flex h-7 items-end gap-1.5" role="img" aria-label={`Income ${usd(inc)}, expenses ${usd(exp)}`}>
          <div className="w-7 rounded-t-[5px] bg-forest-900" style={{ height: '100%' }} title={`Income ${usd(inc)}`} /><div className="w-7 rounded-t-[5px] bg-coral-500" style={{ height: `${(exp / inc) * 100}%` }} title={`Expenses ${usd(exp)}`} />
        </div>
      </KpiTile>
    </div>
  )
}
