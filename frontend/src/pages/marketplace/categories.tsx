import { Banknote, CreditCard, LineChart, PiggyBank } from 'lucide-react'
import type { Category } from '../../api'

export const CATS: { id: Category; label: string; icon: typeof Banknote; blurb: string }[] = [
  { id: 'banking', label: 'Banking', icon: Banknote, blurb: 'Everyday checking accounts' },
  { id: 'savings', label: 'Savings', icon: PiggyBank, blurb: 'Build a financial buffer' },
  { id: 'credit', label: 'Credit', icon: CreditCard, blurb: 'Cards and credit building' },
  { id: 'investing', label: 'Investing', icon: LineChart, blurb: 'Index and guided accounts' },
]
/** Category tints. They always sit behind an icon and a text label, so colour is never the only signal. */
export const TINT: Record<Category, { band: string; icon: string; ring: string }> = {
  banking: { band: 'bg-forest-100', icon: 'bg-forest-200 text-forest-900', ring: 'ring-forest-600' },
  savings: { band: 'bg-lime-100', icon: 'bg-lime-300 text-forest-900', ring: 'ring-lime-600' },
  credit: { band: 'bg-amber-50', icon: 'bg-[#f6dcae] text-[#6b3f04]', ring: 'ring-amber-500' },
  investing: { band: 'bg-forest-200/70', icon: 'bg-forest-300 text-forest-950', ring: 'ring-forest-400' },
}
export const catOf = (c: Category) => CATS.find((x) => x.id === c)!

export const GOAL_COPY: Record<string, { title: string; text: string }> = {
  emergency_savings: { title: 'Emergency fund', text: 'Discover savings options for your financial buffer.' },
  budgeting: { title: 'Everyday money', text: 'Explore banking options for daily spending.' },
  credit_building: { title: 'Credit building', text: 'See card terms side by side.' },
  investing: { title: 'Investing', text: 'Explore low-minimum investing accounts.' },
  learning_etfs: { title: 'Learning about ETFs', text: 'Compare expense ratios and platform fees.' },
  retirement: { title: 'Long-term saving', text: 'Explore investing accounts for long horizons.' },
}
