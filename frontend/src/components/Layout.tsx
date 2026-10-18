import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Home, GitBranch, Sparkles, Store, Settings, Plus, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Logo } from './ui'
import { useStore } from '../store'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/twin', label: 'Financial Twin', icon: GitBranch },
  { to: '/companion', label: 'AI Companion', icon: Sparkles },
  { to: '/marketplace', label: 'Marketplace', icon: Store },
]

function NavItems({ onNav }: { onNav?: () => void }) {
  const cls = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-brand-soft text-brand-dark' : 'text-muted hover:bg-brand-soft/60 hover:text-ink'}`
  return (
    <nav aria-label="Primary" className="flex flex-col gap-1">
      {NAV.map(({ to, label, icon: I }) => (<NavLink key={to} to={to} className={cls} onClick={onNav}><I size={18} />{label}</NavLink>))}
    </nav>
  )
}

export default function Layout() {
  const [open, setOpen] = useState(false)
  const { profile, newConversation } = useStore()
  const nav = useNavigate()
  const startChat = () => { newConversation(); nav('/companion'); setOpen(false) }
  const initials = (profile?.name || 'AM').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  const sidebar = (
    <div className="flex h-full flex-col gap-5 p-4">
      <div className="flex items-center gap-2 px-1"><Logo /><span className="text-xl font-semibold">MoneyBridge</span></div>
      <button onClick={startChat} className="flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"><Plus size={16} />New conversation</button>
      <NavItems onNav={() => setOpen(false)} />
      <div className="mt-auto border-t border-line pt-4">
        <NavLink to="/settings" onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl p-2 hover:bg-brand-soft/60">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-dark">{initials}</span>
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{profile?.name ?? 'Demo profile'}</span><span className="block text-xs text-muted">Demo persona · Settings</span></span>
          <Settings size={16} className="text-muted" />
        </NavLink>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen lg:flex">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-line bg-white lg:block">{sidebar}</aside>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2"><Logo size={28} /><span className="font-semibold">MoneyBridge</span></div>
        <button aria-label="Open menu" onClick={() => setOpen(true)} className="rounded-lg p-2 hover:bg-brand-soft"><Menu size={20} /></button>
      </div>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-white shadow-xl">
            <button aria-label="Close menu" onClick={() => setOpen(false)} className="absolute right-3 top-3 rounded-lg p-2 hover:bg-brand-soft"><X size={18} /></button>
            {sidebar}
          </div>
        </div>
      )}
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:px-10"><div className="mx-auto max-w-6xl"><Outlet /></div></main>
    </div>
  )
}
