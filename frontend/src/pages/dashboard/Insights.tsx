import { Link } from 'react-router-dom'
import { ArrowRight, Lightbulb } from 'lucide-react'
import { type Dashboard as D } from '../../api'
import { Button, Card } from '../../components/ui'
import { usd, pct } from '../../lib/format'

/** Row E, full width: one short strip. Simple ratios of the demo values, not advice. */
export default function Insights({ d }: { d: D }) {
  const { monthly_income: inc, monthly_surplus: surplus } = d.cash_flow
  return (
    <Card tone="lime" className="col-span-12 !py-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Lightbulb size={18} className="mt-0.5 shrink-0 text-forest-800" />
          <div className="min-w-0">
            <p className="text-sm">Your monthly surplus is <b className="num">{usd(surplus)}</b>, or {pct((surplus / inc) * 100, 0)} of income. Investments make up {pct((d.portfolio.total / d.total_assets) * 100, 0)} of your assets (<span className="num">{usd(d.portfolio.total)}</span> of <span className="num">{usd(d.total_assets)}</span>).</p>
            <p className="text-[11px] text-forest-800/80">Demo data · simple ratios of the values above. Not advice.</p>
          </div>
        </div>
        <Link to="/twin" className="shrink-0"><Button>Explore in Financial Twin<ArrowRight size={15} /></Button></Link>
      </div>
    </Card>
  )
}
