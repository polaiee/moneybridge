import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, GraduationCap, Briefcase, Sprout, Compass, Wallet, ShieldCheck, Route, Sparkles, Building2, Shapes } from 'lucide-react'
import { Logo, Button } from '../components/ui'
import { useStore } from '../store'
import { GOALS, LEVELS, STAGES, type Goal, type Level, type Stage } from '../lib/roadmap'

type Step = 'account' | 'verify' | 'profile' | 'goals' | 'journey'
const DEMO_CODE = '246810'
const STAGE_ICON = { student: GraduationCap, early_career: Briefcase, professional: Building2, other: Shapes }

function Shell({ children, step, back, onBack }: { children: ReactNode; step?: number; back?: string; onBack?: () => void }) {
  return (
    <div className="min-h-screen bg-canvas px-4 py-6 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-2"><Logo /><span className="text-xl font-semibold">MoneyBridge</span></div>
        {step ? (
          <div className="w-40 text-xs font-medium text-brand-dark" aria-label={`Step ${step} of 3`}>
            Step {step} of 3
            <div className="mt-1 flex gap-1.5">{[1, 2, 3].map((i) => <span key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-brand' : 'bg-line'}`} />)}</div>
          </div>
        ) : <span className="hidden items-center gap-2 text-sm text-muted sm:flex"><span className="h-1.5 w-1.5 rounded-full bg-teal" />A clearer path to financial confidence</span>}
      </div>
      <div className="mx-auto mt-8 grid max-w-6xl gap-8 lg:grid-cols-2">
        <div className="hidden rounded-3xl bg-gradient-to-br from-brand-soft to-teal-soft p-10 lg:flex lg:flex-col">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-teal-dark"><Sparkles size={13} />Your financial companion</span>
          <h2 className="mt-6 text-4xl font-semibold leading-tight">Small steps.<br />Brighter possibilities.</h2>
          <p className="mt-4 max-w-sm text-muted">Connect the dots between where you are and where you want to be.</p>
          <svg viewBox="0 0 400 220" className="mt-auto w-full" aria-hidden="true">
            <path d="M10 200 C 70 200, 80 40, 150 40 S 230 150, 280 150 S 340 60, 390 10" fill="none" stroke="#3676d8" strokeWidth="3" />
            <path d="M280 150 S 340 60, 390 10" fill="none" stroke="#22a58a" strokeWidth="3" />
            {[['Understand', 20, 200], ['Explore', 150, 40], ['Grow', 340, 50]].map(([t, x, y]) => (
              <g key={t as string}><circle cx={x as number} cy={y as number} r="7" fill="#fff" stroke="#3676d8" strokeWidth="2" /><text x={x as number} y={(y as number) + 24} fontSize="11" textAnchor="middle" fill="#3676d8">{t}</text></g>
            ))}
          </svg>
        </div>
        <div className="max-w-xl py-2">
          {back && <button onClick={onBack} className="mb-8 flex items-center gap-2 text-sm text-muted hover:text-ink"><ArrowLeft size={16} />{back}</button>}
          {children}
        </div>
      </div>
      <p className="mx-auto mt-10 max-w-6xl text-right text-xs text-muted">Demo prototype · Illustrative information only · Not financial advice</p>
    </div>
  )
}
const Eyebrow = ({ children }: { children: ReactNode }) => <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-teal-dark">{children}</div>
const H1 = ({ children }: { children: ReactNode }) => <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">{children}</h1>
const Lead = ({ children }: { children: ReactNode }) => <p className="mt-3 text-muted">{children}</p>

function Option({ selected, onClick, title, text, icon: Icon, multi }: { selected: boolean; onClick: () => void; title: string; text?: string; icon?: typeof Wallet; multi?: boolean }) {
  return (
    <button type="button" role={multi ? 'checkbox' : 'radio'} aria-checked={selected} onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-colors ${selected ? 'border-brand bg-brand-soft/60 ring-1 ring-brand' : 'border-line bg-white hover:border-brand/50'}`}>
      {Icon && <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand"><Icon size={20} /></span>}
      <span className="min-w-0 flex-1"><span className="block font-semibold">{title}</span>{text && <span className="block text-sm text-muted">{text}</span>}</span>
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center ${multi ? 'rounded-md' : 'rounded-full'} border ${selected ? 'border-brand bg-brand text-white' : 'border-line'}`}>{selected && <Check size={14} />}</span>
    </button>
  )
}

export default function Onboarding() {
  const nav = useNavigate()
  const { setProfile } = useStore()
  const [step, setStep] = useState<Step>('account')
  const [name, setName] = useState('Alex Morgan')
  const [stage, setStage] = useState<Stage>('early_career')
  const [level, setLevel] = useState<Level>('beginner')
  const [goals, setGoals] = useState<Goal[]>([])
  const [code, setCode] = useState(DEMO_CODE.split(''))

  const finish = (g: Goal[] = goals) => { setProfile({ name: name.trim() || 'Alex Morgan', stage, level, goals: g, dataSetup: 'demo' }); nav('/dashboard') }
  const toggleGoal = (g: Goal) => setGoals((c) => (c.includes(g) ? c.filter((x) => x !== g) : [...c, g]))

  if (step === 'account') return (
    <Shell>
      <Eyebrow>Create your demo profile</Eyebrow><H1>Your financial journey starts here.</H1>
      <Lead>One place to understand your money, discover useful tools, and make confident financial decisions.</Lead>
      <form className="mt-8 space-y-5" onSubmit={(e) => { e.preventDefault(); setStep('verify') }}>
        <label className="block"><span className="mb-1.5 block text-sm font-medium">Display name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-xl border border-line bg-white px-4 py-3" placeholder="Alex Morgan" /></label>
        <div className="flex items-start gap-2 rounded-xl bg-teal-soft p-3 text-sm text-teal-dark"><ShieldCheck size={18} className="mt-0.5 shrink-0" />
          <span>No password, email, bank login or SSN is collected. This is a demo profile that stays in your browser.</span></div>
        <Button className="w-full py-3.5" type="submit">Continue</Button>
        <Button variant="ghost" className="w-full" type="button" onClick={() => finish(['emergency_savings', 'investing'])}>Skip onboarding and use the demo profile</Button>
      </form>
    </Shell>
  )
  if (step === 'verify') return (
    <Shell back="Back to create profile" onBack={() => setStep('account')}>
      <Eyebrow>Verify your identity · Account setup</Eyebrow><H1>Let’s make sure it’s you.</H1>
      <Lead>In a real account, a code would be sent to you. Here, nothing is sent: the example code is pre-filled.</Lead>
      <div className="mt-6 flex items-center gap-2 rounded-xl bg-teal-soft p-3 text-sm text-teal-dark"><ShieldCheck size={16} />Demo verification · No code sent</div>
      <div className="mt-6 flex items-center justify-between text-sm font-medium"><span>Verification code</span><span className="text-xs text-muted">Example code</span></div>
      <div className="mt-2 grid grid-cols-6 gap-2 sm:gap-3">
        {code.map((c, i) => (
          <input key={i} aria-label={`Digit ${i + 1}`} inputMode="numeric" maxLength={1} value={c}
            onChange={(e) => setCode((d) => d.map((x, j) => (j === i ? e.target.value.replace(/\D/g, '') : x)))}
            className="h-14 min-w-0 rounded-xl border border-line bg-white text-center text-xl" />
        ))}
      </div>
      <Button className="mt-6 w-full py-3.5" disabled={code.join('').length !== 6} onClick={() => setStep('profile')}>Verify and continue</Button>
      <p className="mt-5 text-sm text-muted">Next: personalize your financial profile. This example verification does not authenticate an account.</p>
    </Shell>
  )
  if (step === 'profile') return (
    <Shell step={1} back="Back to verification" onBack={() => setStep('verify')}>
      <Eyebrow>Financial profile</Eyebrow><H1>Let’s personalize your experience.</H1>
      <Lead>Choose what best describes you. We’ll tailor explanations and your roadmap.</Lead>
      <div role="radiogroup" aria-label="Life stage" className="mt-6 space-y-3">
        {STAGES.map((s) => <Option key={s.id} selected={stage === s.id} onClick={() => setStage(s.id)} title={s.label} text={s.blurb} icon={STAGE_ICON[s.id]} />)}
      </div>
      <h2 className="mt-8 text-lg font-semibold">How comfortable are you with finance?</h2>
      <div role="radiogroup" aria-label="Financial knowledge" className="mt-3 space-y-3">
        {LEVELS.map((l) => <Option key={l.id} selected={level === l.id} onClick={() => setLevel(l.id)} title={l.label} text={l.blurb} />)}
      </div>
      <Button className="mt-6 w-full py-3.5" onClick={() => setStep('goals')}>Continue</Button>
      <p className="mt-4 text-sm text-muted">You can revisit your profile as your journey evolves.</p>
    </Shell>
  )
  if (step === 'goals') return (
    <Shell step={2} back="Back to profile" onBack={() => setStep('profile')}>
      <Eyebrow>Your goals</Eyebrow><H1>What would you like to work on?</H1>
      <Lead>Pick any that apply. They drive your roadmap and Marketplace suggestions.</Lead>
      <div role="group" aria-label="Goals" className="mt-6 space-y-3">
        {GOALS.map((g) => <Option key={g.id} multi selected={goals.includes(g.id)} onClick={() => toggleGoal(g.id)} title={g.label} text={g.blurb} />)}
      </div>
      <Button className="mt-6 w-full py-3.5" onClick={() => setStep('journey')}>Continue</Button>
      <button onClick={() => setStep('journey')} className="mt-3 w-full text-center text-sm font-semibold text-brand-dark">Skip for now</button>
    </Shell>
  )
  return (
    <Shell step={3} back="Back to goals" onBack={() => setStep('goals')}>
      <Eyebrow>Your personalized starting point</Eyebrow><H1>Your journey, your pace.</H1>
      <Lead>Choose how to set up your data.</Lead>
      <div className="mt-6 space-y-3">
        <Option selected onClick={() => {}} icon={Wallet} title="Use the demo financial dataset" text="One fictional persona (Alex Morgan) used across every page. Clearly labeled demo data." />
        <div className="flex items-center gap-4 rounded-2xl border border-dashed border-line p-4 text-sm text-muted"><Route size={20} />Manual account entry and bank connections are not part of this prototype.</div>
      </div>
      <div className="mt-6 rounded-2xl border border-line bg-white p-6 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-teal text-white"><Compass size={26} /></span>
        <div className="mt-3 text-lg font-semibold">A clearer path, made for you</div>
        <p className="text-sm text-muted">Understand your money. Discover your next step.</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">{(goals.length ? goals.map((g) => GOALS.find((x) => x.id === g)!.label) : ['Everyday money', 'Your goals']).map((t) => <span key={t} className="rounded-full bg-brand-soft px-3 py-1 text-xs text-brand-dark">{t}</span>)}</div>
      </div>
      <Button className="mt-6 w-full py-3.5" onClick={() => finish()}>Go to my dashboard</Button>
      <p className="mt-4 text-sm text-muted"><Sprout size={14} className="mr-1 inline" />No financial accounts connected. Everything shown is demo data.</p>
    </Shell>
  )
}
