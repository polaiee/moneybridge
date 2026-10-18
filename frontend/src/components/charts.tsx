import type { ReactNode } from 'react'

export const C = { blue: '#3676d8', blueDeep: '#234e98', teal: '#22a58a', tealDeep: '#146e5c', amber: '#d98a1c', violet: '#6a4fc0', grid: '#e6ebf3', axis: '#5b6780' }
export const AXIS = { fontSize: 11, fill: C.axis } as const

interface TipRow { label: string; value: string; color?: string; strong?: boolean }
/** Shared tooltip chrome: dark popover with color-keyed rows. */
export function TipBox({ title, rows, foot }: { title?: ReactNode; rows: TipRow[]; foot?: ReactNode }) {
  return (
    <div className="min-w-[160px] rounded-lg bg-slate-900 px-3 py-2.5 text-xs text-white shadow-pop">
      {title && <div className="mb-1.5 font-semibold text-slate-200">{title}</div>}
      <div className="space-y-1">{rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-slate-300">{r.color && <span className="h-2 w-2 rounded-sm" style={{ background: r.color }} />}{r.label}</span>
          <span className={`num ${r.strong ? 'font-semibold' : ''}`}>{r.value}</span></div>))}</div>
      {foot && <div className="mt-1.5 border-t border-slate-700 pt-1.5 text-slate-300">{foot}</div>}
    </div>
  )
}
