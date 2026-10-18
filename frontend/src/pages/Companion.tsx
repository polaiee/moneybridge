import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Brain, GitBranch, Send, Sparkles, Store, Trash2, User } from 'lucide-react'
import { api } from '../api'
import { Badge, Button, Card, ErrorBox, PageHeader } from '../components/ui'
import { useStore, type PendingAsk } from '../store'
import { goalLabel } from '../lib/roadmap'

interface MemoryRow { id: string; text: string }
function parseMemories(raw: unknown): MemoryRow[] {
  const arr = Array.isArray(raw) ? raw : (raw as { memories?: unknown[] })?.memories ?? []
  return (arr as Record<string, unknown>[]).map((m, i) => ({ id: String(m.id ?? i), text: String(m.content ?? m.memory ?? m.text ?? JSON.stringify(m)) }))
}
const CONTEXT_LABEL: Record<string, string> = { financial_twin_results: 'Financial Twin results', marketplace_comparison: 'Marketplace comparison' }

export default function Companion() {
  const { chat, setChat, threadId, setThreadId, memoryEnabled, setMemoryEnabled, shareProfile, setShareProfile, profile,
    twinContext, compareContext, pendingAsk, setPendingAsk, newConversation } = useStore()
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [memories, setMemories] = useState<MemoryRow[]>([])
  const [memErr, setMemErr] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  const loadMemories = useCallback(() => {
    api.memories().then((r) => { setMemories(parseMemories(r)); setMemErr(null) }).catch((e: Error) => setMemErr(e.message))
  }, [])
  useEffect(loadMemories, [loadMemories])
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [chat, busy])

  const send = useCallback(async (message: string, opts: { scenario?: boolean; compare?: boolean } = {}) => {
    const text = message.trim(); if (!text || busy) return
    setChat((c) => [...c, { role: 'user', text }]); setBusy(true)
    const profileLine = shareProfile && profile
      ? `\n\n[User-approved profile — goals: ${profile.goals.map(goalLabel).join(', ') || 'none'}; experience level: ${profile.level}; life stage: ${profile.stage}]` : ''
    try {
      const r = await api.chat({
        message: text + profileLine, thread_id: threadId, memory_enabled: memoryEnabled,
        scenario_results: opts.scenario && twinContext ? { inputs: twinContext.scenario, baseline_inputs: twinContext.baseline, results: twinContext.results } : undefined,
        compare: opts.compare && compareContext ? { a: compareContext.a, b: compareContext.b } : undefined,
      })
      setThreadId(r.thread_id)
      setChat((c) => [...c, { role: 'assistant', text: r.reply, contextUsed: r.context_used }])
      if (memoryEnabled) setTimeout(loadMemories, 2500)
    } catch (e) {
      setChat((c) => [...c, { role: 'assistant', error: true, text: `The assistant couldn’t answer (${(e as Error).message}). If the problem persists, start a new conversation.` }])
    } finally { setBusy(false) }
  }, [busy, shareProfile, profile, threadId, memoryEnabled, twinContext, compareContext, setChat, setThreadId, loadMemories])

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
        <Card className="flex min-h-[560px] flex-col !p-0">
          <div className="flex-1 space-y-4 overflow-y-auto p-5" style={{ maxHeight: '65vh' }} aria-live="polite">
            {chat.length === 0 && (
              <div className="py-6 text-center"><Sparkles className="mx-auto text-brand" />
                <h2 className="mt-2 text-lg font-semibold">How can I help?</h2><p className="mb-4 text-sm text-muted">Pick a starter or type your own question.</p>
                <div className="flex flex-wrap justify-center gap-2">{starters.map((s) => <button key={s.t} onClick={() => send(s.t, s.o)} className="rounded-full border border-line bg-white px-3 py-2 text-sm hover:border-brand hover:bg-brand-soft">{s.t}</button>)}</div>
              </div>)}
            {chat.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${m.role === 'user' ? 'bg-brand text-white' : 'bg-teal-soft text-teal-dark'}`}>{m.role === 'user' ? <User size={16} /> : <Sparkles size={16} />}</span>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${m.role === 'user' ? 'bg-brand text-white' : m.error ? 'bg-danger-soft text-danger' : 'bg-canvas'}`}>
                  <div className="whitespace-pre-wrap">{m.text}</div>
                  {m.role === 'assistant' && !m.error && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-line pt-2 text-xs text-muted">
                      {m.contextUsed?.length ? <>Used: {m.contextUsed.map((c) => <Badge key={c} tone="hypo">{CONTEXT_LABEL[c] ?? c}</Badge>)}</> : 'No app data attached to this answer'}
                      <span className="w-full">Educational explanation, not financial advice.</span></div>)}
                </div>
              </div>))}
            {busy && <div role="status" className="flex items-center gap-2 text-sm text-muted"><span className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />Thinking…</div>}
            <div ref={endRef} />
          </div>
          <form className="flex gap-2 border-t border-line p-3" onSubmit={(e) => { e.preventDefault(); const t = input; setInput(''); void send(t) }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a question…" aria-label="Message" className="min-w-0 flex-1 rounded-xl border border-line px-4 py-2.5" />
            <Button type="submit" disabled={busy || !input.trim()} aria-label="Send"><Send size={16} />Send</Button>
          </form>
        </Card>

        <div className="space-y-5">
          <Card>
            <h2 className="mb-3 font-semibold">Active context</h2>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-2"><GitBranch size={16} className="mt-0.5 shrink-0 text-brand" /><span><b>Twin scenario:</b> {twinContext ? <>ready · <Link to="/twin" className="text-brand-dark underline">view</Link></> : <>none yet · <Link to="/twin" className="text-brand-dark underline">open Twin</Link></>}</span></li>
              <li className="flex gap-2"><Store size={16} className="mt-0.5 shrink-0 text-brand" /><span><b>Product comparison:</b> {compareContext ? <>{compareContext.label} · <Link to="/marketplace" className="text-brand-dark underline">view</Link></> : <>none · <Link to="/marketplace" className="text-brand-dark underline">open Marketplace</Link></>}</span></li>
              <li className="flex gap-2"><User size={16} className="mt-0.5 shrink-0 text-brand" /><span><b>Your profile:</b> {shareProfile ? 'goals & level shared' : 'not shared'}</span></li>
            </ul>
            <p className="mt-3 text-xs text-muted">Twin and Marketplace data are attached only when you ask about them. Balances and account data are never sent.</p>
          </Card>
          <Card>
            <h2 className="mb-3 flex items-center gap-2 font-semibold"><Brain size={16} />Memory &amp; privacy</h2>
            <label className="flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={shareProfile} onChange={(e) => setShareProfile(e.target.checked)} />Share my goals and experience level</label>
            <label className="mt-2 flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={memoryEnabled} onChange={(e) => setMemoryEnabled(e.target.checked)} />Let Backboard remember learning context across conversations</label>
            <div className="mt-4 flex items-center justify-between"><h3 className="text-sm font-semibold">Retained memories</h3><button onClick={loadMemories} className="text-xs font-semibold text-brand-dark">Refresh</button></div>
            {memErr && <div className="mt-2"><ErrorBox message={`Couldn’t load memories (${memErr})`} /></div>}
            {!memErr && memories.length === 0 && <p className="mt-2 text-xs text-muted">{memoryEnabled ? 'Nothing retained yet. Memories appear after a few messages.' : 'Memory is off. Nothing is being retained.'}</p>}
            <ul className="mt-2 space-y-2">{memories.map((m) => (
              <li key={m.id} className="flex items-start justify-between gap-2 rounded-lg bg-canvas p-2 text-xs"><span>{m.text}</span>
                <button aria-label="Delete memory" onClick={() => delMemory(m.id)} className="text-muted hover:text-danger"><Trash2 size={14} /></button></li>))}</ul>
          </Card>
        </div>
      </div>
    </>
  )
}
