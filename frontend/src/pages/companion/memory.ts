export interface MemoryRow { id: string; text: string }

/** Backboard's memory list, normalised to {id, text}. */
export function parseMemories(raw: unknown): MemoryRow[] {
  const arr = Array.isArray(raw) ? raw : (raw as { memories?: unknown[] })?.memories ?? []
  return (arr as Record<string, unknown>[]).map((m, i) => ({ id: String(m.id ?? i), text: String(m.content ?? m.memory ?? m.text ?? JSON.stringify(m)) }))
}
