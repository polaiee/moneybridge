import { useState } from 'react'
import { Card } from '../../components/ui'

const QUIZ = [
  { q: 'Two funds earn the same gross return. Fund A charges 0.05% a year and Fund B charges 0.20%. Over a long horizon, which usually leaves you with more?', options: ['Fund A (lower fee)', 'Fund B (higher fee)', 'They are always identical'], answer: 0, why: 'Fees are subtracted from the return every year, and the difference compounds. The fee cards above show this with your own inputs.' },
  { q: 'What does diversification across several funds mainly try to reduce?', options: ['Concentration risk: depending on one market or company', 'All risk, guaranteeing gains', 'The expense ratio'], answer: 0, why: 'Spreading money can reduce reliance on any single holding, but it cannot remove market risk or guarantee returns.' },
]

/** Compact, optional two-question knowledge check. */
export default function Quiz({ className = '' }: { className?: string }) {
  const [i, setI] = useState(0); const [pick, setPick] = useState<number | null>(null)
  const q = QUIZ[i]
  return (
    <Card className={className}>
      <div className="mb-2 flex items-baseline justify-between gap-2"><h2 className="text-lg font-semibold leading-tight">Knowledge check</h2><span className="text-xs text-muted">Question {i + 1} of {QUIZ.length} · optional</span></div>
      <p className="text-sm font-medium">{q.q}</p>
      <div className="mt-3 space-y-1.5" role="radiogroup" aria-label="Answers">
        {q.options.map((o, k) => {
          const done = pick !== null, right = k === q.answer
          return <button key={o} role="radio" aria-checked={pick === k} disabled={done} onClick={() => setPick(k)}
            className={`block w-full rounded-xl border px-3 py-2 text-left text-sm transition-colors ${done && right ? 'border-forest-600 bg-lime-100' : done && pick === k ? 'border-coral-600 bg-coral-50' : 'border-sand-300 bg-card hover:border-forest-300 hover:bg-forest-50'}`}>{o}</button>
        })}
      </div>
      {pick !== null && <div className="fade-in mt-3 rounded-xl bg-forest-50 p-3 text-sm" role="status"><b>{pick === q.answer ? 'Correct. ' : 'Not quite. '}</b>{q.why}
        {i < QUIZ.length - 1 && <button onClick={() => { setI(i + 1); setPick(null) }} className="ml-2 font-semibold text-forest-800 underline">Next question</button>}</div>}
    </Card>
  )
}
