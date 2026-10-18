import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Home, GitBranch, Sparkles, Store, Settings, Plus, Menu, X, PanelLeftClose, PanelLeftOpen, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Logo } from './ui'
import { useStore } from '../store'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: Home },
  { to: '/twin', label: 'Financial Twin', icon: GitBranch },
  { to: '/companion', label: 'AI Companion', icon: Sparkles },
  { to: '/marketplace', label: 'Marketplace', icon: Store },
]
const TITLES: Record<string, string> = { '/dashboard': 'Overview', '/twin': 'Financial Twin', '/companion': 'AI Companion', '/marketplace': 'Marketplace', '/settings': 'Settings' }

function NavItems({ collapsed, onNav }: { collapsed?: boolean; onNav?: () => void }) {
  return (
    <nav aria-label="Primary" className="flex flex-col gap-1">
      {NAV.map(({ to, label, icon: I }) => (
        <NavLink key={to} to={to} onClick={onNav} title={collapsed ? label : undefined} aria-label={label}
          className={({ isActive }) => `group flex h-11 items-center gap-3 rounded-full px-3.5 text-sm font-medium transition-all duration-150 ${collapsed ? 'justify-center px-0' : ''} ${isActive ? 'bg-lime-400 font-semibold text-forest-900 shadow-sm' : 'text-slate-600 hover:bg-forest-100/70 hover:text-forest-900'}`}>
          {({ isActive }) => (<><I size={18} strokeWidth={isActive ? 2.3 : 1.8} />{!collapsed && <span>{label}</span>}</>)}
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
    <div className="flex h-full flex-col gap-5 p-4">
      <div className={`flex items-center ${c ? 'justify-center' : 'gap-3 px-1'}`}>
        <Logo />{!c && <div className="leading-tight"><div className="font-display text-[1.6rem] leading-none text-forest-900">MoneyBridge</div><div className="eyebrow mt-1 !text-[0.625rem]">Personal workspace</div></div>}
      </div>
      {!c && (
        <div className="flex items-center gap-3 rounded-2xl border border-sand-200 bg-ivory/70 p-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime-400 text-xs font-bold text-forest-900">{initials}</span>
          <span className="min-w-0"><span className="block truncate text-sm font-semibold leading-tight">{profile?.name ?? 'Demo profile'}</span><span className="block text-2xs text-muted">Demo persona</span></span>
        </div>
      )}
      <button onClick={startChat} title="New conversation" aria-label="New conversation" className={`flex h-10 items-center justify-center gap-2 rounded-full bg-forest-900 text-sm font-semibold text-ivory shadow-sm transition-all hover:bg-forest-800 active:scale-[0.98] ${c ? 'mx-auto w-10' : ''}`}><Plus size={16} />{!c && 'New conversation'}</button>
      <div>
        {!c && <div className="eyebrow mb-2 px-3.5">Workspace</div>}
        <NavItems collapsed={c} onNav={() => setOpen(false)} />
      </div>
      <div className="mt-auto space-y-2">
        {!c && (
          <div className="rounded-2xl bg-forest-900 p-3.5 text-ivory">
            <div className="flex items-center gap-2 text-xs font-semibold"><ShieldCheck size={15} className="text-lime-400" />Demo mode</div>
            <p className="mt-1 text-2xs leading-snug text-ivory/75">Every figure is fictional. No accounts are connected and nothing is stored on a server.</p>
          </div>
        )}
        <NavLink to="/settings" aria-label="Settings" title="Settings" className={({ isActive }) => `flex h-10 items-center gap-3 rounded-full px-3.5 text-sm transition-colors hover:bg-forest-100/70 ${isActive ? 'bg-forest-100 font-semibold' : 'text-slate-600'} ${c ? 'justify-center px-0' : ''}`}><Settings size={17} />{!c && 'Settings'}</NavLink>
        <button onClick={() => setCollapsed(!c)} aria-label={c ? 'Expand sidebar' : 'Collapse sidebar'} className={`hidden h-9 w-full items-center gap-3 rounded-full px-3.5 text-xs text-muted transition-colors hover:bg-forest-100/70 hover:text-forest-900 lg:flex ${c ? 'justify-center px-0' : ''}`}>
          {c ? <PanelLeftOpen size={16} /> : <><PanelLeftClose size={16} />Collapse</>}</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen lg:flex">
      <aside className={`sticky top-0 hidden h-screen shrink-0 p-3 pr-0 transition-[width] duration-200 lg:block ${collapsed ? 'w-[84px]' : 'w-[272px]'}`}>
        <div className="h-full overflow-y-auto rounded-[28px] border border-sand-200 bg-card/80 shadow-sm backdrop-blur">{sidebar(collapsed)}</div>
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="fade-in absolute inset-0 bg-forest-950/45" onClick={() => setOpen(false)} />
          <div className="drawer-enter absolute inset-y-2 left-2 w-[300px] overflow-y-auto rounded-[28px] bg-card shadow-pop">
            <button aria-label="Close menu" onClick={() => setOpen(false)} className="absolute right-3 top-3 rounded-full p-2 hover:bg-forest-50"><X size={18} /></button>
            {sidebar(false)}
          </div>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 bg-ivory/80 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-2">
            <button aria-label="Open menu" onClick={() => setOpen(true)} className="-ml-2 rounded-full p-2 hover:bg-forest-100 lg:hidden"><Menu size={19} /></button>
            <nav aria-label="Breadcrumb" className="eyebrow flex min-w-0 items-center gap-1.5 !tracking-[0.1em]"><span className="hidden sm:inline">Personal finance</span><span className="hidden text-sand-400 sm:inline">/</span><span className="truncate !text-forest-900">{title}</span></nav>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            <span className="inline-flex items-center gap-2 rounded-full border border-lime-300 bg-lime-100 px-3 py-1.5 text-xs font-semibold text-forest-900" title="All figures come from a fictional demo persona. No real accounts are connected.">
              <span aria-hidden className="h-2 w-2 animate-pulse rounded-full bg-lime-600" />Demo mode<span className="hidden font-normal text-forest-800 sm:inline"> · fictional data</span></span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-900 text-xs font-bold text-lime-400" aria-hidden>{initials}</span>
          </div>
        </header>
        <main className="px-4 pb-10 pt-2 sm:px-6 lg:px-8"><div key={pathname} className="page-enter mx-auto max-w-[1240px]"><Outlet /></div></main>
      </div>
    </div>
  )
}
