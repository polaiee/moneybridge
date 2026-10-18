import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowDown } from 'lucide-react'
import type { ChatMsg } from '../../store'
import { prefersReducedMotion } from '../../lib/useCountUp'
import Message, { Avatar } from './Message'

/** Scrolling log of messages in a centered 720px column. Follows new messages unless the reader scrolled up ("Jump to latest"). */
export default function Thread({ messages, busy, onResend, onRetry }: {
  messages: ChatMsg[]; busy: boolean
  onResend: (text: string, ask?: ChatMsg['ask']) => void; onRetry: (index: number) => void
}) {
  const scroller = useRef<HTMLDivElement>(null)
  const nearBottom = useRef(true)
  const [showJump, setShowJump] = useState(false)
  const toBottom = (smooth: boolean) => { const el = scroller.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: smooth && !prefersReducedMotion() ? 'smooth' : 'auto' }) }
  useLayoutEffect(() => { toBottom(false) }, [])
  useEffect(() => { if (nearBottom.current) { toBottom(true); setShowJump(false) } else setShowJump(true) }, [messages, busy])
  const onScroll = () => { const el = scroller.current; if (!el) return; nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120; if (nearBottom.current) setShowJump(false) }

  return (
    <div className="relative min-h-0 flex-1">
      <div ref={scroller} onScroll={onScroll} role="log" aria-live="polite" aria-label="Conversation" className="absolute inset-0 overflow-y-auto">
        <div className="mx-auto w-full max-w-[720px] space-y-5 px-4 py-6 sm:px-6">
          {messages.map((m, i) => {
            const prev = messages[i - 1]
            return <div key={i} className="fade-in"><Message msg={m} busy={busy}
              onRegenerate={() => prev?.role === 'user' && onResend(prev.text, prev.ask)} onRetry={() => onRetry(i)} /></div>
          })}
          {busy && <div role="status" className="flex items-center gap-3 text-sm text-muted"><Avatar /><span className="flex gap-1" aria-hidden>{[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-lilac-600" style={{ animationDelay: `${i * 120}ms` }} />)}</span>Thinking…</div>}
        </div>
      </div>
      {showJump && <button type="button" onClick={() => { toBottom(true); setShowJump(false) }} className="fade-in absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-lilac-300 bg-card px-3.5 py-1.5 text-xs font-semibold text-lilac-800 shadow-md hover:bg-lilac-50"><ArrowDown size={13} />Jump to latest</button>}
    </div>
  )
}
