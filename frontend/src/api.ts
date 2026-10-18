async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...init })
  if (!r.ok) {
    let detail = `${r.status}`
    try { const j = await r.json(); detail = typeof j.detail === 'string' ? j.detail : JSON.stringify(j.detail) } catch { /* keep status */ }
    throw new Error(detail)
  }
  return r.json() as Promise<T>
}
const post = <T,>(p: string, body: unknown) => req<T>(p, { method: 'POST', body: JSON.stringify(body) })

export interface Account { id: string; name: string; type: 'checking' | 'savings' | 'investment' | 'liability'; balance: number; source: string }
export interface HoldingView { name: string; value: number; expense_ratio_pct: number; allocation_pct: number }
export interface Dashboard {
  data_source: string; accounts: Account[]; total_assets: number; total_liabilities: number; net_worth: number
  cash_flow: { monthly_income: number; monthly_expenses: number; monthly_surplus: number }
  portfolio: { total: number; holdings: HoldingView[] }
}
export interface HoldingIn { name: string; weight_pct: number; expense_ratio_pct: number }
export interface Scenario { initial_investment: number; monthly_contribution: number; years: number; gross_return_pct: number; holdings: HoldingIn[] }
export interface Projection { ending_value: number; total_contributions: number; modeled_growth: number; yearly_values: number[] }
export interface SimResult {
  weighted_expense_ratio_pct: number
  hypothetical: Projection
  baseline?: Projection
  baseline_expense_ratio_pct?: number
  difference_at_end?: number
  fee_impact: { cost_of_fees: number }
  risk_scenarios: Record<'downside' | 'base' | 'upside', Projection & { gross_return_pct: number }>
  assumptions: { monthly_rate: string; contribution_timing: string; excluded: string[]; disclaimer: string }
}
export interface Product { id: string; category: Category; name: string; provider: string; demo: boolean; [k: string]: string | number | boolean }
export type Category = 'banking' | 'savings' | 'credit' | 'investing'
export interface Comparison { category: Category; fields: string[]; products: [Product, Product] }
export interface ChatReply { reply: string; thread_id: string; assistant_id: string; context_used: string[] }
export interface Memory { id: string; content: string; [k: string]: unknown }

export const api = {
  dashboard: () => req<Dashboard>('/api/dashboard'),
  simulate: (scenario: Scenario, baseline?: Scenario) => post<SimResult>('/api/simulate', { scenario, baseline }),
  products: (category?: string, q?: string) => {
    const p = new URLSearchParams(); if (category) p.set('category', category); if (q) p.set('q', q)
    return req<{ disclaimer: string; products: Product[] }>(`/api/marketplace/products?${p}`)
  },
  compare: (a: string, b: string) => post<Comparison>('/api/marketplace/compare', { a, b }),
  recommendations: (goals: string[]) => req<{ label: string; recommendations: { goal: string; category: Category }[] }>(`/api/marketplace/recommendations?goals=${goals.join(',')}`),
  chat: (body: { message: string; thread_id?: string | null; memory_enabled: boolean; scenario_results?: unknown; compare?: { a: string; b: string } }) => post<ChatReply>('/api/chat', body),
  memories: () => req<unknown>('/api/memory'),
  deleteMemory: (id: string) => req<{ deleted: boolean }>(`/api/memory/${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
