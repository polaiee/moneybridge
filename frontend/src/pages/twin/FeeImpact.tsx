import type { Scenario, SimResult } from '../../api'
import { Card, IllusBadge, Money, SectionHead, Tip } from '../../components/ui'
import { pct, usd } from '../../lib/format'

/** Two stacked fee cards; the bars are scaled against the larger modeled cost. */
export default function FeeImpact({ sim, baseSim, scenario, className = '' }: { sim: SimResult; baseSim: SimResult; scenario: Scenario; className?: string }) {
  const cur = baseSim.fee_impact.cost_of_fees, hyp = sim.fee_impact.cost_of_fees, max = Math.max(cur, hyp, 1)
  const diff = hyp - cur
  const Tile = ({ label, fee, cost, color, tint, tip }: { label: string; fee: number; cost: number; color: string; tint: string; tip?: boolean }) => (
    <div className={`flex flex-1 flex-col justify-between rounded-2xl border p-4 ${tint}`}>
      <div className="text-xs text-muted">{tip ? <Tip text="Weighted expense ratio = each fund's fee × its share of the portfolio, added up.">{label} · weighted fee {pct(fee)}</Tip> : <>{label} · weighted fee {pct(fee)}</>}</div>
      <Money value={cost} className="mt-1 text-2xl font-semibold" />
      <p className="text-2xs text-muted">Modeled cost of fees over {scenario.years} years</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-sand-100" role="img" aria-label={`${label} fee cost ${usd(cost)}, ${Math.round((cost / max) * 100)}% of the larger of the two`}>
        <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${Math.max(2, (cost / max) * 100)}%`, background: color }} data-fee-bar />
      </div>
    </div>
  )
  return (
    <Card className={`flex flex-col ${className}`}>
      <SectionHead title="ETF fee impact" sub="Same inputs, with and without fund fees" right={<IllusBadge>Fee comparison</IllusBadge>} />
      <div className="flex flex-1 flex-col gap-3">
        <Tile label="Current plan" fee={sim.baseline_expense_ratio_pct ?? 0} cost={cur} color="#98b5ab" tint="border-sand-200 bg-ivory/60" tip />
        <Tile label="Hypothetical plan" fee={sim.weighted_expense_ratio_pct} cost={hyp} color="#173b37" tint="border-lime-300 bg-lime-50" />
      </div>
      <p className="mt-3 text-xs">Fee cost difference: <b className="num">{usd(Math.abs(diff))}</b> {diff <= 0 ? 'less' : 'more'} in fees for the hypothetical plan. Contribution and balance differences also affect this figure.</p>
    </Card>
  )
}
