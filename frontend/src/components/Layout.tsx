import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Home, GitBranch, Sparkles, Store, Settings, Plus, Menu, X, PanelLeftClose, PanelLeftOpen, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Logo } from './ui'
import { useStore } from '../store'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/twin', label: 'Financial Twin', icon: GitBranch },
  { to: '/companion', label: 'AI Companion', icon: Sparkles },
  { to: '/marketplace', label: 'Marketplace', icon: Store },
]
const TITLES: Record<string, string> = { '/dashboard': 'Dashboard', '/twin': 'Financial Twin', '/companion': 'AI Companion', '/marketplace': 'Marketplace', '/settings': 'Settings' }

function NavItems({ collapsed, onNav }: { collapsed?: boolean; onNav?: () => void }) {
  return (
    <nav aria-label="Primary" className="flex flex-col gap-0.5">
      {NAV.map(({ to, label, icon: I }) => (
        <NavLink key={to} to={to} onClick={onNav} title={collapsed ? label : undefined} aria-label={label}
          className={({ isActive }) => `group relative flex h-9 items-center gap-3 rounded-lg px-2.5 text-sm font-medium transition-colors ${collapsed ? 'justify-center' : ''} ${isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100 hover:text-ink'}`}>
          {({ isActive }) => (<>
            {isActive && <span aria-hidden className="absolute -left-3 top-2 h-5 w-[3px] rounded-r bg-brand" />}
            <I size={17} strokeWidth={isActive ? 2.2 : 1.9} />{!collapsed && <span>{label}</span>}
          </>)}
        </NavLink>
      ))}
    </nav>
  )
}

export default function Layout() {
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem('mb.sidebar') === '1' } catch { return false } })
  const { profile, newConversation } = useStore()
  const nav = useNavigate()
  const { pathname } = useLocation()
  useEffect(() => { try { localStorage.setItem('mb.sidebar', collapsed ? '1' : '0') } catch { /* ignore */ } }, [collapsed])
  useEffect(() => { setOpen(false) }, [pathname])
  const startChat = () => { newConversation(); nav('/companion') }
  const initials = (profile?.name || 'AM').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  const title = TITLES[pathname] ?? 'MoneyBridge'

  const sidebar = (c: boolean) => (
    <div className="flex h-full flex-col gap-4 p-3">
      <div className={`flex h-10 items-center ${c ? 'justify-center' : 'gap-2.5 px-1'}`}><Logo size={28} />{!c && <span className="font-display text-lg font-semibold tracking-tight">MoneyBridge</span>}</div>
      <button onClick={startChat} title="New conversation" aria-label="New conversation" className={`flex h-9 items-center justify-center gap-2 rounded-lg bg-brand text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98] ${c ? 'w-full' : ''}`}><Plus size={16} />{!c && 'New conversation'}</button>
      <NavItems collapsed={c} />
      <div className="mt-auto space-y-1 border-t border-line pt-3">
        <NavLink to="/settings" aria-label="Settings" title="Settings" className={({ isActive }) => `flex items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-slate-100 ${isActive ? 'bg-blue-50' : ''} ${c ? 'justify-center' : ''}`}>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-teal-500 text-xs font-semibold text-white">{initials}</span>
          {!c && <><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold leading-tight">{profile?.name ?? 'Demo profile'}</span><span className="block text-2xs text-muted">Demo persona</span></span><Settings size={15} className="text-slate-400" /></>}
        </NavLink>
        <button onClick={() => setCollapsed(!c)} aria-label={c ? 'Expand sidebar' : 'Collapse sidebar'} className={`hidden h-8 w-full items-center gap-2 rounded-lg px-2.5 text-xs text-muted transition-colors hover:bg-slate-100 hover:text-ink lg:flex ${c ? 'justify-center' : ''}`}>
          {c ? <PanelLeftOpen size={16} /> : <><PanelLeftClose size={16} />Collapse</>}</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen lg:flex">
      <aside className={`sticky top-0 hidden h-screen shrink-0 border-r border-line bg-white transition-[width] duration-200 lg:block ${collapsed ? 'w-[68px]' : 'w-60'}`}>{sidebar(collapsed)}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="fade-in absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
          <div className="drawer-enter absolute inset-y-0 left-0 w-72 bg-white shadow-pop">
            <button aria-label="Close menu" onClick={() => setOpen(false)} className="absolute right-3 top-3 rounded-lg p-2 hover:bg-slate-100"><X size={18} /></button>
            {sidebar(false)}
          </div>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-12 items-center justify-between gap-3 border-b border-line bg-white/85 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <button aria-label="Open menu" onClick={() => setOpen(true)} className="-ml-2 rounded-lg p-2 hover:bg-slate-100 lg:hidden"><Menu size={18} /></button>
            <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm"><span className="hidden text-muted sm:inline">MoneyBridge</span><ChevronRight size={14} className="hidden text-slate-400 sm:block" /><span className="truncate font-semibold">{title}</span></nav>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-50 px-2.5 py-1 text-2xs font-semibold text-[#7a4a05]" title="All figures come from a fictional demo persona. No real accounts are connected.">
              <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />Demo mode<span className="hidden font-normal sm:inline"> · fictional data</span></span>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8"><div key={pathname} className="page-enter mx-auto max-w-[1180px]"><Outlet /></div></main>
      </div>
    </div>
  )
}
