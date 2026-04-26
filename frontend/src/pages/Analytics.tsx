import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend,
} from 'recharts'
import { fetchHistory, fetchModelMetrics } from '../api/client'
import { useStore } from '../store'

const COLORS = ['#66bb6a', '#ffa726', '#ab47bc', '#ef5350']

const TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: '#1a1d2e', border: '1px solid #2a2d3e', borderRadius: 8 },
  labelStyle  : { color: '#e0e0e0' },
  itemStyle   : { color: '#e0e0e0' },
}

export default function Analytics() {
  const machineId = useStore(s => s.machineId)

  const { data: history } = useQuery({
    queryKey: ['history-analytics', machineId],
    queryFn : () => fetchHistory({ machine_id: machineId, hours: 168, limit: 1000 }),
  })

  const { data: modelInfo } = useQuery({
    queryKey: ['model-metrics'],
    queryFn : fetchModelMetrics,
  })

  // Class distribution for pie chart
  const classCounts: Record<string, number> = {}
  history?.forEach(e => {
    classCounts[e.fault_class] = (classCounts[e.fault_class] ?? 0) + 1
  })
  const pieData = Object.entries(classCounts).map(([name, value]) => ({ name, value }))

  // Hourly fault rate for line chart
  const hourlyMap: Record<string, number> = {}
  history?.forEach(e => {
    const h = new Date(e.timestamp).toISOString().slice(0, 13)
    hourlyMap[h] = (hourlyMap[h] ?? 0) + (e.is_fault ? 1 : 0)
  })
  const lineData = Object.entries(hourlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-24)
    .map(([hour, faults]) => ({ hour: hour.slice(11) + 'h', faults }))

  // Avg latency per class bar chart
  const latencyMap: Record<string, number[]> = {}
  history?.forEach(e => {
    if (!latencyMap[e.fault_class]) latencyMap[e.fault_class] = []
    latencyMap[e.fault_class].push(e.latency_ms)
  })
  const latencyData = Object.entries(latencyMap).map(([cls, vals]) => ({
    class: cls,
    avg_ms: parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-fg">Analytics</h1>
        <p className="text-muted text-sm">Model performance & fault distribution — last 7 days</p>
      </div>

      {/* Model info cards */}
      {modelInfo && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Model',       value: modelInfo.model },
            { label: 'Framework',   value: modelInfo.framework },
            { label: 'Window Size', value: `${modelInfo.window_size} samples` },
            { label: 'Sample Rate', value: `${modelInfo.sample_rate / 1000} kHz` },
          ].map(({ label, value }) => (
            <div key={label} className="card">
              <p className="text-muted text-xs">{label}</p>
              <p className="text-fg font-semibold text-sm mt-1 truncate">{value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Fault Class Distribution — Pie */}
        <div className="card">
          <p className="text-fg text-sm font-semibold mb-4">Fault Class Distribution</p>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted text-sm text-center py-12">No data yet</p>
          )}
        </div>

        {/* Hourly Fault Rate — Line */}
        <div className="card">
          <p className="text-fg text-sm font-semibold mb-4">Hourly Fault Rate (last 24h)</p>
          {lineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
                <XAxis dataKey="hour" tick={{ fill: '#888', fontSize: 10 }} />
                <YAxis tick={{ fill: '#888', fontSize: 10 }} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Line type="monotone" dataKey="faults" stroke="#4fc3f7"
                  strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted text-sm text-center py-12">No data yet</p>
          )}
        </div>

        {/* Avg Latency per Class — Bar */}
        <div className="card">
          <p className="text-fg text-sm font-semibold mb-4">Avg Inference Latency per Class (ms)</p>
          {latencyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={latencyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
                <XAxis dataKey="class" tick={{ fill: '#888', fontSize: 10 }} />
                <YAxis tick={{ fill: '#888', fontSize: 10 }} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="avg_ms" radius={[4, 4, 0, 0]}>
                  {latencyData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted text-sm text-center py-12">No data yet</p>
          )}
        </div>

        {/* Fault Count per Class — Bar */}
        <div className="card">
          <p className="text-fg text-sm font-semibold mb-4">Total Events per Class</p>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={pieData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
                <XAxis dataKey="name" tick={{ fill: '#888', fontSize: 10 }} />
                <YAxis tick={{ fill: '#888', fontSize: 10 }} />
                <Tooltip {...TOOLTIP_STYLE} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted text-sm text-center py-12">No data yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
