import { useQuery } from '@tanstack/react-query'
import { Activity, AlertTriangle, CheckCircle, Zap, TrendingUp, Clock } from 'lucide-react'
import { useStore } from '../store'
import { fetchHealth, fetchHistory } from '../api/client'
import { useWebSocket } from '../hooks/useWebSocket'
import FaultBadge from '../components/FaultBadge'
import HealthGauge from '../components/HealthGauge'
import { format } from 'date-fns'

const FAULT_COLORS: Record<string, string> = {
  Normal      : '#16A34A',
  'Inner Race': '#D97706',
  'Ball Fault': '#7C3AED',
  'Outer Race': '#DC2626',
}

export default function Dashboard() {
  const machineId    = useStore(s => s.machineId)
  const latest       = useStore(s => s.latestPrediction)
  const recentEvents = useStore(s => s.recentEvents)
  useWebSocket(machineId)

  const { data: health } = useQuery({
    queryKey: ['health', machineId],
    queryFn : () => fetchHealth(machineId),
    refetchInterval: 5000,
  })

  const { data: history } = useQuery({
    queryKey: ['history', machineId],
    queryFn : () => fetchHistory({ machine_id: machineId, limit: 8, hours: 24 }),
    refetchInterval: 15000,
  })

  const faultColor = latest ? FAULT_COLORS[latest.fault_class] ?? '#2563EB' : '#2563EB'

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-fg">Overview</h1>
        <p className="text-muted text-sm mt-0.5">Real-time health monitoring for {machineId}</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={<Activity size={18} className="text-info" />}
          iconBg="bg-info/10"
          label="Current Fault"
          value={latest?.fault_class ?? '—'}
          sub={latest ? `${(latest.confidence * 100).toFixed(1)}% confidence` : 'No signal'}
          accent={faultColor}
        />
        <KPICard
          icon={<AlertTriangle size={18} className="text-warning" />}
          iconBg="bg-warning/10"
          label="Faults (session)"
          value={String(recentEvents.length)}
          sub="since stream started"
        />
        <KPICard
          icon={<CheckCircle size={18} className="text-success" />}
          iconBg="bg-success/10"
          label="Health Score"
          value={health ? `${health.health_score.toFixed(0)}%` : '—'}
          sub={health?.status ?? 'loading'}
        />
        <KPICard
          icon={<Zap size={18} className="text-purple" />}
          iconBg="bg-purple/10"
          label="Inference Latency"
          value={latest ? `${latest.latency_ms.toFixed(1)} ms` : '—'}
          sub="ONNX runtime"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Health gauge */}
        <div className="card flex flex-col items-center justify-center gap-4 py-8">
          <HealthGauge score={health?.health_score ?? 100} size={160} />
          <div className="text-center">
            <p className="text-sm text-muted">Faults detected (24h)</p>
            <p className="text-2xl font-bold text-fg mt-0.5">{health?.fault_count_24h ?? 0}</p>
          </div>
          {health && (
            <div className="w-full border-t border-border pt-3 text-center">
              <p className="text-xs text-muted">Last fault</p>
              <p className="text-sm font-medium text-fg mt-0.5">
                {health.last_fault_class}
              </p>
            </div>
          )}
        </div>

        {/* Live prediction */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={15} className="text-muted" />
            <p className="text-sm font-semibold text-fg">Live Prediction</p>
            {latest?.is_fault && (
              <span className="ml-auto text-xs font-semibold text-danger flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-danger animate-ping inline-block" />
                FAULT
              </span>
            )}
          </div>
          {latest ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-bg border border-border">
                <span className="text-sm text-muted">Classification</span>
                <FaultBadge label={latest.fault_class} />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-bg border border-border">
                <span className="text-sm text-muted">Confidence</span>
                <span className="text-sm font-bold" style={{ color: faultColor }}>
                  {(latest.confidence * 100).toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-bg border border-border">
                <span className="text-sm text-muted">Fault ID</span>
                <span className="text-sm font-mono text-fg">Class {latest.fault_id}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-bg border border-border">
                <span className="text-sm text-muted">Latency</span>
                <span className="text-sm font-mono text-fg">{latest.latency_ms.toFixed(1)} ms</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted">
              <Activity size={32} className="mb-2 opacity-30" />
              <p className="text-sm">Waiting for stream...</p>
            </div>
          )}
        </div>

        {/* Recent fault events */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={15} className="text-muted" />
            <p className="text-sm font-semibold text-fg">Recent Fault Events</p>
            <span className="ml-auto text-xs text-muted">{recentEvents.length} total</span>
          </div>
          {recentEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-muted">
              <CheckCircle size={28} className="mb-2 text-success opacity-50" />
              <p className="text-sm">No faults detected</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {recentEvents.slice(0, 12).map(e => (
                <div key={e.id}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-border bg-bg hover:bg-white transition-colors">
                  <div className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: FAULT_COLORS[e.fault_class] ?? '#2563EB' }} />
                  <FaultBadge label={e.fault_class} />
                  <span className="text-xs text-muted ml-auto font-mono">
                    {(e.confidence * 100).toFixed(0)}%
                  </span>
                  <span className="text-xs text-muted font-mono">
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

interface KPICardProps {
  icon: React.ReactNode
  iconBg: string
  label: string
  value: string
  sub: string
  accent?: string
}

function KPICard({ icon, iconBg, label, value, sub, accent }: KPICardProps) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`p-2.5 rounded-xl ${iconBg} shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-muted font-medium">{label}</p>
        <p className="text-lg font-bold text-fg truncate" style={accent ? { color: accent } : {}}>
          {value}
        </p>
        <p className="text-xs text-muted truncate">{sub}</p>
      </div>
    </div>
  )
}
