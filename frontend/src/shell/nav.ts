import { GitBranch, Home, Sparkles, Store, Settings, type LucideIcon } from 'lucide-react'

export interface NavItem { to: string; label: string; full: string; icon: LucideIcon }
/** Short labels fit the 72px rail; `full` is the accessible name. */
export const NAV: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', full: 'Dashboard', icon: Home },
  { to: '/twin', label: 'Twin', full: 'Financial Twin', icon: GitBranch },
  { to: '/companion', label: 'AI', full: 'AI Companion', icon: Sparkles },
  { to: '/marketplace', label: 'Market', full: 'Marketplace', icon: Store },
]
export const SETTINGS: NavItem = { to: '/settings', label: 'Settings', full: 'Settings', icon: Settings }
export const CRUMBS: Record<string, string> = { '/dashboard': 'Overview', '/twin': 'Financial Twin', '/companion': 'AI Companion', '/marketplace': 'Marketplace', '/settings': 'Settings' }
