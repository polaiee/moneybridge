import type { Category, Product } from '../api'

/** Labels and formatting for the fictional demo products, shared by the Marketplace and the Companion's context panel. */
export const LABELS: Record<string, string> = {
  monthly_fee: 'Monthly fee', opening_deposit: 'Opening deposit', minimum_balance: 'Minimum balance', waiver: 'Fee waiver',
  apy_pct: 'Variable APY', minimum_to_earn: 'Minimum to earn APY', withdrawal_limits: 'Withdrawal limits',
  apr_pct: 'Variable purchase APR', annual_fee: 'Annual fee', security_deposit: 'Security deposit', restrictions: 'Restrictions',
  min_investment: 'Account minimum', account_fee: 'Platform fee', etf_expense_ratio_pct: 'ETF expense ratio', services: 'Services',
}
export const MONEY = new Set(['monthly_fee', 'opening_deposit', 'minimum_balance', 'minimum_to_earn', 'annual_fee', 'security_deposit', 'min_investment'])
export function fmt(k: string, v: unknown): string {
  if (v === undefined || v === null || v === '') return 'Not provided'
  if (typeof v === 'number') {
    if (k.endsWith('_pct')) return `${v.toFixed(2)}%${k === 'etf_expense_ratio_pct' ? '/yr' : ''}`
    if (MONEY.has(k)) return `$${v.toLocaleString('en-US')}`
    if (k === 'account_fee') return v === 0 ? '$0' : `${v}% (as listed)`
  }
  return String(v)
}

export const FIELDS: Record<Category, string[]> = {
  banking: ['monthly_fee', 'opening_deposit', 'minimum_balance', 'waiver'], savings: ['apy_pct', 'monthly_fee', 'minimum_to_earn', 'withdrawal_limits'],
  credit: ['apr_pct', 'annual_fee', 'security_deposit', 'restrictions'], investing: ['min_investment', 'account_fee', 'etf_expense_ratio_pct', 'services'],
}
export const EDU: Record<Category, { desc: string; features: string; reqs: string; risks: string }> = {
  banking: { desc: 'An illustrative everyday account for deposits and spending.', features: 'Terms shown are fictional and vary by product. Check fees, waivers and balance rules.', reqs: 'Eligibility and identity requirements are not specified in this demo.', risks: 'Fees can apply if waiver or balance conditions are not met. Not a verified offer.' },
  savings: { desc: 'An illustrative savings account to explore as you build a financial buffer.', features: 'A displayed variable APY may require a minimum balance. Rates can change.', reqs: 'Eligibility and identity requirements are not specified in this demo.', risks: 'Variable rates can fall. Withdrawal limits may apply. No deposit insurance has been verified.' },
  credit: { desc: 'An illustrative credit card to explore how APR, fees and deposits compare.', features: 'APR is variable and fictional. A security deposit may be refundable under account terms.', reqs: 'Approval is never guaranteed. Enrollment or deposit rules may apply.', risks: 'Carrying a balance costs interest at the APR. Late payments can hurt credit history.' },
  investing: { desc: 'An illustrative investing account for exploring fees and ETF access.', features: 'Fictional ETFs only. Expense ratios are annual fund costs.', reqs: 'Eligibility is not specified in this demo.', risks: 'No returns are promised. Capital is at risk and you can lose money.' },
}

/** Per category: the headline attribute, and the single fee or condition to watch. These only label existing fields. */
export const KEY_FIELD: Record<Category, string> = { banking: 'waiver', savings: 'minimum_to_earn', credit: 'security_deposit', investing: 'account_fee' }
/** Attribute rows shown on a card, after the headline and key requirement (2 rows). */
export const cardRows = (c: Category) => FIELDS[c].filter((f, i) => i > 0 && f !== KEY_FIELD[c]).slice(0, 2)
export const leadValue = (p: Product) => ({ field: FIELDS[p.category][0], text: fmt(FIELDS[p.category][0], p[FIELDS[p.category][0]]) })
