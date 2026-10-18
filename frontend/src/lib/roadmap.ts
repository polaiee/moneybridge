// Transparent, rule-based roadmap: each onboarding goal maps to a fixed set of next steps.
export type Goal = 'emergency_savings' | 'budgeting' | 'credit_building' | 'investing' | 'retirement' | 'learning_etfs'
export type Stage = 'student' | 'early_career' | 'professional' | 'other'
export type Level = 'beginner' | 'intermediate' | 'advanced'

export const GOALS: { id: Goal; label: string; blurb: string }[] = [
  { id: 'emergency_savings', label: 'Emergency savings', blurb: 'Build a buffer for the unexpected' },
  { id: 'budgeting', label: 'Budgeting', blurb: 'Understand where money goes each month' },
  { id: 'credit_building', label: 'Credit building', blurb: 'Learn how credit history is built' },
  { id: 'investing', label: 'Investing', blurb: 'Explore how contributions can grow' },
  { id: 'retirement', label: 'Retirement preparation', blurb: 'Think about long time horizons' },
  { id: 'learning_etfs', label: 'Learning about ETFs', blurb: 'Fees, diversification and allocation' },
]
export const STAGES: { id: Stage; label: string; blurb: string }[] = [
  { id: 'student', label: 'Student', blurb: "I'm studying and managing money with confidence." },
  { id: 'early_career', label: 'Early career', blurb: "I'm starting my first job or building my first savings." },
  { id: 'professional', label: 'Working professional', blurb: 'I earn a steady income and want to plan ahead.' },
  { id: 'other', label: 'Other', blurb: 'Something else, or just exploring.' },
]
export const LEVELS: { id: Level; label: string; blurb: string }[] = [
  { id: 'beginner', label: 'Beginner', blurb: 'New to saving and investing terms' },
  { id: 'intermediate', label: 'Intermediate', blurb: 'Comfortable with the basics' },
  { id: 'advanced', label: 'Advanced', blurb: 'I follow portfolio concepts already' },
]
export const goalLabel = (g: string) => GOALS.find((x) => x.id === g)?.label ?? g

export interface RoadmapStep { tag: string; title: string; text: string; to: string; cta: string }
const RULES: Record<Goal, RoadmapStep> = {
  emergency_savings: { tag: 'SAVING', title: 'Explore savings products', text: 'Compare fees and minimums on illustrative savings accounts.', to: '/marketplace?category=savings', cta: 'Browse savings' },
  budgeting: { tag: 'BUDGETING', title: 'Review your cash flow', text: 'See income, expenses and monthly surplus for the demo profile.', to: '/dashboard', cta: 'Open dashboard' },
  credit_building: { tag: 'CREDIT BASICS', title: 'Understand credit products', text: 'Compare APR, annual fee and deposit on two demo cards.', to: '/marketplace?category=credit', cta: 'Browse credit' },
  investing: { tag: 'INVESTING', title: 'Try a contribution scenario', text: 'Change monthly contributions and horizon in the Financial Twin.', to: '/twin', cta: 'Open Financial Twin' },
  retirement: { tag: 'LONG HORIZON', title: 'Stretch the time horizon', text: 'See how 10, 20 and 30 years change a hypothetical outcome.', to: '/twin', cta: 'Open Financial Twin' },
  learning_etfs: { tag: 'ETF LEARNING', title: 'Learn how fees compound', text: 'Compare allocations and weighted expense ratios side by side.', to: '/twin', cta: 'Open Financial Twin' },
}
export function buildRoadmap(goals: Goal[]): RoadmapStep[] {
  const steps = goals.map((g) => RULES[g]).filter(Boolean)
  const uniq = steps.filter((s, i) => steps.findIndex((t) => t.title === s.title) === i)
  return uniq.length ? uniq : [RULES.investing]
}
