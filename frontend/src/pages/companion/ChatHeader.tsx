import { Plus, Sparkles } from 'lucide-react'
import { Button } from '../../components/ui'

/** Lilac avatar, the page's h1, and the single "New conversation" control. */
export default function ChatHeader({ onNew, disabled }: { onNew: () => void; disabled?: boolean }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-sand-200 px-4 sm:px-5">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lilac-300 text-forest-950"><Sparkles size={16} /></span>
        <div className="min-w-0 leading-tight"><h1 className="whitespace-nowrap text-[17px] font-semibold text-forest-900">AI Companion</h1><div className="text-xs text-muted">via Backboard</div></div>
      </div>
      <Button variant="secondary" size="sm" onClick={onNew} disabled={disabled} aria-label="New conversation" className="shrink-0"><Plus size={14} /><span className="sm:hidden">New</span><span className="hidden sm:inline">New conversation</span></Button>
    </header>
  )
}
