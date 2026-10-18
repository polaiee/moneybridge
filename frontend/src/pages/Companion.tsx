import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Brain, GitBranch, Send, Sparkles, Store, Trash2, User } from 'lucide-react'
import { api } from '../api'
import { Badge, Button, Card, EmptyState, ErrorBox, Eyebrow, PageHeader } from '../components/ui'
import { friendlyError } from '../lib/errors'
import { useAsk } from '../lib/useAsk'
import Rich from '../components/Rich'
import { useStore, type PendingAsk } from '../store'

interface MemoryRow { id: string; text: string }
function parseMemories(raw: unknown): MemoryRow[] {
  const arr = Array.isArray(raw) ? raw : (raw as { memories?: unknown[] })?.memories ?? []
  return (arr as Record<string, unknown>[]).map((m, i) => ({ id: String(m.id ?? i), text: String(m.content ?? m.memory ?? m.text ?? JSON.stringify(m)) }))
}
const CONTEXT_LABEL: Record<string, string> = { financial_twin_results: 'Financial Twin results', marketplace_comparison: 'Marketplace comparison' }

export default function Companion() {
  const { chat, memoryEnabled, setMemoryEnabled, shareProfile, setShareProfile,
    twinContext, compareContext, pendingAsk, setPendingAsk, newConversation } = useStore()
  const [input, setInput] = useState('')
  const [memories, setMemories] = useState<MemoryRow[]>([])
  const [memErr, setMemErr] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  const loadMemories = useCallback(() => {
    api.memories().then((r) => { setMemories(parseMemories(r)); setMemErr(null) }).catch((e: Error) => setMemErr(e.message))
  }, [])
  useEffect(loadMemories, [loadMemories])
  const { send, busy } = useAsk(useCallback(() => { if (memoryEnabled) setTimeout(loadMemories, 2500) }, [memoryEnabled, loadMemories]))
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [chat, busy])

  // Requests handed over from the Twin / Marketplace run once on arrival.
  const consumed = useRef<PendingAsk | null>(null)
  useEffect(() => {
    if (!pendingAsk || consumed.current === pendingAsk) return
    consumed.current = pendingAsk
    setPendingAsk(null)
    void send(pendingAsk.message, { scenario: pendingAsk.scenario, compare: pendingAsk.compare })
  }, [pendingAsk, send, setPendingAsk])

  const delMemory = (id: string) => api.deleteMemory(id).then(loadMemories).catch((e: Error) => setMemErr(e.message))
  const starters = [
    ...(twinContext ? [{ t: 'Explain my current Financial Twin scenario', o: { scenario: true } }] : []),
    ...(compareContext ? [{ t: `Explain the comparison: ${compareContext.label}`, o: { compare: true } }] : []),
    { t: 'What is an ETF expense ratio and why does it matter?', o: {} },
    { t: 'What does diversification mean?', o: {} },
    { t: 'How does compounding work, in simple terms?', o: {} },
  ]

  return (
    <>
      <PageHeader title="AI Companion" eyebrow="Powered by Backboard" sub="Ask about your scenarios and products. The assistant explains the app’s calculated numbers and never invents its own." right={<Button variant="secondary" onClick={newConversation}>New conversation</Button>} />
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Card className="flex min-h-[560px] flex-col overflow-hidden !p-0">
          <div className="flex-1 space-y-4 overflow-y-auto p-5" style={{ maxHeight: '65vh' }} aria-live="polite" aria-label="Conversation">
            {chat.length === 0 && (
              <div className="py-8 text-center"><span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 text-white"><Sparkles size={20} /></span>
                <h2 className="mt-3 text-lg font-semibold">How can I help?</h2><p className="mb-4 text-sm text-muted">Pick a starter or type your own question. Answers use only numbers calculated by the app.</p>
                <div className="flex flex-wrap justify-center gap-2">{starters.map((s) => <button key={s.t} onClick={() => send(s.t, s.o)} className="rounded-full border border-line bg-white px-3 py-1.5 text-sm shadow-xs transition-all hover:border-blue-300 hover:bg-blue-50 active:scale-[0.98]">{s.t}</button>)}</div>
              </div>)}
            {chat.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${m.role === 'user' ? 'bg-brand text-white' : 'bg-teal-soft text-teal-dark'}`}>{m.role === 'user' ? <User size={16} /> : <Sparkles size={16} />}</span>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === 'user' ? 'rounded-tr-md bg-brand text-white' : m.error ? 'rounded-tl-md border border-danger/25 bg-red-50 text-slate-800' : 'rounded-tl-md bg-slate-100'}`}>
                  {m.role === 'user' ? <div className="whitespace-pre-wrap">{m.text}</div> : <Rich text={m.text} />}
                  {m.role === 'assistant' && !m.error && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-line pt-2 text-xs text-muted">
                      {m.contextUsed?.length ? <>Used: {m.contextUsed.map((c) => <Badge key={c} tone="hypo">{CONTEXT_LABEL[c] ?? c}</Badge>)}</> : 'No app data attached to this answer'}
                      <span className="w-full">Educational explanation, not financial advice.</span></div>)}
                </div>
              </div>))}
            {busy && <div role="status" className="flex items-center gap-3 text-sm text-muted"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 text-teal-700"><Sparkles size={16} /></span><span className="flex gap-1" aria-hidden>{[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" style={{ animationDelay: `${i * 120}ms` }} />)}</span>Thinking…</div>}
            <div ref={endRef} />
          </div>
          <form className="flex gap-2 border-t border-line bg-white p-3" onSubmit={(e) => { e.preventDefault(); const t = input; setInput(''); void send(t) }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a question…" aria-label="Message" className="h-10 min-w-0 flex-1 rounded-lg border border-line bg-white px-3.5 text-sm outline-none transition-shadow hover:border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/25" />
            <Button type="submit" disabled={busy || !input.trim()} aria-label="Send"><Send size={16} />Send</Button>
          </form>
        </Card>

        <div className="space-y-5">
          <Card>
            <Eyebrow className="mb-3">Active context</Eyebrow>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-2"><GitBranch size={16} className="mt-0.5 shrink-0 text-brand" /><span><b>Twin scenario:</b> {twinContext ? <>ready · <Link to="/twin" className="text-brand-dark underline">view</Link></> : <>none yet · <Link to="/twin" className="text-brand-dark underline">open Twin</Link></>}</span></li>
              <li className="flex gap-2"><Store size={16} className="mt-0.5 shrink-0 text-brand" /><span><b>Product comparison:</b> {compareContext ? <>{compareContext.label} · <Link to="/marketplace" className="text-brand-dark underline">view</Link></> : <>none · <Link to="/marketplace" className="text-brand-dark underline">open Marketplace</Link></>}</span></li>
              <li className="flex gap-2"><User size={16} className="mt-0.5 shrink-0 text-brand" /><span><b>Your profile:</b> {shareProfile ? 'goals & level shared' : 'not shared'}</span></li>
            </ul>
            <p className="mt-3 text-xs text-muted">Twin and Marketplace data are attached only when you ask about them. Balances and account data are never sent.</p>
          </Card>
          <Card>
            <Eyebrow className="mb-3 flex items-center gap-1.5"><Brain size={13} />Memory &amp; privacy</Eyebrow>
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={shareProfile} onChange={(e) => setShareProfile(e.target.checked)} />Share my goals and experience level</label>
            <label className="mt-2 flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={memoryEnabled} onChange={(e) => setMemoryEnabled(e.target.checked)} />Let Backboard remember learning context across conversations</label>
            <div className="mt-4 flex items-center justify-between"><h3 className="text-sm font-semibold">Retained memories</h3><button onClick={loadMemories} className="text-xs font-semibold text-brand-dark">Refresh</button></div>
            {memErr && <div className="mt-2"><ErrorBox title="Memory unavailable" message={friendlyError(memErr, 'memories')} onRetry={loadMemories} /></div>}
            {!memErr && memories.length === 0 && <div className="mt-2"><EmptyState title={memoryEnabled ? 'Nothing retained yet' : 'Memory is off'} text={memoryEnabled ? 'Approved learning context appears here after a few messages.' : 'Turn it on above to let Backboard remember your learning context. Nothing is retained now.'} /></div>}
            <ul className="mt-2 space-y-2">{memories.map((m) => (
              <li key={m.id} className="fade-in flex items-start justify-between gap-2 rounded-lg border border-line bg-slate-25 p-2 text-xs"><span>{m.text}</span>
                <button aria-label="Delete memory" onClick={() => delMemory(m.id)} className="rounded p-0.5 text-muted transition-colors hover:bg-red-50 hover:text-danger"><Trash2 size={14} /></button></li>))}</ul>
          </Card>
        </div>
      </div>
    </>
  )
}
