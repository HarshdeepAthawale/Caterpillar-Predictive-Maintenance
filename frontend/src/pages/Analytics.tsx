import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts'
import { fetchHistory, fetchModelMetrics } from '../api/client'
import { useStore } from '../store'
import { Cpu, Layers, Zap, Activity } from 'lucide-react'

const COLORS  = ['#16A34A', '#D97706', '#7C3AED', '#DC2626']
const TOOLTIP = {
  contentStyle: {
    backgroundColor: '#fff', border: '1px solid #E5E7EB',
    borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  },
  labelStyle: { color: '#111827', fontWeight: 600 },
  itemStyle : { color: '#6B7280' },
}

export default function Analytics() {
  const machineId = useStore(s => s.machineId)

  const { data: history } = useQuery({
    queryKey: ['analytics-history', machineId],
    queryFn : () => fetchHistory({ machine_id: machineId, hours: 168, limit: 1000 }),
  })

  const { data: modelInfo } = useQuery({
    queryKey: ['model-metrics'],
    queryFn : fetchModelMetrics,
  })

  // Fault class distribution
  const classCounts: Record<string, number> = {}
  history?.forEach(e => { classCounts[e.fault_class] = (classCounts[e.fault_class] ?? 0) + 1 })
  const pieData = Object.entries(classCounts).map(([name, value]) => ({ name, value }))

  // Hourly fault rate (last 24h)
  const hourlyMap: Record<string, number> = {}
  history?.forEach(e => {
    const h = new Date(e.timestamp).toISOString().slice(0, 13)
    hourlyMap[h] = (hourlyMap[h] ?? 0) + (e.is_fault ? 1 : 0)
  })
  const lineData = Object.entries(hourlyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-24)
    .map(([hour, faults]) => ({ hour: hour.slice(11) + 'h', faults }))

  // Avg latency per class
  const latMap: Record<string, number[]> = {}
  history?.forEach(e => { (latMap[e.fault_class] ??= []).push(e.latency_ms) })
  const latData = Object.entries(latMap).map(([cls, vals]) => ({
    class: cls, avg: parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)),
  }))

  const modelCards = modelInfo ? [
    { icon: <Cpu size={16} className="text-info" />, label: 'Model', value: modelInfo.model },
    { icon: <Layers size={16} className="text-purple" />, label: 'Framework', value: modelInfo.framework },
    { icon: <Zap size={16} className="text-warning" />, label: 'Window', value: `${modelInfo.window_size} samples` },
    { icon: <Activity size={16} className="text-success" />, label: 'Sample Rate', value: `${modelInfo.sample_rate / 1000} kHz` },
  ] : []

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-fg">Analytics</h1>
        <p className="text-muted text-sm">Fault distribution & model performance — last 7 days</p>
      </div>

      {/* Model info */}
      {modelInfo && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {modelCards.map(({ icon, label, value }) => (
            <div key={label} className="card flex items-center gap-3">
              <div className="p-2 rounded-lg bg-bg shrink-0">{icon}</div>
              <div>
                <p className="text-xs text-muted">{label}</p>
                <p className="text-sm font-semibold text-fg truncate">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Fault class distribution */}
        <div className="card">
          <p className="text-sm font-semibold text-fg mb-1">Fault Class Distribution</p>
          <p className="text-xs text-muted mb-5">Breakdown of all detected classes</p>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" outerRadius={85} innerRadius={45}
                  paddingAngle={3}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#D1D5DB' }}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...TOOLTIP} />
              </PieChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>

        {/* Hourly fault rate */}
        <div className="card">
          <p className="text-sm font-semibold text-fg mb-1">Hourly Fault Rate</p>
          <p className="text-xs text-muted mb-5">Number of faults per hour (last 24h)</p>
          {lineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={230}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="hour" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP} />
                <Line type="monotone" dataKey="faults" stroke="#2563EB"
                  strokeWidth={2.5} dot={{ r: 3, fill: '#2563EB' }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>

        {/* Avg inference latency */}
        <div className="card">
          <p className="text-sm font-semibold text-fg mb-1">Avg Inference Latency per Class</p>
          <p className="text-xs text-muted mb-5">ONNX runtime latency in milliseconds</p>
          {latData.length > 0 ? (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={latData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="class" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP} />
                <Bar dataKey="avg" radius={[6, 6, 0, 0]} name="Avg ms">
                  {latData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>

        {/* Total events per class */}
        <div className="card">
          <p className="text-sm font-semibold text-fg mb-1">Total Events per Class</p>
          <p className="text-xs text-muted mb-5">Event count breakdown by fault type</p>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={pieData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip {...TOOLTIP} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Events">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyChart />}
        </div>
      </div>
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-52 text-muted text-sm">
      No data available yet
    </div>
  )
}
