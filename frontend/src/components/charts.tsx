import type { ReactNode } from 'react'

export const C = { forest: '#173b37', forest2: '#285c55', sage: '#668d81', lime: '#c8ea54', limeDeep: '#6b8316', coral: '#e07a5f', lilac: '#b6a5e4',
  // legacy keys used by pages not yet redesigned, mapped onto the new palette
  blue: '#285c55', blueDeep: '#173b37', teal: '#8fae1f', tealDeep: '#6b8316', amber: '#d98a1c', violet: '#6b55b5', grid: '#e2dece', axis: '#5b6659' }
export const AXIS = { fontSize: 11, fill: C.axis } as const

interface TipRow { label: string; value: string; color?: string; strong?: boolean }
/** Shared tooltip chrome: dark popover with color-keyed rows. */
export function TipBox({ title, rows, foot }: { title?: ReactNode; rows: TipRow[]; foot?: ReactNode }) {
  return (
    <div className="min-w-[160px] rounded-xl bg-forest-950 px-3 py-2.5 text-xs text-white shadow-pop">
      {title && <div className="mb-1.5 font-semibold text-slate-200">{title}</div>}
      <div className="space-y-1">{rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-slate-300">{r.color && <span className="h-2 w-2 rounded-sm" style={{ background: r.color }} />}{r.label}</span>
          <span className={`num ${r.strong ? 'font-semibold' : ''}`}>{r.value}</span></div>))}</div>
      {foot && <div className="mt-1.5 border-t border-slate-700 pt-1.5 text-slate-300">{foot}</div>}
    </div>
  )
}
