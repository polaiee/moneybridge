import { useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { AlertTriangle, Info, RefreshCw } from 'lucide-react'
import { useCountUp } from '../lib/useCountUp'
import { usd } from '../lib/format'

export function Card({ children, className = '', tone = 'white' }: { children: ReactNode; className?: string; tone?: 'white' | 'brand' | 'teal' | 'dark' }) {
  const bg = tone === 'brand' ? 'bg-gradient-to-b from-blue-50 to-white' : tone === 'teal' ? 'bg-teal-50' : tone === 'dark' ? 'bg-slate-900 text-white border-slate-800' : 'bg-white'
  return <section className={`rounded-xl border border-line ${bg} p-4 shadow-sm sm:p-5 ${className}`}>{children}</section>
}

export const Eyebrow = ({ children, className = '' }: { children: ReactNode; className?: string }) => <div className={`eyebrow ${className}`}>{children}</div>

export function SectionHead({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
      <div><h2 className="text-lg font-semibold text-ink">{title}</h2>{sub && <p className="text-sm text-muted">{sub}</p>}</div>
      {right}
    </div>
  )
}

const TONES = {
  demo: 'bg-teal-50 text-teal-800 border-teal-200',
  hypo: 'bg-blue-50 text-blue-800 border-blue-200',
  illus: 'bg-violet-50 text-violet border-violet/25',
  neutral: 'bg-slate-100 text-slate-600 border-slate-200',
  warn: 'bg-red-50 text-danger border-danger/25',
} as const
const DOT = { demo: 'bg-teal-500', hypo: 'bg-blue-500', illus: 'bg-violet', neutral: 'bg-slate-400', warn: 'bg-danger' } as const
export function Badge({ tone = 'neutral', children }: { tone?: keyof typeof TONES; children: ReactNode }) {
  return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-2xs font-semibold leading-4 ${TONES[tone]}`}><span aria-hidden className={`h-1.5 w-1.5 rounded-full ${DOT[tone]}`} />{children}</span>
}
export const DemoBadge = () => <Badge tone="demo">Demo data</Badge>
export const HypoBadge = ({ children = 'Hypothetical' }: { children?: ReactNode }) => <Badge tone="hypo">{children}</Badge>
export const IllusBadge = ({ children = 'Illustrative' }: { children?: ReactNode }) => <Badge tone="illus">{children}</Badge>

export function Button({ variant = 'primary', size = 'md', className = '', ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost'; size?: 'sm' | 'md' | 'lg' }) {
  const v = variant === 'primary' ? 'bg-brand text-white shadow-sm hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300'
    : variant === 'secondary' ? 'border border-line bg-white text-slate-800 shadow-xs hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50'
    : 'text-brand hover:bg-blue-50 active:bg-blue-100 disabled:opacity-50'
  const s = size === 'sm' ? 'h-8 px-3 text-xs' : size === 'lg' ? 'h-11 px-5 text-base' : 'h-9 px-3.5 text-sm'
  return <button {...p} className={`inline-flex select-none items-center justify-center gap-2 rounded-lg font-semibold transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100 focus-visible:outline-2 ${s} ${v} ${className}`} />
}

export function Tip({ text, children }: { text: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <span className="relative inline-flex items-center gap-1">
      {children}
      <button type="button" aria-label={`What does this mean? ${text}`} onClick={() => setOpen((o) => !o)} onBlur={() => setOpen(false)}
        onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} className="rounded text-slate-400 transition-colors hover:text-brand"><Info size={13} /></button>
      {open && <span role="tooltip" className="fade-in absolute left-0 top-full z-30 mt-1.5 w-60 rounded-lg bg-slate-900 p-2.5 text-xs font-normal leading-snug text-white shadow-pop">{text}</span>}
    </span>
  )
}

/** Money that counts up to its value. Final frame is exactly the backend number. */
export function Money({ value, digits = 0, className = '' }: { value: number; digits?: number; className?: string }) {
  const v = useCountUp(value)
  return <span className={`num ${className}`}>{usd(v, digits)}</span>
}

export function Stat({ label, value, amount, sub, tone, size = 'md' }: { label: string; value?: string; amount?: number; sub?: ReactNode; tone?: 'pos' | 'neg'; size?: 'md' | 'lg' }) {
  const color = tone === 'pos' ? 'text-teal-700' : tone === 'neg' ? 'text-danger' : 'text-ink'
  const cls = `${color} ${size === 'lg' ? 'text-4xl' : 'text-2xl sm:text-3xl'} font-semibold leading-tight`
  return (
    <div className="min-w-0">
      <Eyebrow>{label}</Eyebrow>
      <div className="mt-1">{amount !== undefined ? <Money value={amount} className={cls} /> : <span className={`num ${cls}`}>{value}</span>}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  )
}

export const Skeleton = ({ className = '' }: { className?: string }) => <div aria-hidden className={`skeleton ${className}`} />
export function SkeletonCard({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return <Card className={className}><Skeleton className="h-3 w-24" /><Skeleton className="mt-3 h-8 w-40" />{Array.from({ length: lines }).map((_, i) => <Skeleton key={i} className={`mt-3 h-3 ${i % 2 ? 'w-2/3' : 'w-full'}`} />)}</Card>
}
export function Spinner({ label = 'Loading…' }: { label?: string }) {
  return <div role="status" aria-label={label} className="grid gap-4"><span className="sr-only">{label}</span><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><SkeletonCard lines={1} /><SkeletonCard lines={1} /><SkeletonCard lines={1} /><SkeletonCard lines={1} /></div><SkeletonCard lines={5} /></div>
}

export function ErrorBox({ message, onRetry, title = 'Something went wrong' }: { message: string; onRetry?: () => void; title?: string }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-xl border border-danger/25 bg-red-50 p-4 text-sm">
      <AlertTriangle size={18} className="mt-0.5 shrink-0 text-danger" />
      <div className="min-w-0 flex-1"><div className="font-semibold text-danger">{title}</div><p className="mt-0.5 text-slate-700">{message}</p></div>
      {onRetry && <Button variant="secondary" size="sm" onClick={onRetry}><RefreshCw size={13} />Retry</Button>}
    </div>
  )
}
export function EmptyState({ icon, title, text, action }: { icon?: ReactNode; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-slate-300 bg-white/60 px-6 py-10 text-center">
      {icon && <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-brand">{icon}</span>}
      <div className="font-semibold">{title}</div><p className="mt-1 max-w-sm text-sm text-muted">{text}</p>{action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function PageHeader({ title, sub, right, eyebrow }: { title: string; sub?: string; right?: ReactNode; eyebrow?: string }) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <Eyebrow className="mb-1 !text-teal-700">{eyebrow}</Eyebrow>}
        <h1 className="text-2xl font-semibold text-ink sm:text-3xl">{title}</h1>
        {sub && <p className="mt-1 max-w-2xl text-sm text-muted">{sub}</p>}
      </div>
      {right}
    </header>
  )
}

export const Logo = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
    <defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3676d8" /><stop offset="1" stopColor="#22a58a" /></linearGradient></defs>
    <rect width="32" height="32" rx="9" fill="url(#lg)" />
    <g fill="#fff"><circle cx="9.5" cy="9.5" r="2.4" /><circle cx="9.5" cy="22.5" r="2.4" /><circle cx="22.5" cy="9.5" r="2.4" /><circle cx="22.5" cy="22.5" r="2.4" /></g>
    <path d="M9.5 9.5v13M22.5 9.5v13M9.5 16h13" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
)
