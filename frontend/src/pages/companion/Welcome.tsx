import { Link } from 'react-router-dom'
import { ArrowUpRight, BookOpen, GitBranch, Store, Target } from 'lucide-react'
import type { CompareContext, TwinContext } from '../../store'
import { GENERAL_STARTERS, GOAL_STARTERS, TWIN_MESSAGE, compareMessage } from '../../lib/prompts'
import { goalLabel, type Goal } from '../../lib/roadmap'
import { usd } from '../../lib/format'

interface Card { key: string; text: string; tag: string; icon: typeof Target; opts?: { scenario?: boolean; compare?: boolean }; preview?: string; calc?: boolean }
const MAX = 6

/** Empty-thread state: a timeless greeting and a grid of suggestion cards (goals, current Twin scenario, Marketplace comparison). */
export default function Welcome({ name, goals, twin, compare, onAsk, disabled }: {
  name?: string; goals: Goal[]; twin: TwinContext | null; compare: CompareContext | null
  onAsk: (text: string, opts?: { scenario?: boolean; compare?: boolean }) => void; disabled?: boolean
}) {
  const first = (name || '').trim().split(/\s+/)[0]
  const cards: Card[] = []
  const contexts: Card[] = []
  if (twin) contexts.push({ key: 'twin', text: 'Explain my current Twin scenario', tag: 'Calculated by MoneyBridge', icon: GitBranch, opts: { scenario: true }, calc: true,
    preview: `Ending value ${usd(twin.results.hypothetical.ending_value)} · ${twin.scenario.years} years` })
  if (compare) contexts.push({ key: 'compare', text: `Explain: ${compare.label}`, tag: 'Demo products', icon: Store, opts: { compare: true } })
  const goalCards = goals.map((g): Card => ({ key: `g-${g}`, text: GOAL_STARTERS[g], tag: `Your goal · ${goalLabel(g)}`, icon: Target })).slice(0, Math.max(0, 3))
  const missing = [!twin && { to: '/twin', text: 'Run a scenario in the Financial Twin', icon: GitBranch }, !compare && { to: '/marketplace', text: 'Compare two products in the Marketplace', icon: Store }].filter(Boolean) as { to: string; text: string; icon: typeof Target }[]
  cards.push(...contexts, ...goalCards)
  const seen = new Set(cards.map((c) => c.text))
  for (const t of GENERAL_STARTERS) { if (cards.length + missing.length >= MAX) break; if (!seen.has(t)) { seen.add(t); cards.push({ key: `s-${t}`, text: t, tag: 'Money basics', icon: BookOpen }) } }
  const shown = cards.slice(0, MAX - missing.length)

  return (
    <div className="mx-auto flex min-h-full w-full max-w-[720px] flex-col justify-center px-4 py-5 sm:px-6">
      <p className="text-sm text-muted">{first ? `Hi, ${first}` : 'Hi there'}</p>
      <h2 className="mt-1 text-[30px] font-semibold leading-[1.1] text-forest-900 sm:text-[36px]">How can I <span className="text-lilac-600">help</span><br />you today?</h2>
      <p className="mt-2 max-w-md text-sm text-muted">I explain numbers MoneyBridge has calculated. I don’t calculate, predict or give advice.</p>

      <div className="@container mt-6">
        <div className="eyebrow mb-2.5">Try asking</div>
        <ul className="grid grid-cols-1 gap-2.5 @xs:grid-cols-2 @xl:grid-cols-3" aria-label="Suggestions">
          {shown.map((c) => (
            <li key={c.key} className="flex">
              <button type="button" disabled={disabled} onClick={() => onAsk(c.key === 'twin' ? TWIN_MESSAGE : c.key === 'compare' && compare ? compareMessage(compare.label) : c.text, c.opts)} data-suggestion={c.key}
                className="group flex w-full flex-col justify-between gap-2.5 rounded-2xl border border-sand-200 bg-card p-3.5 text-left shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-lilac-300 hover:bg-lilac-50 hover:shadow-md active:translate-y-0 active:scale-[0.99] disabled:opacity-60">
                <span className="flex items-start justify-between gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-lilac-100 text-lilac-800"><c.icon size={16} /></span>
                  <ArrowUpRight size={16} className="text-sand-400 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-lilac-600" />
                </span>
                <span className="text-sm font-medium leading-snug text-ink">{c.text}</span>
                <span className="flex flex-col gap-1">
                  {c.preview && <span className="num w-fit rounded-full bg-lilac-100 px-2 py-0.5 text-2xs font-semibold text-lilac-800">{c.preview}</span>}
                  <span className="text-2xs font-medium text-muted">{c.tag}</span>
                </span>
              </button>
            </li>))}
          {missing.map((m) => (
            <li key={m.to} className="flex">
              <Link to={m.to} data-suggestion-link={m.to} className="group flex w-full flex-col justify-between gap-2.5 rounded-2xl border border-dashed border-sand-300 bg-ivory/60 p-3.5 text-left transition-colors hover:border-forest-300 hover:bg-forest-50">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-forest-100 text-forest-800"><m.icon size={16} /></span>
                <span className="text-sm font-medium leading-snug text-forest-900">{m.text} →</span>
                <span className="text-2xs text-muted">Then ask me to explain it</span>
              </Link>
            </li>))}
        </ul>
      </div>
    </div>
  )
}
