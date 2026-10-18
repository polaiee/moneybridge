import { NavLink } from 'react-router-dom'
import { NAV, SETTINGS } from './nav'

/** Mobile (<768px): the rail becomes a bottom tab bar with the same destinations plus Settings ("More"). */
export default function BottomTabs() {
  const items = [...NAV, { ...SETTINGS, label: 'More' }]
  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch justify-around border-t border-sand-200 bg-ivory/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      {items.map((it) => { const I = it.icon; return (
        <NavLink key={it.to} to={it.to} aria-label={it.full} className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1">
          {({ isActive }) => (<>
            <span className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${isActive ? 'bg-lime-400 text-forest-900' : 'text-slate-600'}`}><I size={19} strokeWidth={isActive ? 2.3 : 1.8} /></span>
            <span className={`text-[10px] leading-none ${isActive ? 'font-bold text-forest-900' : 'font-medium text-slate-600'}`}>{it.label}</span>
          </>)}
        </NavLink>) })}
    </nav>
  )
}
