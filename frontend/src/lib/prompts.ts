import type { Goal } from './roadmap'

/** Shared wording so the Twin's AI panel and the Companion send exactly the same question. */
export const TWIN_MESSAGE = 'Explain this Financial Twin scenario to me in plain language. Use only the numbers provided.'
export const compareMessage = (label: string) => {
  const [a, b] = label.split(' vs ')
  return b ? `Explain the trade-offs between ${a} and ${b} in plain language, using only the comparison data provided.` : `Explain the trade-offs in this product comparison (${label}) in plain language, using only the comparison data provided.`
}

/** Education-only starters, one per onboarding goal. Fixed text: no numbers, no advice. */
export const GOAL_STARTERS: Record<Goal, string> = {
  emergency_savings: 'What is an emergency fund, and how do savings accounts differ?',
  budgeting: 'How do income, expenses and monthly surplus relate?',
  credit_building: 'How does a secured credit card help build credit history?',
  investing: 'What does diversification mean?',
  retirement: 'How does a long time horizon change compounding?',
  learning_etfs: 'What is an ETF expense ratio and why does it matter?',
}
export const GENERAL_STARTERS = [
  'How does compounding work, in simple terms?',
  'What does diversification mean?',
  'What is an ETF expense ratio and why does it matter?',
  'What is the difference between APR and APY?',
]
