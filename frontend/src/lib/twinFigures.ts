import type { TwinContext } from '../store'
import { pct, usd } from './format'

/** The exact figures MoneyBridge sends to the AI for a Twin scenario (all calculated by the backend). */
export function twinRows(ctx: TwinContext | null): [string, string][] {
  if (!ctx) return []
  const r = ctx.results, s = ctx.scenario
  return [
    ['Initial investment', usd(s.initial_investment)], ['Monthly contribution', usd(s.monthly_contribution)], ['Duration', `${s.years} years`], ['Gross return', pct(s.gross_return_pct, 1)],
    ['Allocation', s.holdings.map((h) => `${h.name} ${h.weight_pct}%`).join(', ')], ['Weighted fee', pct(r.weighted_expense_ratio_pct)],
    ['Ending value', usd(r.hypothetical.ending_value, 2)], ['Total contributions', usd(r.hypothetical.total_contributions, 2)], ['Modeled growth', usd(r.hypothetical.modeled_growth, 2)], ['Cost of fees', usd(r.fee_impact.cost_of_fees, 2)],
    ['Downside / Base / Upside', `${usd(r.risk_scenarios.downside.ending_value, 2)} / ${usd(r.risk_scenarios.base.ending_value, 2)} / ${usd(r.risk_scenarios.upside.ending_value, 2)}`],
  ]
}
