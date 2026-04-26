import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, Activity, Clock, BarChart2, Cpu } from 'lucide-react'
import { useStore } from '../store'

const nav = [
  { to: '/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/monitor',   label: 'Live Monitor', icon: Activity },
  { to: '/history',   label: 'Fault History', icon: Clock },
  { to: '/analytics', label: 'Analytics',   icon: BarChart2 },
]

export default function Layout() {
  const isConnected = useStore(s => s.isConnected)

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      {/* Sidebar */}
      <aside className="w-56 bg-surface border-r border-border flex flex-col shrink-0">
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Cpu size={20} className="text-blue" />
            <div>
              <p className="text-fg text-sm font-semibold leading-tight">Caterpillar</p>
              <p className="text-muted text-xs">Predictive Maintenance</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to} to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors
                 ${isActive
                   ? 'bg-blue/15 text-blue font-medium'
                   : 'text-muted hover:text-fg hover:bg-white/5'}`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Connection status */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2 text-xs">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green animate-pulse' : 'bg-red'}`} />
            <span className="text-muted">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
