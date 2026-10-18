import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Info } from 'lucide-react'

export function Card({ children, className = '', tone = 'white' }: { children: ReactNode; className?: string; tone?: 'white' | 'brand' | 'teal' }) {
  const bg = tone === 'brand' ? 'bg-brand-soft/60' : tone === 'teal' ? 'bg-teal-soft' : 'bg-white'
  return <section className={`rounded-2xl border border-line ${bg} p-5 sm:p-6 shadow-[0_1px_2px_rgba(23,42,82,0.04)] ${className}`}>{children}</section>
}

export function SectionHead({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
      <div><h2 className="text-lg font-semibold text-ink">{title}</h2>{sub && <p className="text-sm text-muted">{sub}</p>}</div>
      {right}
    </div>
  )
}

const TONES = {
  demo: 'bg-teal-soft text-teal-dark border-teal/30',
  hypo: 'bg-brand-soft text-brand-dark border-brand/30',
  neutral: 'bg-canvas text-muted border-line',
  warn: 'bg-danger-soft text-danger border-danger/30',
} as const
export function Badge({ tone = 'neutral', children }: { tone?: keyof typeof TONES; children: ReactNode }) {
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${TONES[tone]}`}>{children}</span>
}
export const DemoBadge = () => <Badge tone="demo">Demo data</Badge>
export const HypoBadge = ({ children = 'Hypothetical' }: { children?: ReactNode }) => <Badge tone="hypo">{children}</Badge>

export function Button({ variant = 'primary', className = '', ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' }) {
  const v = variant === 'primary' ? 'bg-brand text-white hover:bg-brand-dark disabled:bg-brand/40'
    : variant === 'secondary' ? 'bg-white text-brand-dark border border-line hover:bg-brand-soft disabled:opacity-50'
    : 'text-brand-dark hover:bg-brand-soft disabled:opacity-50'
  return <button {...p} className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed ${v} ${className}`} />
}

export function Tip({ text, children }: { text: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex items-center gap-1">
      {children}
      <button type="button" aria-label={`What does this mean? ${text}`} onClick={() => setOpen((o) => !o)} onBlur={() => setOpen(false)}
        onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} className="text-muted hover:text-brand">
        <Info size={14} />
      </button>
      {open && <span role="tooltip" className="absolute left-0 top-full z-20 mt-1 w-60 rounded-lg border border-line bg-white p-2.5 text-xs font-normal leading-snug text-ink shadow-lg">{text}</span>}
    </span>
  )
}

export function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: ReactNode; tone?: 'pos' | 'neg' }) {
  return (
    <div>
      <div className="text-sm text-muted">{label}</div>
      <div className={`tabular text-2xl font-semibold sm:text-3xl ${tone === 'pos' ? 'text-teal-dark' : tone === 'neg' ? 'text-danger' : 'text-ink'}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  )
}

export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return <div role="status" className="flex items-center gap-2 p-6 text-sm text-muted"><span className="h-4 w-4 animate-spin rounded-full border-2 border-brand border-t-transparent" />{label}</div>
}
export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger">
      {message}{onRetry && <button onClick={onRetry} className="ml-3 font-semibold underline">Retry</button>}
    </div>
  )
}
export function PageHeader({ title, sub, right, eyebrow }: { title: string; sub?: string; right?: ReactNode; eyebrow?: string }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-teal-dark">{eyebrow}</div>}
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">{title}</h1>
        {sub && <p className="mt-1 max-w-2xl text-sm text-muted">{sub}</p>}
      </div>
      {right}
    </header>
  )
}

export const Logo = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
    <rect width="32" height="32" rx="9" fill="#eaf1fd" />
    <g fill="#3676d8"><circle cx="9" cy="9" r="2.6" /><circle cx="9" cy="23" r="2.6" /><circle cx="23" cy="9" r="2.6" /><circle cx="23" cy="23" r="2.6" /></g>
    <path d="M9 9v14M23 9v14M9 16h14" stroke="#3676d8" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
)
