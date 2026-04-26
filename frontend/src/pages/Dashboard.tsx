import { useQuery } from '@tanstack/react-query'
import { Activity, AlertTriangle, Cpu, TrendingUp } from 'lucide-react'
import { useStore } from '../store'
import { fetchHealth } from '../api/client'
import { useWebSocket } from '../hooks/useWebSocket'
import FaultBadge from '../components/FaultBadge'
import HealthGauge from '../components/HealthGauge'
import { formatDistanceToNow } from 'date-fns'

const FAULT_COLOR: Record<string, string> = {
  Normal: '#17C964', 'Inner Race': '#F5A524', 'Ball Fault': '#7828C8', 'Outer Race': '#F31260',
}

export default function Dashboard() {
  const machineId    = useStore(s => s.machineId)
  const latest       = useStore(s => s.latestPrediction)
  const recentEvents = useStore(s => s.recentEvents)
  useWebSocket(machineId)

  const { data: health } = useQuery({
    queryKey: ['health', machineId],
    queryFn: () => fetchHealth(machineId),
    refetchInterval: 5000,
  })

  const fColor    = latest ? (FAULT_COLOR[latest.fault_class] ?? '#006FEE') : '#006FEE'
  const faults24h = health?.fault_count_24h ?? 0

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        {[
          { label: 'Fault Class',  value: latest?.fault_class ?? '—', sub: latest ? `${(latest.confidence*100).toFixed(1)}% confidence` : 'No stream', color: fColor, icon: <Activity size={14}/> },
          { label: 'Faults (24h)', value: String(faults24h), sub: faults24h===0?'All clear':'Requires attention', color: faults24h===0?'#17C964':'#F5A524', icon: <AlertTriangle size={14}/> },
          { label: 'Latency',      value: latest?`${latest.latency_ms.toFixed(1)} ms`:'—', sub: 'ONNX runtime', color: '#006FEE', icon: <Cpu size={14}/> },
          { label: 'Health',       value: health?`${health.health_score.toFixed(0)}%`:'—', sub: health?.status??'—', color: !health?'#A1A1AA':health.health_score>75?'#17C964':health.health_score>40?'#F5A524':'#F31260', icon: <TrendingUp size={14}/> },
        ].map(p => <StatCard key={p.label} {...p} />)}
      </div>

      {/* ── Main grid — flex-1 to fill remaining height ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">

        {/* Health gauge */}
        <div className="card flex flex-col items-center justify-center gap-4">
          <HealthGauge score={health?.health_score ?? 100} />
          <div className="w-full border-t pt-4 grid grid-cols-2 gap-3 text-center" style={{ borderColor: 'var(--border)' }}>
            <div>
              <p className="stat-label">Faults (24h)</p>
              <p className="text-xl font-bold mt-0.5" style={{ color: 'var(--fg)' }}>{faults24h}</p>
            </div>
            <div>
              <p className="stat-label">Status</p>
              <div className="mt-1">{health ? <FaultBadge label={health.status} type="status" /> : <span style={{ color: 'var(--subtle)' }} className="text-[12px]">—</span>}</div>
            </div>
          </div>
        </div>

        {/* Live prediction */}
        <div className="card flex flex-col">
          <div className="flex items-center justify-between mb-4 shrink-0">
            <p className="text-[13px] font-semibold" style={{ color: 'var(--fg)' }}>Live Prediction</p>
            {latest?.is_fault && <span className="badge badge-outer animate-pulse">⚠ Fault</span>}
          </div>

          {latest ? (
            <div className="space-y-0 flex-1">
              {[
                ['Class',      <FaultBadge label={latest.fault_class} />],
                ['Confidence', <span className="font-mono text-[12px] font-semibold" style={{color:fColor}}>{(latest.confidence*100).toFixed(2)}%</span>],
                ['Fault ID',   <span className="font-mono text-[12px]" style={{color:'var(--fg)'}}>Class {latest.fault_id}</span>],
                ['Latency',    <span className="font-mono text-[12px]" style={{color:'var(--fg)'}}>{latest.latency_ms.toFixed(1)} ms</span>],
                ['Is Fault',   <span className="font-mono text-[12px] font-semibold" style={{color:latest.is_fault?'#F31260':'#17C964'}}>{latest.is_fault?'Yes':'No'}</span>],
              ].map(([k,v], i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b last:border-0" style={{borderColor:'var(--border)'}}>
                  <span className="text-[12px]" style={{color:'var(--muted)'}}>{k as string}</span>
                  {v}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 gap-2" style={{ color: 'var(--subtle)' }}>
              <Activity size={28} strokeWidth={1.5} />
              <p className="text-[12px]">Waiting for stream…</p>
            </div>
          )}
        </div>

        {/* Fault feed */}
        <div className="card flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <p className="text-[13px] font-semibold" style={{ color: 'var(--fg)' }}>Recent Faults</p>
            <span className="text-[11px]" style={{ color: 'var(--subtle)' }}>{recentEvents.length} events</span>
          </div>

          {recentEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-2" style={{ color: 'var(--subtle)' }}>
              <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                <span className="text-success">✓</span>
              </div>
              <p className="text-[12px]">No faults detected</p>
            </div>
          ) : (
            <ul className="space-y-1.5 overflow-y-auto flex-1">
              {recentEvents.slice(0, 20).map(e => (
                <li key={e.id} className="flex items-center gap-2 px-2.5 py-2 rounded-lg border transition-colors hover:opacity-80"
                  style={{ borderColor: 'var(--border)', background: 'var(--bg)' }}>
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: FAULT_COLOR[e.fault_class] ?? '#006FEE' }} />
                  <FaultBadge label={e.fault_class} />
                  <span className="ml-auto font-mono text-[11px]" style={{ color: 'var(--subtle)' }}>{(e.confidence*100).toFixed(0)}%</span>
                  <span className="font-mono text-[10px]" style={{ color: 'var(--subtle)' }}>
                    {formatDistanceToNow(new Date(e.timestamp), { addSuffix: true })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, color, icon }: { label:string; value:string; sub:string; color:string; icon:React.ReactNode }) {
  return (
    <div className="card flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="stat-label">{label}</span>
        <span style={{ color: 'var(--subtle)' }}>{icon}</span>
      </div>
      <p className="text-xl font-bold tracking-tight" style={{ color }}>{value}</p>
      <p className="stat-sub">{sub}</p>
    </div>
  )
}
