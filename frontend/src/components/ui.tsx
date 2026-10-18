import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { AlertTriangle, Info, RefreshCw } from 'lucide-react'
import { useCountUp } from '../lib/useCountUp'
import { usd } from '../lib/format'

/* ───────── Card: soft, rounded bento surface ───────── */
export function Card({ children, className = '', tone = 'white' }: { children: ReactNode; className?: string; tone?: 'white' | 'brand' | 'teal' | 'dark' | 'lime' | 'sage' }) {
  const t = {
    white: 'bg-card border-line text-ink',
    brand: 'bg-forest-50 border-forest-100 text-ink',
    teal: 'bg-forest-50 border-forest-100 text-ink',
    sage: 'bg-forest-100/60 border-forest-100 text-ink',
    lime: 'bg-lime-100 border-lime-200 text-forest-900',
    dark: 'on-dark bg-forest-900 border-forest-800 text-ivory shadow-md',
  }[tone]
  return <section className={`rounded-[20px] border p-4 sm:p-5 ${tone === 'dark' ? '' : 'shadow-xs'} ${t} ${className}`}>{children}</section>
}

export const Eyebrow = ({ children, className = '' }: { children: ReactNode; className?: string }) => <div className={`eyebrow ${className}`}>{children}</div>

export function SectionHead({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
      <div><h2 className="text-lg font-semibold leading-tight text-ink">{title}</h2>{sub && <p className="mt-0.5 text-sm text-muted">{sub}</p>}</div>
      {right}
    </div>
  )
}

/* ───────── Labels: restyled but always visible ───────── */
const TONES = {
  demo: 'bg-lime-100 text-forest-900 border-lime-300',
  hypo: 'bg-forest-100 text-forest-900 border-forest-200',
  illus: 'bg-lilac-50 text-lilac-800 border-lilac-300/60',
  neutral: 'bg-sand-100 text-slate-600 border-sand-200',
  warn: 'bg-coral-50 text-coral-600 border-coral-500/30',
} as const
const DOT = { demo: 'bg-lime-600', hypo: 'bg-forest-500', illus: 'bg-lilac-600', neutral: 'bg-sand-400', warn: 'bg-coral-600' } as const
export function Badge({ tone = 'neutral', children, dark = false }: { tone?: keyof typeof TONES; children: ReactNode; dark?: boolean }) {
  const cls = dark ? 'border-lime-400/50 bg-lime-400/15 text-lime-200' : TONES[tone]
  return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-2xs font-semibold leading-4 ${cls}`}><span aria-hidden className={`h-1.5 w-1.5 rounded-full ${dark ? 'bg-lime-400' : DOT[tone]}`} />{children}</span>
}
export const DemoBadge = ({ dark = false }: { dark?: boolean }) => <Badge tone="demo" dark={dark}>Demo data</Badge>
export const HypoBadge = ({ children = 'Hypothetical' }: { children?: ReactNode }) => <Badge tone="hypo">{children}</Badge>
export const IllusBadge = ({ children = 'Illustrative' }: { children?: ReactNode }) => <Badge tone="illus">{children}</Badge>

/* ───────── Buttons: pill, with hover and pressed states ───────── */
export function Button({ variant = 'primary', size = 'md', className = '', ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'accent' | 'ai' | 'secondary' | 'ghost'; size?: 'sm' | 'md' | 'lg' }) {
  const v = {
    primary: 'bg-forest-900 text-ivory shadow-sm hover:bg-forest-800 active:bg-forest-950 disabled:bg-forest-900/35',
    ai: 'bg-lilac-300 text-forest-950 shadow-sm hover:bg-[#c6b8ec] active:bg-[#a999dc] disabled:opacity-50',
    accent: 'bg-lime-400 text-forest-900 shadow-sm hover:bg-lime-300 active:bg-lime-500 disabled:opacity-50',
    secondary: 'border border-sand-300 bg-card text-forest-900 hover:border-forest-300 hover:bg-forest-50 active:bg-forest-100 disabled:opacity-50',
    ghost: 'text-forest-800 hover:bg-forest-50 active:bg-forest-100 disabled:opacity-50',
  }[variant]
  const s = size === 'sm' ? 'h-8 px-3.5 text-xs' : size === 'lg' ? 'h-12 px-6 text-base' : 'h-10 px-4.5 text-sm'
  return <button {...p} className={`inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100 ${s} ${v} ${className}`} />
}

export function Tip({ text, children }: { text: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex items-center gap-1">
      {children}
      <button type="button" aria-label={`What does this mean? ${text}`} onClick={() => setOpen((o) => !o)} onBlur={() => setOpen(false)}
        onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} className="rounded-full text-sand-400 transition-colors hover:text-forest-700"><Info size={13} /></button>
      {open && <span role="tooltip" className="fade-in absolute left-0 top-full z-30 mt-1.5 w-60 rounded-xl bg-forest-950 p-3 text-xs font-normal leading-snug text-ivory shadow-pop">{text}</span>}
    </span>
  )
}

/** Money that counts up to its value. The final frame is exactly the backend number. */
export function Money({ value, digits = 0, className = '' }: { value: number; digits?: number; className?: string }) {
  const v = useCountUp(value)
  return <span className={`num ${className}`}>{usd(v, digits)}</span>
}

export function Stat({ label, value, amount, sub, tone, size = 'md' }: { label: string; value?: string; amount?: number; sub?: ReactNode; tone?: 'pos' | 'neg'; size?: 'md' | 'lg' }) {
  const color = tone === 'pos' ? 'text-forest-700' : tone === 'neg' ? 'text-coral-600' : 'text-ink'
  const cls = `${color} ${size === 'lg' ? 'text-4xl' : 'text-2xl sm:text-3xl'} font-medium leading-tight`
  return (
    <div className="min-w-0">
      <Eyebrow>{label}</Eyebrow>
      <div className="mt-1">{amount !== undefined ? <Money value={amount} className={cls} /> : <span className={`num ${cls}`}>{value}</span>}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  )
}

/** Accessible on/off switch (role="switch"). Space/Enter toggle it. */
export function Switch({ checked, onChange, label, id }: { checked: boolean; onChange: (v: boolean) => void; label: string; id?: string }) {
  return (
    <button type="button" role="switch" id={id} aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${checked ? 'bg-forest-900' : 'bg-sand-300'}`}>
      <span aria-hidden className={`absolute top-0.5 h-5 w-5 rounded-full shadow-sm transition-all duration-200 ${checked ? 'left-[22px] bg-lime-400' : 'left-0.5 bg-card'}`} />
    </button>
  )
}

export const Skeleton = ({ className = '' }: { className?: string }) => <div aria-hidden className={`skeleton ${className}`} />
export function SkeletonCard({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return <Card className={className}><Skeleton className="h-3 w-24" /><Skeleton className="mt-3 h-8 w-40" />{Array.from({ length: lines }).map((_, i) => <Skeleton key={i} className={`mt-3 h-3 ${i % 2 ? 'w-2/3' : 'w-full'}`} />)}</Card>
}
export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return <div role="status" aria-label={label} className="grid gap-4"><span className="sr-only">{label}</span><div className="grid gap-4 lg:grid-cols-12"><Card tone="dark" className="lg:col-span-5"><Skeleton className="h-3 w-24 !bg-forest-800" /><Skeleton className="mt-4 h-14 w-56 !bg-forest-800" /><Skeleton className="mt-6 h-16 w-full !bg-forest-800" /></Card><div className="grid gap-4 sm:grid-cols-3 lg:col-span-7"><SkeletonCard lines={2} /><SkeletonCard lines={2} /><SkeletonCard lines={2} /></div></div><SkeletonCard lines={5} /></div>
}

export function ErrorBox({ message, onRetry, title = 'Something went wrong' }: { message: string; onRetry?: () => void; title?: string }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-2xl border border-coral-500/30 bg-coral-50 p-4 text-sm">
      <AlertTriangle size={18} className="mt-0.5 shrink-0 text-coral-600" />
      <div className="min-w-0 flex-1"><div className="font-semibold text-coral-600">{title}</div><p className="mt-0.5 text-slate-700">{message}</p></div>
      {onRetry && <Button variant="secondary" size="sm" onClick={onRetry}><RefreshCw size={13} />Retry</Button>}
    </div>
  )
}
export function EmptyState({ icon, title, text, action }: { icon?: ReactNode; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-sand-300 bg-ivory/60 px-6 py-8 text-center">
      {icon && <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-forest-100 text-forest-800">{icon}</span>}
      <div className="font-semibold">{title}</div><p className="mt-1 max-w-sm text-sm text-muted">{text}</p>{action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function PageHeader({ title, sub, right, eyebrow }: { title: string; sub?: string; right?: ReactNode; eyebrow?: string }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <Eyebrow className="mb-1.5 !text-forest-600">{eyebrow}</Eyebrow>}
        <h1 className="text-3xl leading-tight text-forest-900 sm:text-4xl">{title}</h1>
        {sub && <p className="mt-2 max-w-2xl text-sm text-muted">{sub}</p>}
      </div>
      {right}
    </header>
  )
}

/** Brand mark: forest tile, lime "bridge" glyph. */
export const Logo = ({ size = 34 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 34 34" aria-hidden="true">
    <rect width="34" height="34" rx="11" fill="#173b37" />
    <path d="M7 24V15M27 24V15M7 17c3.5-6.5 16.5-6.5 20 0" stroke="#c8ea54" strokeWidth="2.6" strokeLinecap="round" fill="none" />
    <circle cx="17" cy="24" r="2.2" fill="#f8f7f2" />
  </svg>
)
