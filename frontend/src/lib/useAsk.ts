import { useCallback, useState } from 'react'
import { api } from '../api'
import { useStore, type ChatMsg } from '../store'
import { goalLabel } from './roadmap'
import { friendlyError } from './errors'

/**
 * The one code path that sends a question to the AI (POST /api/chat).
 * Used by the AI Companion page and the Twin's AI panel, so both share the same thread, memory and share-profile settings.
 */
export function useAsk(onSent?: () => void) {
  const { shareProfile, profile, threadId, setThreadId, memoryEnabled, twinContext, compareContext, setChat } = useStore()
  const [busy, setBusy] = useState(false)
  const send = useCallback(async (message: string, opts: { scenario?: boolean; compare?: boolean } = {}): Promise<ChatMsg | null> => {
    const text = message.trim(); if (!text || busy) return null
    setChat((c) => [...c, { role: 'user', text, ask: { scenario: !!opts.scenario, compare: !!opts.compare } }]); setBusy(true)
    const profileLine = shareProfile && profile
      ? `\n\n[User-approved profile — goals: ${profile.goals.map(goalLabel).join(', ') || 'none'}; experience level: ${profile.level}; life stage: ${profile.stage}]` : ''
    let reply: ChatMsg
    try {
      const r = await api.chat({
        message: text + profileLine, thread_id: threadId, memory_enabled: memoryEnabled,
        scenario_results: opts.scenario && twinContext ? { inputs: twinContext.scenario, baseline_inputs: twinContext.baseline, results: twinContext.results } : undefined,
        compare: opts.compare && compareContext ? { a: compareContext.a, b: compareContext.b } : undefined,
      })
      setThreadId(r.thread_id)
      reply = { role: 'assistant', text: r.reply, contextUsed: r.context_used }
      onSent?.()
    } catch (e) {
      reply = { role: 'assistant', error: true, text: `${friendlyError((e as Error).message, 'an answer')} If the problem persists, start a new conversation.` }
    } finally { setBusy(false) }
    setChat((c) => [...c, reply])
    return reply
  }, [busy, shareProfile, profile, threadId, memoryEnabled, twinContext, compareContext, setChat, setThreadId, onSent])
  return { send, busy }
}
