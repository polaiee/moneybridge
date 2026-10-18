import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, RefreshCw, Sparkles, X } from 'lucide-react'
import { Badge, Button, ErrorBox } from '../../components/ui'
import Rich from '../../components/Rich'
import { useAsk } from '../../lib/useAsk'
import { usd, pct } from '../../lib/format'
import { friendlyError } from '../../lib/errors'
import { useStore } from '../../store'

const MESSAGE = 'Explain this Financial Twin scenario to me in plain language. Use only the numbers provided.'

/** In-page AI slide-over: same POST /api/chat call and thread as the Companion, scenario results attached. */
export default function AiPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { twinContext } = useStore()
  const nav = useNavigate()
  const { send, busy } = useAsk()
  const [reply, setReply] = useState<{ text: string; error?: boolean; used?: string[] } | null>(null)
  const [showCtx, setShowCtx] = useState(false)
  const keyRef = useRef<string | null>(null)
  const dialog = useRef<HTMLDivElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)
  const opener = useRef<HTMLElement | null>(null)

  const ask = useCallback(async () => {
    setReply(null)
    const r = await send(MESSAGE, { scenario: true })
    if (r) setReply({ text: r.text, error: r.error, used: r.contextUsed })
  }, [send])

  // On open: remember the trigger, focus the dialog, and (re)ask only if the scenario changed since the last reply.
  useEffect(() => {
    if (!open) return
    opener.current = document.activeElement as HTMLElement
    setTimeout(() => closeBtn.current?.focus(), 30)
    const key = twinContext ? JSON.stringify(twinContext.results) + JSON.stringify(twinContext.scenario) : null
    if (key && key !== keyRef.current) { keyRef.current = key; void ask() }
    return () => { opener.current?.focus?.() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); return }
      if (e.key !== 'Tab' || !dialog.current) return
      const f = [...dialog.current.querySelectorAll<HTMLElement>('button, a[href], input, [tabindex]:not([tabindex="-1"])')].filter((x) => !x.hasAttribute('disabled'))
      if (!f.length) return
      const first = f[0], last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open, onClose])

  if (!open) return null
  const r = twinContext?.results, s = twinContext?.scenario
  const rows: [string, string][] = r && s ? [
    ['Initial investment', usd(s.initial_investment)], ['Monthly contribution', usd(s.monthly_contribution)], ['Duration', `${s.years} years`], ['Gross return', pct(s.gross_return_pct, 1)],
    ['Allocation', s.holdings.map((h) => `${h.name} ${h.weight_pct}%`).join(', ')], ['Weighted fee', pct(r.weighted_expense_ratio_pct)],
    ['Ending value', usd(r.hypothetical.ending_value, 2)], ['Total contributions', usd(r.hypothetical.total_contributions, 2)], ['Modeled growth', usd(r.hypothetical.modeled_growth, 2)], ['Cost of fees', usd(r.fee_impact.cost_of_fees, 2)],
    ['Downside / Base / Upside', `${usd(r.risk_scenarios.downside.ending_value, 2)} / ${usd(r.risk_scenarios.base.ending_value, 2)} / ${usd(r.risk_scenarios.upside.ending_value, 2)}`],
  ] : []

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="AI explanation of this scenario">
      <div className="fade-in absolute inset-0 bg-forest-950/25" onClick={onClose} />
      <div ref={dialog} className="drawer-enter absolute inset-y-0 right-0 flex w-full flex-col bg-card shadow-pop md:w-[440px]">
        <div className="flex items-center gap-3 bg-lilac-100 px-5 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-lilac-300 text-forest-950"><Sparkles size={17} /></span>
          <div className="min-w-0 flex-1"><div className="font-semibold leading-tight">AI explanation</div><div className="text-xs text-lilac-800">via Backboard · Financial Twin</div></div>
          <button ref={closeBtn} type="button" aria-label="Close AI panel" onClick={onClose} className="rounded-full p-2 transition-colors hover:bg-lilac-300/50"><X size={18} /></button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <div className="rounded-2xl border border-dashed border-lilac-300 bg-lilac-50 p-3">
            <button type="button" onClick={() => setShowCtx((o) => !o)} aria-expanded={showCtx} className="flex w-full items-center justify-between gap-2 text-left text-sm font-semibold">
              What I’m sending<ChevronDown size={15} className={`transition-transform ${showCtx ? 'rotate-180' : ''}`} /></button>
            <div className="mt-1"><Badge tone="illus">Calculated by MoneyBridge, not by the AI</Badge></div>
            {showCtx && <dl className="fade-in mt-3 divide-y divide-dashed divide-lilac-300 text-xs">{rows.map(([k, v]) => <div key={k} className="flex justify-between gap-3 py-1.5"><dt className="text-muted">{k}</dt><dd className="num text-right font-medium">{v}</dd></div>)}</dl>}
          </div>

          {busy && <div role="status" className="flex items-center gap-3 text-sm text-muted"><span className="flex gap-1" aria-hidden>{[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-lilac-600" style={{ animationDelay: `${i * 120}ms` }} />)}</span>Explaining your scenario…</div>}
          {!busy && reply?.error && <ErrorBox title="The AI couldn’t answer" message={friendlyError(reply.text, 'the explanation')} onRetry={ask} />}
          {!busy && reply && !reply.error && (
            <div data-testid="ai-reply" className="fade-in rounded-2xl bg-lilac-50 p-4 text-sm leading-relaxed"><Rich text={reply.text} />
              {reply.used?.length ? <div className="mt-3 flex items-center gap-1.5 border-t border-lilac-300/50 pt-2 text-xs text-muted">Used: <Badge tone="illus">Financial Twin results</Badge></div> : null}</div>)}
          {!busy && !reply && !twinContext && <p className="text-sm text-muted">Run a valid simulation first, then ask for an explanation.</p>}
        </div>

        <div className="space-y-2.5 border-t border-sand-200 p-4">
          <p className="text-2xs text-muted">Educational explanation of hypothetical results, not financial advice.</p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={ask} disabled={busy || !twinContext}><RefreshCw size={13} />Regenerate</Button>
            <Button variant="ai" size="sm" className="flex-1" onClick={() => { onClose(); nav('/companion') }}>Continue in AI Companion</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
