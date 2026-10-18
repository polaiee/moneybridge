import type { Dashboard, Scenario } from '../../api'
import type { TwinForm } from '../../store'

export const DEFAULT_MONTHLY = 300 // illustrative assumption: the demo dataset has no recorded contribution
export const num = (s: string) => (s.trim() === '' ? NaN : Number(s))

export function initialForm(d: Dashboard): TwinForm {
  return {
    initial: String(d.portfolio.total), monthly: String(DEFAULT_MONTHLY), baselineMonthly: String(DEFAULT_MONTHLY), years: '10', gross: '6',
    holdings: d.portfolio.holdings.map((h) => ({ name: h.name, weight: String(h.allocation_pct), er: String(h.expense_ratio_pct) })),
  }
}

/** Client-side validation mirrors the backend rules so users get instant, specific messages. */
export function validate(f: TwinForm) {
  const e: Record<string, string> = {}
  const inRange = (k: string, v: number, lo: number, hi: number, label: string, int = false) => {
    if (Number.isNaN(v)) e[k] = `${label} is required`
    else if (v < lo || v > hi) e[k] = `${label} must be between ${lo} and ${hi}`
    else if (int && !Number.isInteger(v)) e[k] = `${label} must be a whole number`
  }
  inRange('initial', num(f.initial), 0, 1e9, 'Initial investment')
  inRange('monthly', num(f.monthly), 0, 1e7, 'Monthly contribution')
  inRange('baselineMonthly', num(f.baselineMonthly), 0, 1e7, 'Current contribution')
  inRange('years', num(f.years), 1, 50, 'Duration', true)
  inRange('gross', num(f.gross), -20, 30, 'Gross return')
  f.holdings.forEach((h, i) => { inRange(`w${i}`, num(h.weight), 0, 100, 'Weight'); inRange(`er${i}`, num(h.er), 0, 5, 'Expense ratio') })
  const total = Math.round(f.holdings.reduce((a, h) => a + (num(h.weight) || 0), 0) * 1e6) / 1e6
  if (!f.holdings.some((_, i) => e[`w${i}`]) && Math.abs(total - 100) > 1e-6) e.total = `Allocation must total 100% (currently ${total}%)`
  return { errors: e, total }
}
export type Validation = ReturnType<typeof validate>

export function toScenario(f: TwinForm, monthly: string, initial: string, holdings: TwinForm['holdings']): Scenario {
  return {
    initial_investment: num(initial), monthly_contribution: num(monthly), years: num(f.years), gross_return_pct: num(f.gross),
    holdings: holdings.map((h) => ({ name: h.name, weight_pct: num(h.weight), expense_ratio_pct: num(h.er) })),
  }
}

/** Moves one fund's weight and splits the remainder among the others in proportion, so the total stays exactly 100. */
export function linkedWeights(f: TwinForm, i: number, v: number): TwinForm['holdings'] {
  const others = f.holdings.map((h, j) => ({ j, w: num(h.weight) || 0 })).filter((o) => o.j !== i)
  const rest = Math.round((100 - v) * 100) / 100
  const sum = others.reduce((a, o) => a + o.w, 0)
  const next = f.holdings.map((h) => ({ ...h }))
  next[i].weight = String(v)
  let used = 0
  others.forEach((o, k) => {
    const share = k === others.length - 1 ? Math.round((rest - used) * 100) / 100 : Math.round((sum > 0 ? (o.w / sum) * rest : rest / others.length) * 100) / 100
    used += share; next[o.j].weight = String(share)
  })
  return next
}

/** Fund colors shared by the split bar, rows and (in pass 2) the comparison bars. */
export const FUND = [
  { bg: '#173b37', fg: '#f8f7f2', chip: 'rgba(248,247,242,0.18)' },
  { bg: '#c8ea54', fg: '#173b37', chip: 'rgba(23,59,55,0.14)' },
  { bg: '#668d81', fg: '#0f2825', chip: 'rgba(15,40,37,0.14)' },
]
