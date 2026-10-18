import { useEffect, useMemo, useRef, useState } from 'react'
import { api, type Scenario, type SimResult } from '../api'
import { Card, ErrorBox, Skeleton, SkeletonCard } from '../components/ui'
import { friendlyError } from '../lib/errors'
import { useAsync } from '../lib/useAsync'
import { useStore, type TwinForm } from '../store'
import AiPanel from './twin/AiPanel'
import ControlPanel from './twin/ControlPanel'
import Legacy from './twin/Legacy'
import { initialForm, toScenario, validate } from './twin/model'
import Projection from './twin/Projection'
import SummaryBar from './twin/SummaryBar'

interface Result { sim: SimResult; baseSim: SimResult; scenario: Scenario; baseline: Scenario }

/**
 * Simulation lab. ≥1024px: sticky control panel (left) + results column (right) with a sticky summary bar.
 * <1024px: summary bar (sticky) → controls → results, stacked. The wrappers use `contents` so one sticky bar serves both layouts.
 */
export default function Twin() {
  const { data: dash, error: dashErr, loading, retry } = useAsync(api.dashboard)
  const { twinForm, setTwinForm, setTwinContext } = useStore()
  const [form, setFormState] = useState<TwinForm | null>(twinForm)
  const [res, setRes] = useState<Result | null>(null)
  const [busy, setBusy] = useState(false)
  const [simErr, setSimErr] = useState<string | null>(null)
  const [aiOpen, setAiOpen] = useState(false)
  const seq = useRef(0)

  useEffect(() => { if (dash && !form) setFormState(initialForm(dash)) }, [dash, form])
  const setForm = (f: TwinForm) => { setFormState(f); setTwinForm(f) }
  const v = useMemo(() => (form ? validate(form) : null), [form])
  const valid = !!v && Object.keys(v.errors).length === 0

  const run = (f: TwinForm) => {
    if (!dash) return
    const baseHoldings = dash.portfolio.holdings.map((h) => ({ name: h.name, weight: String(h.allocation_pct), er: String(h.expense_ratio_pct) }))
    const scenario = toScenario(f, f.monthly, f.initial, f.holdings)
    const baseline = toScenario(f, f.baselineMonthly, String(dash.portfolio.total), baseHoldings)
    const my = ++seq.current
    setBusy(true); setSimErr(null)
    Promise.all([api.simulate(scenario, baseline), api.simulate(baseline)])
      .then(([sim, baseSim]) => { if (my !== seq.current) return; setRes({ sim, baseSim, scenario, baseline }); setTwinContext({ scenario, baseline, results: sim }) })
      .catch((e: Error) => { if (my === seq.current) setSimErr(e.message) })
      .finally(() => { if (my === seq.current) setBusy(false) })
  }
  // Re-run (debounced) whenever the form is valid and changes.
  useEffect(() => {
    if (!form || !valid) return
    const t = setTimeout(() => run(form), 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, valid, dash])

  if (loading || (!form && !dashErr)) return (
    <div className="grid gap-4 lg:grid-cols-12"><SkeletonCard lines={9} className="lg:col-span-5 xl:col-span-4" /><div className="space-y-4 lg:col-span-7 xl:col-span-8"><SkeletonCard lines={1} /><Card><Skeleton className="h-72 w-full" /></Card></div></div>
  )
  if (dashErr || !dash || !form || !v) return <ErrorBox title="Starting portfolio unavailable" message={friendlyError(dashErr, 'the starting portfolio')} onRetry={retry} />

  const set = (patch: Partial<TwinForm>) => setForm({ ...form, ...patch })
  const explain = () => setAiOpen(true)

  return (
    <>
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-12 lg:items-start">
        <ControlPanel className="order-2 lg:order-none lg:sticky lg:top-[72px] lg:col-span-5 xl:col-span-4" dash={dash} form={form} set={set} v={v} valid={valid} busy={busy}
          onRun={() => valid && run(form)} onReset={() => setForm(initialForm(dash))} onExplain={explain} />

        <div className="contents lg:col-span-7 lg:flex lg:min-w-0 lg:flex-col lg:gap-4 xl:col-span-8">
          <SummaryBar className="order-1 lg:order-none" sim={res?.sim ?? null} busy={busy} onExplain={explain} />
          <div className="order-3 flex min-w-0 flex-col gap-4 lg:order-none">
            {!valid && <ErrorBox title="Inputs need attention" message="Fix the highlighted inputs to update the projection. Showing the last valid results below." />}
            {simErr && <ErrorBox title="Simulation failed" message={friendlyError(simErr, 'the simulation')} onRetry={() => run(form)} />}
            {!res ? (!simErr && <div role="status" aria-label="Running simulation…"><Card><Skeleton className="h-[360px] w-full" /></Card></div>) : (
              <div className={`flex flex-col gap-4 transition-opacity ${busy || !valid ? 'opacity-75' : ''}`}>
                <Projection sim={res.sim} scenario={res.scenario} />
                <Legacy dash={dash} form={form} sim={res.sim} baseSim={res.baseSim} scenario={res.scenario} />
              </div>)}
          </div>
        </div>
      </div>
      <AiPanel open={aiOpen} onClose={() => setAiOpen(false)} />
    </>
  )
}
