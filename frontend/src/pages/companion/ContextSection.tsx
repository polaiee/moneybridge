import { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import type { MemoryRow } from './memory'
import ContextPanel from './ContextPanel'
import MemoryCard from './MemoryCard'
import { useIncluded } from './useIncluded'

/**
 * Below 1024px: a collapsible "Context & memory" section under the chat header. Closed by default; the chip strip is always
 * visible and shows what is in use. Opens inline (not a modal or sheet) and pushes the thread down.
 */
export default function ContextSection({ memories, memErr, loadMemories, delMemory }: { memories: MemoryRow[] | null; memErr: string | null; loadMemories: () => void; delMemory: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const { items, memoryEnabled } = useIncluded()
  return (
    <div className="shrink-0 border-b border-sand-200 bg-ivory/60 lg:hidden" data-testid="context-section">
      <div className="flex items-center gap-2 px-4 py-2">
        <ul aria-label="In use" className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {items.length === 0 && <li className="rounded-full border border-dashed border-sand-300 px-2.5 py-0.5 text-xs text-muted">No app data</li>}
          {items.map((i) => <li key={i} className="inline-flex items-center gap-1 rounded-full border border-lilac-300 bg-lilac-100 px-2.5 py-0.5 text-xs font-medium text-lilac-800"><Check size={11} />{i}</li>)}
          {memoryEnabled && <li className="inline-flex items-center gap-1 rounded-full border border-forest-300 bg-forest-50 px-2.5 py-0.5 text-xs font-medium text-forest-800"><Check size={11} />Memory on</li>}
        </ul>
        <button type="button" aria-expanded={open} aria-controls="context-section-body" onClick={() => setOpen((o) => !o)}
          className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold text-forest-900 transition-colors hover:bg-forest-100">Context &amp; memory<ChevronDown size={14} className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} /></button>
      </div>
      {open && (
        <div id="context-section-body" className="fade-in max-h-[min(36dvh,300px)] space-y-5 overflow-y-auto border-t border-sand-200 bg-card px-4 py-4">
          <ContextPanel bare />
          <div className="border-t border-dashed border-sand-300 pt-4"><h2 className="mb-2 text-base font-semibold">Memory</h2><MemoryCard bare memories={memories} memErr={memErr} loadMemories={loadMemories} delMemory={delMemory} /></div>
        </div>)}
    </div>
  )
}
