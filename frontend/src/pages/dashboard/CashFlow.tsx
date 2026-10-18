import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowUpRight } from 'lucide-react'
import { type Dashboard as D } from '../../api'
import { Card, DemoBadge, Money } from '../../components/ui'
import { AXIS, C, TipBox } from '../../components/charts'
import { usd, pct } from '../../lib/format'

/** Cols 7–12, compact (~240px): title + surplus callout on one line, a short chart, a one-line note. */
export default function CashFlow({ d }: { d: D }) {
  const { monthly_income: inc, monthly_expenses: exp, monthly_surplus: surplus } = d.cash_flow
  const flow = [{ name: 'Income', value: inc, fill: C.forest }, { name: 'Expenses', value: exp, fill: C.coral }, { name: 'Surplus', value: surplus, fill: C.lime }]
  return (
    <Card className="col-span-12 flex flex-col !p-4 xl:col-span-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-base font-semibold">Cash flow</h2>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-lime-400 px-3 py-1 text-xs font-semibold text-forest-900"><ArrowUpRight size={13} />Surplus <Money value={surplus} className="font-semibold" /> · {pct((surplus / inc) * 100, 0)} of income</span>
        </div>
        <DemoBadge />
      </div>
      <div className="mt-1 h-[124px]" role="img" aria-label={`Income ${usd(inc)}, expenses ${usd(exp)}, surplus ${usd(surplus)} per month`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={flow} barSize={48} margin={{ top: 18, right: 4, bottom: 0, left: 4 }}>
            <CartesianGrid vertical={false} stroke={C.grid} strokeDasharray="4 5" />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ ...AXIS, fontSize: 12 }} />
            <YAxis hide domain={[0, (max: number) => Math.ceil(max * 1.1)]} />
            <Tooltip cursor={{ fill: 'rgb(200 234 84 / 0.14)', radius: 12 }} content={({ active, payload }) => active && payload?.length ? <TipBox title={String(payload[0].payload.name)} rows={[{ label: 'Per month', value: usd(Number(payload[0].value)), color: payload[0].payload.fill, strong: true }]} foot="Demo data" /> : null} />
            <Bar dataKey="value" radius={[12, 12, 3, 3]} animationDuration={700}>
              {flow.map((f) => <Cell key={f.name} fill={f.fill} />)}
              <LabelList dataKey="value" position="top" formatter={(v) => usd(Number(v))} style={{ fontSize: 12, fontWeight: 600, fill: '#14211e' }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-2xs text-muted">One month of demo values; no trend is drawn.</p>
    </Card>
  )
}
