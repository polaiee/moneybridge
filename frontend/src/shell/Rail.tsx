import { NavLink } from 'react-router-dom'
import { Logo } from '../components/ui'
import { NAV, SETTINGS, type NavItem } from './nav'

function RailItem({ item }: { item: NavItem }) {
  const I = item.icon
  return (
    <NavLink to={item.to} aria-label={item.full} title={item.full} className="group flex h-14 w-14 flex-col items-center justify-center gap-1 rounded-xl">
      {({ isActive }) => (<>
        <span className={`flex h-7 w-10 items-center justify-center rounded-full transition-colors ${isActive ? 'bg-lime-400 text-forest-900' : 'text-slate-600 group-hover:bg-forest-100'}`}><I size={18} strokeWidth={isActive ? 2.3 : 1.8} /></span>
        <span className={`text-[10px] leading-none ${isActive ? 'font-bold text-forest-900' : 'font-medium text-slate-600'}`}>{item.label}</span>
      </>)}
    </NavLink>
  )
}

/** Flat 72px rail: logo mark, four destinations, settings. No profile card, no banners. */
export default function Rail() {
  return (
    <aside className="sticky top-0 hidden h-screen w-[72px] shrink-0 flex-col items-center border-r border-sand-200 bg-ivory py-3 md:flex">
      <NavLink to="/dashboard" aria-label="MoneyBridge home" className="rounded-xl"><Logo size={36} /></NavLink>
      <nav aria-label="Primary" className="mt-6 flex flex-col items-center gap-1">{NAV.map((n) => <RailItem key={n.to} item={n} />)}</nav>
      <div className="mt-auto"><RailItem item={SETTINGS} /></div>
    </aside>
  )
}
