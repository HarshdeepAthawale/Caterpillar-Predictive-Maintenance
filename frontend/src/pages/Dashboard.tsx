import { useQuery } from '@tanstack/react-query'
import { Activity, AlertTriangle, CheckCircle, Cpu, Clock } from 'lucide-react'
import { useStore } from '../store'
import { fetchHealth, fetchHistory, fetchMachines } from '../api/client'
import { useWebSocket } from '../hooks/useWebSocket'
import FaultBadge from '../components/FaultBadge'
import HealthGauge from '../components/HealthGauge'
import { format } from 'date-fns'

export default function Dashboard() {
  const machineId   = useStore(s => s.machineId)
  const latest      = useStore(s => s.latestPrediction)
  const recentEvents = useStore(s => s.recentEvents)
  useWebSocket(machineId)

  const { data: health } = useQuery({
    queryKey: ['health', machineId],
    queryFn : () => fetchHealth(machineId),
    refetchInterval: 5000,
  })

  const { data: history } = useQuery({
    queryKey: ['history', machineId],
    queryFn : () => fetchHistory({ machine_id: machineId, limit: 10, hours: 24 }),
    refetchInterval: 10000,
  })

  const faultCount   = recentEvents.length
  const latency      = latest?.latency_ms ?? 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-fg">Dashboard</h1>
        <p className="text-muted text-sm mt-1">Machine: {machineId} — Real-time fault monitoring</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue/15">
            <Activity size={20} className="text-blue" />
          </div>
          <div>
            <p className="text-muted text-xs">Current Status</p>
            {latest ? (
              <FaultBadge label={latest.fault_class} size="sm" />
            ) : (
              <p className="text-fg text-sm font-semibold">—</p>
            )}
          </div>
        </div>

        <div className="card flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange/15">
            <AlertTriangle size={20} className="text-orange" />
          </div>
          <div>
            <p className="text-muted text-xs">Faults (session)</p>
            <p className="text-fg text-lg font-bold">{faultCount}</p>
          </div>
        </div>

        <div className="card flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green/15">
            <CheckCircle size={20} className="text-green" />
          </div>
          <div>
            <p className="text-muted text-xs">Confidence</p>
            <p className="text-fg text-lg font-bold">
              {latest ? `${(latest.confidence * 100).toFixed(1)}%` : '—'}
            </p>
          </div>
        </div>

        <div className="card flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan/15">
            <Cpu size={20} className="text-cyan" />
          </div>
          <div>
            <p className="text-muted text-xs">Latency</p>
            <p className="text-fg text-lg font-bold">{latency > 0 ? `${latency.toFixed(1)} ms` : '—'}</p>
          </div>
        </div>
      </div>

      {/* Health gauge + recent alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card flex flex-col items-center justify-center gap-2">
          <p className="text-fg font-semibold text-sm">Machine Health</p>
          <HealthGauge score={health?.health_score ?? 100} size={160} />
          {health && (
            <FaultBadge label={health.status} type="status" size="sm" />
          )}
          <p className="text-muted text-xs">Faults (24h): {health?.fault_count_24h ?? 0}</p>
        </div>

        <div className="card lg:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={15} className="text-muted" />
            <p className="text-fg text-sm font-semibold">Recent Fault Events</p>
          </div>
          {recentEvents.length === 0 && (!history || history.length === 0) ? (
            <p className="text-muted text-sm text-center py-8">No fault events detected</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentEvents.slice(0, 10).map(e => (
                <div key={e.id} className="flex items-center justify-between p-2 rounded-lg bg-bg border border-border text-sm">
                  <FaultBadge label={e.fault_class} size="sm" />
                  <span className="text-muted text-xs font-mono">
                    {(e.confidence * 100).toFixed(1)}%
                  </span>
                  <span className="text-muted text-xs">
                    {format(new Date(e.timestamp), 'HH:mm:ss')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
