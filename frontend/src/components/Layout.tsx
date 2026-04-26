import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, Activity, Clock, BarChart2, Settings } from 'lucide-react'
import { useStore } from '../store'

const nav = [
  { to: '/dashboard', label: 'Dashboard',    icon: LayoutDashboard },
  { to: '/monitor',   label: 'Live Monitor', icon: Activity },
  { to: '/history',   label: 'Fault History',icon: Clock },
  { to: '/analytics', label: 'Analytics',    icon: BarChart2 },
]

export default function Layout() {
  const isConnected = useStore(s => s.isConnected)

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 bg-cat-dark flex flex-col shrink-0 shadow-md">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            {/* CAT logo mark */}
            <div className="w-9 h-9 bg-cat-yellow rounded-lg flex items-center justify-center shrink-0">
              <span className="text-cat-dark font-black text-sm tracking-tighter">CAT</span>
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">Predictive</p>
              <p className="text-white/50 text-xs">Maintenance</p>
            </div>
          </div>
        </div>

        {/* Machine selector */}
        <div className="px-4 py-3 border-b border-white/10">
          <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-1.5">Machine</p>
          <MachineSelector />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                 ${isActive
                   ? 'bg-cat-yellow text-cat-dark shadow-sm'
                   : 'text-white/60 hover:text-white hover:bg-white/8'}`
              }
            >
              <Icon size={16} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Connection dot */}
        <div className="px-5 py-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            <span className="text-white/40 text-xs">{isConnected ? 'Live stream active' : 'Disconnected'}</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-surface border-b border-border px-6 py-3 flex items-center justify-between shrink-0">
          <p className="text-muted text-sm">Caterpillar Inc. — Heavy Machinery Fault Detection</p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted font-mono bg-bg px-2.5 py-1 rounded-lg border border-border">
              CNN-LSTM + Attention
            </span>
            <div className={`px-2.5 py-1 rounded-lg text-xs font-medium border
              ${isConnected
                ? 'bg-success/8 text-success border-success/20'
                : 'bg-danger/8 text-danger border-danger/20'}`}>
              {isConnected ? '● Live' : '○ Offline'}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function MachineSelector() {
  const { machineId, setMachineId } = useStore(s => ({
    machineId: s.machineId, setMachineId: s.setMachineId,
  }))
  const machines = ['machine_01', 'machine_02', 'machine_03']
  return (
    <select
      value={machineId}
      onChange={e => setMachineId(e.target.value)}
      className="w-full bg-white/8 border border-white/15 text-white text-sm rounded-lg px-3 py-1.5
                 focus:outline-none focus:ring-1 focus:ring-cat-yellow"
    >
      {machines.map(m => <option key={m} value={m} className="bg-cat-dark">{m}</option>)}
    </select>
  )
}
