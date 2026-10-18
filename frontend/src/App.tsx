import { Navigate, Route, Routes } from 'react-router-dom'
import AppShell from './shell/AppShell'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Twin from './pages/Twin'
import Companion from './pages/Companion'
import Marketplace from './pages/Marketplace'
import Settings from './pages/Settings'
import { useStore } from './store'

export default function App() {
  const { profile } = useStore()
  return (
    <Routes>
      <Route path="/onboarding" element={<Onboarding />} />
      {profile ? (
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/twin" element={<Twin />} />
          <Route path="/companion" element={<Companion />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      ) : <Route path="*" element={<Navigate to="/onboarding" replace />} />}
    </Routes>
  )
}
