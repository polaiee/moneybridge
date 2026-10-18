import { useNavigate } from 'react-router-dom'
import { Card, PageHeader, Button, DemoBadge } from '../components/ui'
import { useStore } from '../store'
import { GOALS, LEVELS, STAGES, type Goal } from '../lib/roadmap'

export default function Settings() {
  const { profile, setProfile, memoryEnabled, setMemoryEnabled, shareProfile, setShareProfile, newConversation } = useStore()
  const nav = useNavigate()
  if (!profile) return null
  const set = (p: Partial<typeof profile>) => setProfile({ ...profile, ...p })
  const toggle = (g: Goal) => set({ goals: profile.goals.includes(g) ? profile.goals.filter((x) => x !== g) : [...profile.goals, g] })
  const sel = 'rounded-xl border border-line bg-white px-3 py-2 text-sm'
  return (
    <>
      <PageHeader title="Settings" sub="Edit your profile and AI privacy controls. Everything is stored in your browser." right={<DemoBadge />} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Profile</h2>
          <div className="space-y-4">
            <label className="block text-sm font-medium">Display name<input value={profile.name} onChange={(e) => set({ name: e.target.value })} className={`${sel} mt-1 w-full`} /></label>
            <label className="block text-sm font-medium">Life stage<select value={profile.stage} onChange={(e) => set({ stage: e.target.value as typeof profile.stage })} className={`${sel} mt-1 w-full`}>{STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
            <label className="block text-sm font-medium">Financial knowledge<select value={profile.level} onChange={(e) => set({ level: e.target.value as typeof profile.level })} className={`${sel} mt-1 w-full`}>{LEVELS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
            <fieldset><legend className="mb-1 text-sm font-medium">Goals</legend>
              <div className="flex flex-wrap gap-2">{GOALS.map((g) => <button key={g.id} type="button" aria-pressed={profile.goals.includes(g.id)} onClick={() => toggle(g.id)} className={`rounded-full border px-3 py-1.5 text-sm ${profile.goals.includes(g.id) ? 'border-brand bg-brand-soft text-brand-dark' : 'border-line bg-white text-muted'}`}>{g.label}</button>)}</div></fieldset>
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-semibold">AI privacy</h2>
          <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={shareProfile} onChange={(e) => setShareProfile(e.target.checked)} className="mt-1" />
            <span><b>Share my goals and experience level with the AI Companion.</b><br /><span className="text-muted">Only these preferences are sent. Balances and account data never are.</span></span></label>
          <label className="mt-4 flex items-start gap-3 text-sm"><input type="checkbox" checked={memoryEnabled} onChange={(e) => setMemoryEnabled(e.target.checked)} className="mt-1" />
            <span><b>Let Backboard remember learning context across conversations.</b><br /><span className="text-muted">View and delete what it kept in the AI Companion.</span></span></label>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => { newConversation(); nav('/companion') }}>Start a fresh conversation</Button>
            <Button variant="secondary" onClick={() => { newConversation(); setProfile(null); nav('/onboarding') }}>Redo onboarding</Button>
          </div>
        </Card>
      </div>
    </>
  )
}
