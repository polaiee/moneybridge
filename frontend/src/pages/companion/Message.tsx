import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, Copy, RefreshCw, Sparkles } from 'lucide-react'
import { Badge, Button } from '../../components/ui'
import Rich from '../../components/Rich'
import type { ChatMsg } from '../../store'

const CONTEXT_LABEL: Record<string, string> = { financial_twin_results: 'Financial Twin results', marketplace_comparison: 'Marketplace comparison' }

export const Avatar = () => <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lilac-300 text-forest-950" aria-hidden><Sparkles size={16} /></span>

function IconBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled} className="flex h-7 w-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-lilac-100 hover:text-lilac-800 disabled:opacity-40">{children}</button>
}

/** One chat turn. User: forest bubble, right. Assistant: lilac surface with Used: badges, links back, Copy, Regenerate; or an error with Retry. */
export default function Message({ msg, busy, onRegenerate, onRetry }: { msg: ChatMsg; busy: boolean; onRegenerate: () => void; onRetry: () => void }) {
  const [copied, setCopied] = useState(false)
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end" data-msg="user">
        <div className="max-w-[80%] whitespace-pre-wrap rounded-[20px] rounded-tr-md bg-forest-900 px-4 py-2.5 text-sm leading-relaxed text-ivory">{msg.text}</div>
      </div>)
  }
  const copy = async () => { try { await navigator.clipboard.writeText(msg.text); setCopied(true); setTimeout(() => setCopied(false), 1600) } catch { /* clipboard unavailable */ } }
  const used = msg.contextUsed ?? []
  if (msg.error) {
    return (
      <div className="flex items-start gap-3" data-msg="assistant" data-error>
        <Avatar />
        <div role="alert" className="max-w-[88%] rounded-[20px] rounded-tl-md border border-coral-500/30 bg-coral-50 px-4 py-3 text-sm leading-relaxed text-slate-800">
          <p>{msg.text}</p>
          <Button variant="secondary" size="sm" className="mt-2" onClick={onRetry} disabled={busy}><RefreshCw size={13} />Retry</Button>
        </div>
      </div>)
  }
  return (
    <div className="flex items-start gap-3" data-msg="assistant">
      <Avatar />
      <div className="min-w-0 max-w-[88%] rounded-[20px] rounded-tl-md border border-lilac-100 bg-lilac-50 px-4 py-3 text-sm leading-relaxed">
        <Rich text={msg.text} />
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 border-t border-dashed border-lilac-300/70 pt-2 text-xs text-muted">
          {used.length > 0 ? <span className="flex flex-wrap items-center gap-1.5">Used: {used.map((u) => <Badge key={u} tone="illus">{CONTEXT_LABEL[u] ?? u}</Badge>)}</span> : <span>No app data attached to this answer</span>}
          {used.includes('financial_twin_results') && <Link to="/twin" className="inline-flex items-center gap-1 font-semibold text-lilac-800 hover:underline">Back to Twin<ArrowRight size={12} /></Link>}
          {used.includes('marketplace_comparison') && <Link to="/marketplace" className="inline-flex items-center gap-1 font-semibold text-lilac-800 hover:underline">Back to Marketplace<ArrowRight size={12} /></Link>}
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <span className="text-[11px] text-muted">Educational explanation, not financial advice.</span>
          <span className="flex items-center gap-0.5">
            <IconBtn label={copied ? 'Copied' : 'Copy answer'} onClick={copy}>{copied ? <Check size={14} /> : <Copy size={14} />}</IconBtn>
            <IconBtn label="Regenerate answer" onClick={onRegenerate} disabled={busy}><RefreshCw size={14} /></IconBtn>
          </span>
        </div>
      </div>
    </div>)
}
