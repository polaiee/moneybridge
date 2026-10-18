import type { ReactNode } from 'react'

type Block =
  | { kind: 'heading'; text: string }
  | { kind: 'para'; text: string }
  | { kind: 'list'; ordered: boolean; items: { marker: string; text: string }[] }

const MARKER_ONLY = /^\s*(?:[-*•]|\d+[.)])\s*$/
const ITEM = /^\s*(?:(\d+)[.)]|[-*•])\s+(.*\S.*)$/
const HEADING = /^\s*#{1,6}\s+(.*\S.*?)\s*#*\s*$/

/** Joins a bullet or number that the model put on its own line with the text on the next line. */
function mergeLoneMarkers(lines: string[]): string[] {
  const out: string[] = []
  for (let i = 0; i < lines.length; i++) {
    if (MARKER_ONLY.test(lines[i])) {
      let j = i + 1
      while (j < lines.length && !lines[j].trim()) j++
      if (j < lines.length && !MARKER_ONLY.test(lines[j]) && !HEADING.test(lines[j])) { out.push(`${lines[i].trim()} ${lines[j].trim()}`); i = j; continue }
      continue // dangling marker with nothing after it
    }
    out.push(lines[i])
  }
  return out
}

function parse(text: string): Block[] {
  const blocks: Block[] = []
  for (const line of mergeLoneMarkers(text.split('\n'))) {
    if (!line.trim()) continue
    const h = line.match(HEADING)
    if (h) { blocks.push({ kind: 'heading', text: h[1] }); continue }
    const m = line.match(ITEM)
    if (m) {
      const ordered = !!m[1], last = blocks[blocks.length - 1]
      const item = { marker: ordered ? `${m[1]}.` : '•', text: m[2] }
      if (last?.kind === 'list' && last.ordered === ordered) last.items.push(item); else blocks.push({ kind: 'list', ordered, items: [item] })
      continue
    }
    blocks.push({ kind: 'para', text: line.trim() })
  }
  return blocks
}

/** **bold** only; everything else is rendered as plain text (no HTML injection). */
function inline(t: string): ReactNode[] {
  return t.split(/(\*\*[^*]+\*\*)/g).map((part, i) => part.startsWith('**') && part.endsWith('**') && part.length > 4 ? <strong key={i}>{part.slice(2, -2)}</strong> : <span key={i}>{part}</span>)
}

/**
 * Safe renderer for the model's markdown subset: `#`–`######` headings as bold subheadings, bullet and numbered
 * lists as real list items (marker and text on one line), `**bold**`, paragraphs. Shared by the AI panel and the Companion.
 */
export default function Rich({ text }: { text: string }) {
  return (
    <div className="space-y-2">
      {parse(text).map((b, i) => {
        if (b.kind === 'heading') return <h4 key={i} className="pt-1 font-semibold leading-snug text-forest-900 first:pt-0">{inline(b.text)}</h4>
        if (b.kind === 'para') return <p key={i}>{inline(b.text)}</p>
        const List = b.ordered ? 'ol' : 'ul'
        return (
          <List key={i} className="space-y-1">
            {b.items.map((it, k) => (
              <li key={k} className="flex items-baseline gap-2 pl-1"><span aria-hidden className="num w-5 shrink-0 text-right text-muted">{it.marker}</span><span className="min-w-0 flex-1">{inline(it.text)}</span></li>))}
          </List>)
      })}
    </div>
  )
}
