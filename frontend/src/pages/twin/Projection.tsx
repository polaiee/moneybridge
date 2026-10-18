import { Area, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { Scenario, SimResult } from '../../api'
import { Card, HypoBadge, Money } from '../../components/ui'
import { AXIS, C, TipBox } from '../../components/charts'
import { usd } from '../../lib/format'

interface Row { year: number; hypo: number; base: number; lo: number; gap: number; up: boolean }

/** Dual-line projection: Hypothetical vs Current plan, shaded gap, hover crosshair, direct end labels, stat footer. */
export default function Projection({ sim, scenario, className = '' }: { sim: SimResult; scenario: Scenario; className?: string }) {
  const N = sim.hypothetical.yearly_values.length - 1
  const rows: Row[] = sim.hypothetical.yearly_values.map((y, i) => { const b = sim.baseline?.yearly_values[i] ?? y; return { year: i, hypo: y, base: b, lo: Math.min(y, b), gap: Math.abs(y - b), up: y >= b } })
  const diff = sim.difference_at_end ?? 0
  const gapColor = diff >= 0 ? C.lime : C.coral
  const endLabel = (color: string, text: string, dy: number) => (p: { x?: number | string; y?: number | string; index?: number }) =>
    p.index === N ? <text x={Number(p.x ?? 0) + 8} y={Number(p.y ?? 0) + 4 + dy} fontSize={11} fontWeight={600} fill={color}>{text}</text> : <g />
  return (
    <Card className={className}>
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div><h2 className="text-lg font-semibold leading-tight">Investment projection</h2><p className="text-sm text-muted">Illustrative growth over {scenario.years} years</p></div>
        <HypoBadge>Illustrative estimate</HypoBadge>
      </div>
      <div className="h-[300px]" role="img" aria-label="Line chart of baseline versus hypothetical portfolio value by year, with the gap shaded">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ left: 0, right: 88, top: 10, bottom: 4 }}>
            <CartesianGrid stroke={C.grid} vertical={false} strokeDasharray="4 5" />
            <XAxis dataKey="year" tickLine={false} axisLine={{ stroke: C.grid }} tick={AXIS} minTickGap={14} tickFormatter={(y) => `Y${y}`} />
            <YAxis tickFormatter={(x) => `$${Math.round(x / 1000)}k`} tickLine={false} axisLine={false} width={48} tick={AXIS} />
            <Tooltip cursor={{ stroke: '#14211e', strokeDasharray: '3 3', strokeOpacity: 0.55 }} content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const p = payload[0].payload as Row
              return <TipBox title={`Year ${p.year}`} rows={[{ label: 'Hypothetical', value: usd(p.hypo), color: C.forest, strong: true }, { label: 'Current plan', value: usd(p.base), color: C.limeDeep }]} foot={<>Gap <b className="num text-white">{p.up ? '+' : '−'}{usd(p.gap)}</b></>} />
            }} />
            <Area dataKey="lo" stackId="g" stroke="none" fill="transparent" isAnimationActive={false} activeDot={false} legendType="none" />
            <Area dataKey="gap" stackId="g" stroke="none" fill={gapColor} fillOpacity={diff >= 0 ? 0.3 : 0.2} isAnimationActive={false} activeDot={false} legendType="none" />
            <Line dataKey="base" name="Current plan" stroke={C.limeDeep} strokeWidth={2.25} dot={false} activeDot={{ r: 4 }} animationDuration={600} label={endLabel(C.limeDeep, 'Current plan', 10)} />
            <Line dataKey="hypo" name="Hypothetical" stroke={C.forest} strokeWidth={2.75} dot={false} activeDot={{ r: 5 }} animationDuration={600} label={endLabel(C.forest, 'Hypothetical', -6)} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-sm" data-testid="diff">Difference at year {scenario.years}: <b className={diff >= 0 ? 'text-forest-700' : 'text-coral-600'}>{diff >= 0 ? '+' : '−'}{usd(Math.abs(diff))}</b> versus the current plan ({usd(sim.baseline?.ending_value ?? 0)}). The shaded band is that gap. The baseline uses your current allocation and the same duration and return.</p>
      <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-dashed border-sand-300 pt-4 sm:grid-cols-4">
        {[['Illustrative ending value', sim.hypothetical.ending_value, 'Hypothetical plan, incl. starting balance'], ['Total contributed', sim.hypothetical.total_contributions, 'Initial + monthly contributions'], ['Modeled growth', sim.hypothetical.modeled_growth, 'Before taxes and inflation'], ['Cost of fees', sim.fee_impact.cost_of_fees, `Modeled over ${scenario.years} years`]].map(([l, v, s]) => (
          <div key={l as string} className="min-w-0"><dt className="eyebrow">{l as string}</dt><dd className="mt-1"><Money value={v as number} className="text-xl font-medium" /></dd><div className="mt-0.5 text-2xs text-muted">{s as string}</div></div>))}
      </dl>
    </Card>
  )
}
