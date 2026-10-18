import { api } from '../api'
import { ErrorBox, Spinner } from '../components/ui'
import { friendlyError } from '../lib/errors'
import { useAsync } from '../lib/useAsync'
import { useStore } from '../store'
import Accounts from './dashboard/Accounts'
import Allocation from './dashboard/Allocation'
import CashFlow from './dashboard/CashFlow'
import Hero from './dashboard/Hero'
import Insights from './dashboard/Insights'
import Kpis from './dashboard/Kpis'
import Roadmap from './dashboard/Roadmap'

/** 12-column bento: hero (1–6, two rows) + KPI tiles and cash flow (7–12); allocation; accounts + roadmap; insights. */
export default function Dashboard() {
  const { data: d, error, loading, retry } = useAsync(api.dashboard)
  const { profile } = useStore()
  if (loading) return <Spinner label="Loading your overview…" />
  if (error || !d) return <ErrorBox title="Dashboard unavailable" message={friendlyError(error, 'the dashboard')} onRetry={retry} />
  return (
    <div className="stagger grid grid-cols-12 gap-4">
      <Hero d={d} name={profile?.name} />
      <Kpis d={d} />
      <CashFlow d={d} />
      <Allocation d={d} />
      <Accounts d={d} />
      <Roadmap goals={profile?.goals ?? []} />
      <Insights d={d} />
    </div>
  )
}
