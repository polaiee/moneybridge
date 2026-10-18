import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import type { Category } from '../../api'
import { catOf, GOAL_COPY, TINT } from './categories'

/** "Relevant to Your Goals": at most two cards from the recommendations call. Never "Best for You". */
export function GoalCards({ recs, onPick }: { recs: { goal: string; category: Category }[]; onPick: (c: Category) => void }) {
  if (!recs.length) return null
  return (
    <section className="mt-8" aria-label="Relevant to Your Goals">
      <h2 className="text-xl font-semibold">Relevant to Your Goals</h2>
      <p className="mb-3 text-sm text-muted">Based on the goals you chose. A starting point, not a recommendation.</p>
      <div className="grid gap-3 md:grid-cols-2">
        {recs.slice(0, 2).map((r) => {
          const c = catOf(r.category), copy = GOAL_COPY[r.goal] ?? { title: c.label, text: c.blurb }
          return (
            <button key={r.goal} type="button" onClick={() => onPick(r.category)} data-goal={r.goal}
              className="group relative flex items-center gap-4 overflow-hidden rounded-[20px] border border-sand-200 bg-card p-4 pl-5 text-left shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-forest-300 hover:shadow-md active:scale-[0.99]">
              <span aria-hidden className="absolute inset-y-0 left-0 w-1.5 bg-lime-400" />
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${TINT[r.category].icon}`}><c.icon size={22} /></span>
              <span className="min-w-0"><span className="block font-semibold">{copy.title}</span><span className="block text-sm text-muted">{copy.text}</span>
                <span className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-forest-800">Explore Products <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" /></span></span>
            </button>)
        })}
      </div>
    </section>
  )
}

/** Shown instead of the goal cards when no goals were collected (never hides the page, never invents a suggestion). */
export function GoalsStrip() {
  return (
    <section className="mt-8" aria-label="Relevant to Your Goals">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-[20px] border border-dashed border-sand-300 bg-ivory/60 px-5 py-3.5 text-sm">
        <span><b className="font-semibold">Relevant to Your Goals</b> <span className="text-muted">· Add your goals in Settings to see suggestions here.</span></span>
        <Link to="/settings" className="font-semibold text-forest-800 underline-offset-2 hover:underline">Add your goals in Settings →</Link>
      </div>
    </section>
  )
}
