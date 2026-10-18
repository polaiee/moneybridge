import { Link, useLocation } from 'react-router-dom'
import { Logo } from '../components/ui'
import { useStore } from '../store'
import { CRUMBS } from './nav'
import PeriodPill from './PeriodPill'
import SearchBox from './SearchBox'

/** Persistent in the shell: the Demo-mode pill is visible on every page and breakpoint. */
function DemoPill() {
  return (
    <span className="inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-full border border-lime-300 bg-lime-100 px-3 text-xs font-semibold text-forest-900" title="All figures come from a fictional demo persona. No real accounts are connected.">
      <span aria-hidden className="h-2 w-2 animate-pulse rounded-full bg-lime-600" />
      <span className="min-[480px]:hidden">Demo</span><span className="hidden min-[480px]:inline">Demo mode</span>
      <span className="hidden font-normal text-forest-800 xl:inline">· fictional data</span>
    </span>
  )
}

export default function TopBar() {
  const { profile } = useStore()
  const { pathname } = useLocation()
  const initials = (profile?.name || 'AM').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-sand-200 bg-ivory/85 px-4 backdrop-blur sm:px-6 lg:px-8">
      <Link to="/dashboard" aria-label="MoneyBridge home" className="shrink-0 md:hidden"><Logo size={30} /></Link>
      <nav aria-label="Breadcrumb" className="eyebrow hidden shrink-0 items-center gap-1.5 lg:flex"><span>Personal finance</span><span className="text-sand-400">/</span><span className="!text-forest-900">{CRUMBS[pathname] ?? 'MoneyBridge'}</span></nav>
      <SearchBox />
      <div className="ml-auto flex shrink-0 items-center gap-2">
        <PeriodPill /><DemoPill />
        <Link to="/settings" aria-label="Profile and settings" className="hidden h-9 w-9 items-center justify-center rounded-full bg-forest-900 text-xs font-bold text-lime-400 transition-transform hover:scale-105 sm:flex">{initials}</Link>
      </div>
    </header>
  )
}
