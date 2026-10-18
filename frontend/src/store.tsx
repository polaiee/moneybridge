import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Goal, Level, Stage } from './lib/roadmap'
import type { Scenario, SimResult } from './api'

export interface Profile { name: string; stage: Stage; level: Level; goals: Goal[]; dataSetup: 'demo' }
export interface ChatMsg { role: 'user' | 'assistant'; text: string; contextUsed?: string[]; error?: boolean }
export interface TwinContext { scenario: Scenario; baseline: Scenario; results: SimResult }
export interface CompareContext { a: string; b: string; label: string }
/** A request handed to the AI Companion from another page. */
export interface PendingAsk { message: string; scenario?: boolean; compare?: boolean }

interface Store {
  profile: Profile | null
  setProfile: (p: Profile | null) => void
  chat: ChatMsg[]
  setChat: (fn: (c: ChatMsg[]) => ChatMsg[]) => void
  threadId: string | null
  setThreadId: (t: string | null) => void
  memoryEnabled: boolean
  setMemoryEnabled: (b: boolean) => void
  shareProfile: boolean
  setShareProfile: (b: boolean) => void
  twinContext: TwinContext | null
  setTwinContext: (c: TwinContext | null) => void
  compareContext: CompareContext | null
  setCompareContext: (c: CompareContext | null) => void
  pendingAsk: PendingAsk | null
  setPendingAsk: (p: PendingAsk | null) => void
  newConversation: () => void
}

const Ctx = createContext<Store | null>(null)
export const useStore = () => { const s = useContext(Ctx); if (!s) throw new Error('store'); return s }

function persisted<T>(key: string, initial: T) {
  return function usePersisted(): [T, (v: T) => void] {
    const [v, setV] = useState<T>(() => {
      try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : initial } catch { return initial }
    })
    const set = useCallback((n: T) => { setV(n); try { localStorage.setItem(key, JSON.stringify(n)) } catch { /* ignore */ } }, [])
    return [v, set]
  }
}
const useProfile = persisted<Profile | null>('mb.profile', null)
const useChatStore = persisted<ChatMsg[]>('mb.chat', [])
const useThread = persisted<string | null>('mb.thread', null)
const useMem = persisted<boolean>('mb.memory', false)
const useShare = persisted<boolean>('mb.shareProfile', false)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useProfile()
  const [chat, setChatRaw] = useChatStore()
  const [threadId, setThreadId] = useThread()
  const [memoryEnabled, setMemoryEnabled] = useMem()
  const [shareProfile, setShareProfile] = useShare()
  const [twinContext, setTwinContext] = useState<TwinContext | null>(null)
  const [compareContext, setCompareContext] = useState<CompareContext | null>(null)
  const [pendingAsk, setPendingAsk] = useState<PendingAsk | null>(null)

  // setChat accepts an updater; keep a ref-free implementation via functional state on the raw value.
  const [chatLive, setChatLive] = useState(chat)
  useEffect(() => { setChatRaw(chatLive) }, [chatLive, setChatRaw])
  const setChat = useCallback((fn: (c: ChatMsg[]) => ChatMsg[]) => setChatLive((c) => fn(c)), [])
  const newConversation = useCallback(() => { setChatLive([]); setThreadId(null) }, [setThreadId])

  const value = useMemo<Store>(() => ({
    profile, setProfile, chat: chatLive, setChat, threadId, setThreadId, memoryEnabled, setMemoryEnabled,
    shareProfile, setShareProfile, twinContext, setTwinContext, compareContext, setCompareContext,
    pendingAsk, setPendingAsk, newConversation,
  }), [profile, setProfile, chatLive, setChat, threadId, setThreadId, memoryEnabled, setMemoryEnabled, shareProfile, setShareProfile, twinContext, compareContext, pendingAsk, newConversation])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
