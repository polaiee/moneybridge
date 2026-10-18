import { Brain, RefreshCw, Trash2 } from 'lucide-react'
import { Badge, Card, EmptyState, ErrorBox, Eyebrow, Skeleton, Switch } from '../../components/ui'
import { friendlyError } from '../../lib/errors'
import { useStore } from '../../store'
import type { MemoryRow } from './memory'

/** Backboard memory: master switch, count, retained list with per-memory Delete, Refresh, and loading / error / empty states. */
export default function MemoryCard({ memories, memErr, loadMemories, delMemory, className = '', bare = false }: {
  memories: MemoryRow[] | null; memErr: string | null; loadMemories: () => void; delMemory: (id: string) => void; className?: string; bare?: boolean
}) {
  const { memoryEnabled, setMemoryEnabled } = useStore()
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0"><p className="text-sm">Let Backboard remember learning context across conversations</p>
          <p className="mt-1 text-xs text-muted">Only preferences and learning context you approve are retained. Balances and account data never are.</p></div>
        <Switch checked={memoryEnabled} onChange={setMemoryEnabled} label="Let Backboard remember learning context across conversations" />
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 border-t border-dashed border-sand-300 pt-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold">Retained memories{memories && <Badge tone="illus"><span data-testid="memory-count">{memories.length}</span></Badge>}</h3>
        <button type="button" onClick={loadMemories} className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-forest-800 transition-colors hover:bg-forest-50"><RefreshCw size={12} />Refresh</button>
      </div>
      {memErr && <div className="mt-2"><ErrorBox title="Memory unavailable" message={friendlyError(memErr, 'memories')} onRetry={loadMemories} /></div>}
      {!memErr && memories === null && <div role="status" aria-label="Loading memories" data-testid="memory-loading" className="mt-2 space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-3/4" /></div>}
      {!memErr && memories?.length === 0 && <div className="mt-2"><EmptyState title={memoryEnabled ? 'Nothing retained yet' : 'Memory is off'} text={memoryEnabled ? 'Approved learning context appears here after a few messages.' : 'Turn it on above to let Backboard remember your learning context. Nothing is retained now.'} /></div>}
      {!memErr && memories && memories.length > 0 && (
        <ul className="dashed-rows mt-1 max-h-60 overflow-y-auto pr-1" aria-label="Retained memories">
          {memories.map((m) => (
            <li key={m.id} className="fade-in flex items-start justify-between gap-2 py-2.5 text-xs"><span className="leading-snug">{m.text}</span>
              <button type="button" aria-label="Delete memory" onClick={() => delMemory(m.id)} className="shrink-0 rounded-full p-1 text-muted transition-colors hover:bg-coral-50 hover:text-coral-600"><Trash2 size={14} /></button></li>))}
        </ul>)}
    </>
  )
  if (bare) return <div className={className}>{body}</div>
  return (
    <Card className={className}>
      <Eyebrow className="mb-0.5 flex items-center gap-1.5"><Brain size={13} />Memory &amp; privacy</Eyebrow>
      <h2 className="mb-3 text-base font-semibold leading-tight">Memory</h2>
      {body}
    </Card>
  )
}
