import type { ReactNode } from 'react'

export function NumField({ label, value, onChange, error, prefix, suffix, id, hint, compact }: { label: string; value: string; onChange: (v: string) => void; error?: string; prefix?: string; suffix?: string; id: string; hint?: ReactNode; compact?: boolean }) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-slate-700">{label}</label>
      <div className={`flex items-center rounded-xl border bg-card px-2.5 transition-shadow ${error ? 'border-coral-600' : 'border-sand-300 hover:border-forest-300'} focus-within:border-forest-600 focus-within:ring-2 focus-within:ring-forest-600/20`}>
        {prefix && <span className="mr-1 text-sm text-muted">{prefix}</span>}
        <input id={id} inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined} className={`num w-full min-w-0 bg-transparent text-sm outline-none ${compact ? 'h-9' : 'h-10'}`} />
        {suffix && <span className="ml-1 whitespace-nowrap text-xs text-muted">{suffix}</span>}
      </div>
      {error ? <p id={`${id}-err`} className="mt-1 text-xs text-coral-600">{error}</p> : hint && <p className="mt-1 text-2xs leading-snug text-muted">{hint}</p>}
    </div>
  )
}
