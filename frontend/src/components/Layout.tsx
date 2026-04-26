import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Activity, Clock, BarChart2, ChevronDown, Circle, Sun, Moon } from 'lucide-react'
import { useStore } from '../store'
import { clsx } from 'clsx'

const NAV = [
  { to: '/dashboard', label: 'Overview',     icon: LayoutDashboard },
  { to: '/monitor',   label: 'Live Monitor', icon: Activity },
  { to: '/history',   label: 'History',      icon: Clock },
  { to: '/analytics', label: 'Analytics',    icon: BarChart2 },
]
const MACHINES = ['machine_01', 'machine_02', 'machine_03']

export default function Layout() {
  const { isConnected, darkMode, toggleDark, machineId, setMachineId } = useStore(s => ({
    isConnected : s.isConnected,
    darkMode    : s.darkMode,
    toggleDark  : s.toggleDark,
    machineId   : s.machineId,
    setMachineId: s.setMachineId,
  }))

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: 'var(--bg)' }}>

      {/* ── Sidebar ── */}
      <aside className="w-[210px] flex flex-col shrink-0 border-r" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>

        {/* Logo */}
        <div className="h-12 px-4 flex items-center gap-2.5 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
          <span className="w-6 h-6 bg-yellow rounded flex items-center justify-center shrink-0">
            <span className="font-black text-[9px] text-[#0A0A0A] tracking-tighter">CAT</span>
          </span>
          <span className="font-semibold text-[13px]" style={{ color: 'var(--fg)' }}>Maintenance</span>
        </div>

        {/* Machine picker */}
        <div className="px-3 py-3 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
          <p className="section-label mb-1.5">Machine</p>
          <div className="relative">
            <select
              value={machineId}
              onChange={e => setMachineId(e.target.value)}
              className="w-full appearance-none rounded px-3 py-1.5 pr-7 text-[13px] font-medium
                         focus:outline-none focus:ring-2 focus:ring-yellow/40 cursor-pointer"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--fg)' }}
            >
              {MACHINES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--muted)' }} />
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          <p className="section-label px-2 mb-2">Navigation</p>
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}>
              {({ isActive }) => (
                <div className={clsx('nav-item', isActive && 'active')}>
                  <Icon size={14} strokeWidth={isActive ? 2.5 : 2} />
                  <span>{label}</span>
                  {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-yellow" />}
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t shrink-0 flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <Circle size={7} className={isConnected ? 'text-success fill-success' : 'text-danger fill-danger'} />
            <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
          {/* Dark mode toggle */}
          <button onClick={toggleDark}
            className="p-1.5 rounded-lg transition-colors hover:opacity-80"
            style={{ background: 'var(--bg)', color: 'var(--muted)' }}
            title={darkMode ? 'Light mode' : 'Dark mode'}>
            {darkMode ? <Sun size={13} /> : <Moon size={13} />}
          </button>
        </div>
      </aside>

      {/* ── Right panel ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <header className="h-12 px-5 flex items-center justify-between border-b shrink-0"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <PageTitle />
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded"
              style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--subtle)' }}>
              CNN-LSTM + Attention
            </span>
            <div className={clsx(
              'flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold border',
              isConnected ? 'text-success bg-success/8 border-success/20' : 'text-danger bg-danger/8 border-danger/20'
            )}>
              <Circle size={6} className={isConnected ? 'fill-success' : 'fill-danger'} />
              {isConnected ? 'Live' : 'Offline'}
            </div>
          </div>
        </header>

        {/* Page content — flex-1 so it fills all remaining height */}
        <main className="flex-1 overflow-y-auto p-5">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function PageTitle() {
  const loc = useLocation()
  const TITLES: Record<string, string> = {
    '/dashboard': 'Overview', '/monitor': 'Live Monitor',
    '/history': 'Fault History', '/analytics': 'Analytics',
  }
  return <span className="text-[13px] font-semibold" style={{ color: 'var(--fg)' }}>{TITLES[loc.pathname] ?? ''}</span>
}
