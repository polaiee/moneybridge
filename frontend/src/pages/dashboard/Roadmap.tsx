import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { Badge, Card, Eyebrow, SectionHead } from '../../components/ui'
import { buildRoadmap, goalLabel, type Goal, type RoadmapStep } from '../../lib/roadmap'

function useDone() {
  const [done, setDone] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('mb.roadmapDone') || '[]') } catch { return [] } })
  useEffect(() => { try { localStorage.setItem('mb.roadmapDone', JSON.stringify(done)) } catch { /* ignore */ } }, [done])
  return [done, (t: string) => setDone((d) => (d.includes(t) ? d.filter((x) => x !== t) : [...d, t]))] as const
}

/** Row D, cols 6–12: goals strip, then a stepper (horizontal on desktop, vertical on mobile). Clicking a node toggles done. */
export default function Roadmap({ goals }: { goals: Goal[] }) {
  const [done, toggle] = useDone()
  const steps = buildRoadmap(goals)
  const current = steps.findIndex((s) => !done.includes(s.title))
  const node = (s: RoadmapStep, i: number) => {
    const isDone = done.includes(s.title), isCur = i === current
    return (
      <button type="button" onClick={() => toggle(s.title)} aria-pressed={isDone} aria-label={`${isDone ? 'Mark not done' : 'Mark done'}: ${s.title}`}
        className={`z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all active:scale-95 ${isDone ? 'border-forest-900 bg-forest-900 text-lime-400' : isCur ? 'border-lime-500 bg-lime-400 text-forest-900 shadow-sm' : 'border-sand-300 bg-card text-muted'}`}>{isDone ? <Check size={15} strokeWidth={3} /> : i + 1}</button>)
  }
  const body = (s: RoadmapStep, i: number) => {
    const isDone = done.includes(s.title), isCur = i === current
    return (
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2"><span className="eyebrow !text-lilac-600">{s.tag}</span><Badge tone={isDone ? 'demo' : isCur ? 'hypo' : 'neutral'}>{isDone ? 'Done' : isCur ? 'Current' : 'Up next'}</Badge></div>
        <div className={`mt-1 text-sm font-semibold ${isDone ? 'text-muted line-through decoration-sand-300' : ''}`}>{s.title}</div>
        <p className="mt-0.5 text-xs text-muted">{s.text}</p>
        <Link to={s.to} className="mt-1.5 inline-flex items-center gap-1 text-sm font-semibold text-forest-800 transition-colors hover:text-forest-950">{s.cta}<ArrowRight size={14} /></Link>
      </div>)
  }
  return (
    <Card className="col-span-12 lg:col-span-7">
      <SectionHead title="Goals & roadmap" sub="Rule-based steps from your onboarding goals" />
      <div className="mb-5">
        <Eyebrow className="mb-2">Your goals</Eyebrow>
        {goals.length ? (
          <ul className="flex flex-wrap gap-2" aria-label="Goals">{goals.map((g) => (
            <li key={g} className="inline-flex items-center gap-2 rounded-full border border-dashed border-sand-300 bg-ivory/70 py-1 pl-3 pr-2 text-sm"><span className="h-2 w-2 rounded-full bg-lime-500" /><span className="font-medium">{goalLabel(g)}</span><Badge>No progress data</Badge></li>))}</ul>
        ) : <p className="rounded-2xl border border-dashed border-sand-300 bg-ivory/60 p-3 text-sm text-muted">No goals selected yet. Add some in <Link to="/settings" className="font-semibold text-forest-800 underline-offset-2 hover:underline">Settings</Link>.</p>}
        <p className="mt-2 text-2xs text-muted">Progress bars appear only when real balances exist for a goal. None are invented.</p>
      </div>

      {/* desktop: horizontal stepper */}
      <ol className="hidden gap-4 overflow-x-auto pb-1 md:flex" aria-label="Roadmap steps">
        {steps.map((s, i) => (
          <li key={s.title} className="min-w-[200px] flex-1">
            <div className="mb-3 flex items-center">{node(s, i)}{i < steps.length - 1 && <span aria-hidden className={`ml-2 flex-1 border-t-2 border-dashed ${done.includes(s.title) ? 'border-forest-500' : 'border-sand-300'}`} />}</div>
            {body(s, i)}
          </li>))}
      </ol>
      {/* mobile: vertical stepper */}
      <ol className="md:hidden" aria-label="Roadmap steps">
        {steps.map((s, i) => (
          <li key={s.title} className="relative flex gap-4 pb-6 last:pb-0">
            {i < steps.length - 1 && <span aria-hidden className={`absolute left-[15px] top-9 h-[calc(100%-2rem)] border-l-2 border-dashed ${done.includes(s.title) ? 'border-forest-500' : 'border-sand-300'}`} />}
            {node(s, i)}{body(s, i)}
          </li>))}
      </ol>
    </Card>
  )
}
