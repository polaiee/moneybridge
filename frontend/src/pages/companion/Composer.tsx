import { useEffect, useRef, useState } from 'react'
import { Check, GitBranch, Plus, SendHorizontal, Store, UserRound, X } from 'lucide-react'
import { useStore } from '../../store'

function Chip({ on, onClick, icon, label, off }: { on: boolean; onClick: () => void; icon: React.ReactNode; label: string; off: string }) {
  return (
    <button type="button" aria-pressed={on} aria-label={on ? `${label}: attached. Click to detach` : `Attach ${label}`} onClick={onClick}
      className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium transition-colors ${on ? 'border-lilac-300 bg-lilac-100 text-lilac-800 hover:bg-lilac-300/50' : 'border-dashed border-sand-300 text-muted hover:border-lilac-300 hover:text-lilac-800'}`}>
      {on ? <Check size={12} /> : <Plus size={12} />}{icon}{on ? label : off}{on && <X size={12} className="opacity-60" />}
    </button>)
}

/** Large rounded composer: attached-context chips, auto-growing textarea (Enter sends, Shift+Enter newline), round lilac Send. */
export default function Composer({ busy, onSend }: { busy: boolean; onSend: (text: string, opts: { scenario: boolean; compare: boolean }) => void }) {
  const { shareProfile, setShareProfile, twinContext, compareContext, attachTwin, setAttachTwin, attachCompare, setAttachCompare } = useStore()
  const [text, setText] = useState('')
  const ta = useRef<HTMLTextAreaElement>(null)
  useEffect(() => { const el = ta.current; if (!el) return; el.style.height = 'auto'; el.style.height = `${Math.min(el.scrollHeight, 144)}px` }, [text])
  const send = () => {
    const t = text.trim(); if (!t || busy) return
    onSend(t, { scenario: attachTwin && !!twinContext, compare: attachCompare && !!compareContext })
    setText(''); ta.current?.focus()
  }
  return (
    <div className="mx-auto w-full max-w-[720px] shrink-0 px-4 pb-3 sm:px-6">
      <div className="rounded-[28px] border border-sand-300 bg-card p-3 shadow-md transition-shadow focus-within:border-lilac-600 focus-within:ring-2 focus-within:ring-lilac-600/25">
        <div className="mb-2 flex flex-wrap gap-1.5" role="group" aria-label="Attached context">
          <Chip on={shareProfile} onClick={() => setShareProfile(!shareProfile)} icon={<UserRound size={12} />} label="Profile" off="Share profile" />
          {twinContext && <Chip on={attachTwin} onClick={() => setAttachTwin(!attachTwin)} icon={<GitBranch size={12} />} label="Twin results" off="Twin results" />}
          {compareContext && <Chip on={attachCompare} onClick={() => setAttachCompare(!attachCompare)} icon={<Store size={12} />} label="Marketplace comparison" off="Marketplace comparison" />}
        </div>
        <textarea ref={ta} rows={1} value={text} onChange={(e) => setText(e.target.value)} aria-label="Message" placeholder="Ask about your scenario, a product, or a money concept…"
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send() } }}
          className="block max-h-36 min-h-[28px] w-full resize-none bg-transparent px-1 text-sm leading-6 outline-none placeholder:text-muted" />
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-2xs text-muted">Answers use only numbers MoneyBridge calculated</span>
          <button type="button" aria-label="Send" onClick={send} disabled={busy || !text.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-lilac-300 text-forest-950 shadow-sm transition-all hover:bg-[#c6b8ec] active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100"><SendHorizontal size={18} /></button>
        </div>
      </div>
      <p className="mt-2 text-center text-[11px] text-muted">Educational only, not financial advice. All figures are demo data.</p>
    </div>
  )
}
