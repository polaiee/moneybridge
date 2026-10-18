import { Outlet, useLocation } from 'react-router-dom'
import BottomTabs from './BottomTabs'
import Rail from './Rail'
import TopBar from './TopBar'

/** One app frame: slim rail, slim top bar, bento content area. */
export default function AppShell() {
  const { pathname } = useLocation()
  return (
    <div className="min-h-screen md:flex">
      <Rail />
      <div className="min-w-0 flex-1">
        <TopBar />
        <main className="px-4 pb-24 pt-5 sm:px-6 md:pb-10 lg:px-8"><div key={pathname} className="page-enter mx-auto max-w-[1280px]"><Outlet /></div></main>
      </div>
      <BottomTabs />
    </div>
  )
}
