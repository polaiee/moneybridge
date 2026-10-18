import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api'
import { Card } from '../components/ui'
import { useAsk } from '../lib/useAsk'
import { useStore, type ChatMsg, type PendingAsk } from '../store'
import ChatHeader from './companion/ChatHeader'
import Composer from './companion/Composer'
import ContextPanel from './companion/ContextPanel'
import ContextSection from './companion/ContextSection'
import MemoryCard from './companion/MemoryCard'
import { parseMemories, type MemoryRow } from './companion/memory'
import Thread from './companion/Thread'
import Welcome from './companion/Welcome'

/**
 * Focused conversation space. On desktop the page does not scroll: the thread scrolls inside the chat column.
 * Chat: header → (context section, <1024px) → welcome or thread → composer (centered 720px). ≥1024px the context and memory cards sit to the right.
 */
export default function Companion() {
  const { chat, setChat, memoryEnabled, profile, twinContext, compareContext, pendingAsk, setPendingAsk, newConversation } = useStore()
  const [memories, setMemories] = useState<MemoryRow[] | null>(null) // null = still loading
  const [memErr, setMemErr] = useState<string | null>(null)

  const loadMemories = useCallback(() => {
    api.memories().then((r) => { setMemories(parseMemories(r)); setMemErr(null) }).catch((e: Error) => setMemErr(e.message))
  }, [])
  useEffect(loadMemories, [loadMemories])
  const delMemory = (id: string) => api.deleteMemory(id).then(loadMemories).catch((e: Error) => setMemErr(e.message))

  const { send, busy } = useAsk(useCallback(() => { if (memoryEnabled) setTimeout(loadMemories, 2500) }, [memoryEnabled, loadMemories]))

  // Requests handed over from the Marketplace run once on arrival.
  const consumed = useRef<PendingAsk | null>(null)
  useEffect(() => {
    if (!pendingAsk || consumed.current === pendingAsk) return
    consumed.current = pendingAsk
    setPendingAsk(null)
    void send(pendingAsk.message, { scenario: pendingAsk.scenario, compare: pendingAsk.compare })
  }, [pendingAsk, send, setPendingAsk])

  // Retry: drop the failed turn (question + error) and ask again the same way.
  const retry = (i: number) => {
    const q = chat[i - 1]; if (q?.role !== 'user') return
    setChat((c) => c.filter((_, k) => k !== i && k !== i - 1))
    void send(q.text, q.ask)
  }
  const onResend = (text: string, ask?: ChatMsg['ask']) => void send(text, ask)

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <Card className="relative flex h-[calc(100dvh-172px)] min-h-[480px] flex-col overflow-hidden bg-gradient-to-b from-lilac-50/70 to-card !p-0 md:h-[calc(100dvh-116px)] md:min-h-[560px] lg:col-span-7 xl:col-span-8">
        <ChatHeader onNew={newConversation} disabled={busy} />
        <ContextSection memories={memories} memErr={memErr} loadMemories={loadMemories} delMemory={delMemory} />
        {chat.length === 0
          ? <div className="min-h-0 flex-1 overflow-y-auto"><Welcome name={profile?.name} goals={profile?.goals ?? []} twin={twinContext} compare={compareContext} onAsk={(t, o) => void send(t, o)} disabled={busy} /></div>
          : <Thread messages={chat} busy={busy} onResend={onResend} onRetry={retry} />}
        <Composer busy={busy} onSend={(t, o) => void send(t, o)} />
      </Card>
      <aside className="hidden space-y-4 lg:col-span-5 lg:block lg:h-[calc(100dvh-116px)] lg:overflow-y-auto xl:col-span-4" aria-label="Context and memory">
        <ContextPanel />
        <MemoryCard memories={memories} memErr={memErr} loadMemories={loadMemories} delMemory={delMemory} />
      </aside>
    </div>
  )
}
