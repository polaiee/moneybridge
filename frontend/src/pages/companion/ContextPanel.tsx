import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, GitBranch, Store, UserRound, X } from 'lucide-react'
import { api, type Comparison } from '../../api'
import { Badge, Button, Card, DemoBadge, Eyebrow, Money, Switch } from '../../components/ui'
import { fmt, LABELS } from '../../lib/products'
import { twinRows } from '../../lib/twinFigures'
import { LEVELS, STAGES, goalLabel } from '../../lib/roadmap'
import { useStore } from '../../store'
import { useIncluded } from './useIncluded'

export const CALC_LABEL = 'Calculated by MoneyBridge, not by the AI'

function Item({ icon, title, right, children }: { icon: ReactNode; title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="py-4 first:pt-1 last:pb-1" aria-label={title}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lilac-100 text-lilac-800">{icon}</span><h3 className="text-sm font-semibold">{title}</h3></div>
        {right}
      </div>
      <div className="mt-2.5 space-y-2.5 pl-[42px]">{children}</div>
    </section>
  )
}

function Sent({ id, open, setOpen, children }: { id: string; open: boolean; setOpen: (o: boolean) => void; children: ReactNode }) {
  return (
    <div>
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)} className="inline-flex items-center gap-1 text-xs font-semibold text-lilac-800 hover:underline">
        See exactly what’s sent<ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} /></button>
      {open && <div id={id} className="fade-in mt-2 rounded-xl border border-dashed border-lilac-300 bg-lilac-50 p-3">{children}</div>}
    </div>
  )
}

const Empty = ({ title, text, to, link }: { title: string; text: string; to: string; link: string }) => (
  <div className="rounded-2xl border border-dashed border-sand-300 bg-ivory/60 p-3 text-xs">
    <div className="text-sm font-semibold">{title}</div><p className="mt-0.5 text-muted">{text}</p>
    <Link to={to} className="mt-1.5 inline-flex font-semibold text-forest-800 underline-offset-2 hover:underline">{link} →</Link>
  </div>
)

/** Compare payload shown lazily from the existing POST /api/marketplace/compare (the same data the chat call injects server-side). */
function CompareFigures({ a, b }: { a: string; b: string }) {
  const [cmp, setCmp] = useState<Comparison | null>(null); const [err, setErr] = useState(false)
  useEffect(() => { api.compare(a, b).then(setCmp).catch(() => setErr(true)) }, [a, b])
  if (err) return <p className="text-xs text-coral-600">Couldn’t load the comparison details.</p>
  if (!cmp) return <p className="text-xs text-muted">Loading…</p>
  return (
    <div className="text-xs">
      <p className="mb-1.5 text-muted">Sent: the ids <span className="num font-medium text-ink">{a}</span> and <span className="num font-medium text-ink">{b}</span>; MoneyBridge adds this comparison.</p>
      <dl className="divide-y divide-dashed divide-lilac-300">
        {cmp.fields.map((f) => <div key={f} className="grid grid-cols-[1.1fr_1fr_1fr] gap-2 py-1.5"><dt className="text-muted">{LABELS[f] ?? f}</dt><dd className="num font-medium">{fmt(f, cmp.products[0][f])}</dd><dd className="num font-medium">{fmt(f, cmp.products[1][f])}</dd></div>)}
      </dl>
    </div>
  )
}

/** Itemised "what the assistant is using": profile, Twin results, Marketplace comparison. Switches share state with the composer chips. */
export default function ContextPanel({ className = '', bare = false }: { className?: string; bare?: boolean }) {
  const { profile, shareProfile, setShareProfile, twinContext, setTwinContext, attachTwin, setAttachTwin, compareContext, setCompareContext, attachCompare, setAttachCompare } = useStore()
  const { items } = useIncluded()
  const [twinOpen, setTwinOpen] = useState(false); const [cmpOpen, setCmpOpen] = useState(false)
  const stage = STAGES.find((s) => s.id === profile?.stage)?.label, level = LEVELS.find((l) => l.id === profile?.level)?.label
  const rows = twinRows(twinContext)
  const body = (
    <>
      <div className="divide-y divide-dashed divide-sand-300">
        <Item icon={<UserRound size={15} />} title="Your profile" right={<Switch checked={shareProfile} onChange={setShareProfile} label="Share my goals and experience level" />}>
          <p className="text-xs text-ink">Share my goals and experience level</p>
          <Badge tone="illus">Your choices, shared by you</Badge>
          <p className="text-xs text-muted">{shareProfile && profile ? <>Goals: {profile.goals.map(goalLabel).join(', ') || 'none'} · Level: {level} · Stage: {stage}</> : 'Not shared. Only these preferences can ever be sent; balances never are.'}</p>
        </Item>

        <Item icon={<GitBranch size={15} />} title="Financial Twin results" right={twinContext ? <Switch checked={attachTwin} onChange={setAttachTwin} label="Attach Twin results to my messages" /> : undefined}>
          {twinContext ? (<>
            <p className="text-sm">Ending value <Money value={twinContext.results.hypothetical.ending_value} className="font-semibold" /> · {twinContext.scenario.years} years</p>
            <Badge tone="illus">{CALC_LABEL}</Badge>
            <p className="text-xs text-ink">Attach to my messages <span className="text-muted">· {attachTwin ? 'on' : 'off'}</span></p>
            <Sent id="sent-twin" open={twinOpen} setOpen={setTwinOpen}>
              <dl className="divide-y divide-dashed divide-lilac-300 text-xs">{rows.map(([k, v]) => <div key={k} className="flex justify-between gap-3 py-1.5"><dt className="text-muted">{k}</dt><dd className="num text-right font-medium">{v}</dd></div>)}</dl>
            </Sent>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="sm" aria-label="Clear Twin results" onClick={() => { setTwinContext(null); setAttachTwin(false); setTwinOpen(false) }}><X size={13} />Clear</Button>
              <Link to="/twin" className="text-xs font-semibold text-forest-800 underline-offset-2 hover:underline">Open Financial Twin →</Link>
            </div>
          </>) : <Empty title="No scenario yet" text="Run one in the Financial Twin, then attach it here." to="/twin" link="Open Financial Twin" />}
        </Item>

        <Item icon={<Store size={15} />} title="Marketplace comparison" right={compareContext ? <Switch checked={attachCompare} onChange={setAttachCompare} label="Attach Marketplace comparison to my messages" /> : undefined}>
          {compareContext ? (<>
            <p className="text-sm font-medium">{compareContext.label}</p>
            <div className="flex flex-wrap gap-1.5"><DemoBadge /><Badge tone="illus">{CALC_LABEL}</Badge></div>
            <p className="text-xs text-ink">Attach to my messages <span className="text-muted">· {attachCompare ? 'on' : 'off'}</span></p>
            <Sent id="sent-compare" open={cmpOpen} setOpen={setCmpOpen}><CompareFigures a={compareContext.a} b={compareContext.b} /></Sent>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="secondary" size="sm" aria-label="Clear Marketplace comparison" onClick={() => { setCompareContext(null); setAttachCompare(false); setCmpOpen(false) }}><X size={13} />Clear</Button>
              <Link to="/marketplace" className="text-xs font-semibold text-forest-800 underline-offset-2 hover:underline">Open Marketplace →</Link>
            </div>
          </>) : <Empty title="No comparison yet" text="Compare two products in the Marketplace, then attach it here." to="/marketplace" link="Open Marketplace" />}
        </Item>
      </div>
      <p data-testid="next-includes" role="status" className="mt-3 rounded-xl bg-lilac-50 px-3 py-2 text-xs"><b>Next message will include:</b> {items.length ? items.join(', ') : 'No app data'}</p>
      <p className="mt-2 text-2xs text-muted">Starter cards and Explain actions attach their context for that one message. Balances and account data are never sent.</p>
    </>
  )
  if (bare) return <div className={className}>{body}</div>
  return (
    <Card className={className}>
      <Eyebrow>Active context</Eyebrow>
      <h2 className="mb-2 mt-0.5 text-base font-semibold leading-tight">What the assistant is using</h2>
      <p className="mb-3 text-xs text-muted">Only what’s listed here can be sent.</p>
      {body}
    </Card>
  )
}
