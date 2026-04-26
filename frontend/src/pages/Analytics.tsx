import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid,
} from 'recharts'
import { fetchHistory, fetchModelMetrics } from '../api/client'
import { useStore } from '../store'
import { Cpu, Layers, Zap, Activity } from 'lucide-react'

const PALETTE = ['#17C964', '#F5A524', '#7828C8', '#F31260']

export default function Analytics() {
  const machineId = useStore(s => s.machineId)
  const darkMode  = useStore(s => s.darkMode)

  const { data: history } = useQuery({
    queryKey: ['analytics', machineId],
    queryFn : () => fetchHistory({ machine_id: machineId, hours: 168, limit: 2000 }),
  })
  const { data: model } = useQuery({
    queryKey: ['model-info'],
    queryFn : fetchModelMetrics,
  })

  const classCounts: Record<string, number> = {}
  history?.forEach(e => { classCounts[e.fault_class] = (classCounts[e.fault_class] ?? 0) + 1 })
  const pieData = Object.entries(classCounts).map(([name, value]) => ({ name, value }))

  const hourMap: Record<string, number> = {}
  history?.forEach(e => {
    const h = new Date(e.timestamp).toISOString().slice(0, 13)
    hourMap[h] = (hourMap[h] ?? 0) + (e.is_fault ? 1 : 0)
  })
  const lineData = Object.entries(hourMap)
    .sort(([a],[b]) => a.localeCompare(b)).slice(-24)
    .map(([h, faults]) => ({ hour: h.slice(11)+'h', faults }))

  const latMap: Record<string, number[]> = {}
  history?.forEach(e => { (latMap[e.fault_class] ??= []).push(e.latency_ms) })
  const latData = Object.entries(latMap).map(([cls, vals]) => ({
    class: cls.split(' ')[0],
    avg: +(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(2),
  }))

  const gridColor  = darkMode ? '#2F3336' : '#F7F7F8'
  const tickColor  = darkMode ? '#536471' : '#A1A1AA'
  const tipStyle   = {
    contentStyle: { background: darkMode?'#16181C':'#fff', border: `1px solid ${darkMode?'#2F3336':'#E8E8EC'}`, borderRadius: 10, fontSize: 12 },
    labelStyle: { color: darkMode?'#E7E9EA':'#0A0A0A', fontWeight: 600 },
    itemStyle : { color: darkMode?'#71767B':'#6E6E80' },
  }
  const axisProps = {
    tick: { fill: tickColor, fontSize: 11, fontFamily: 'JetBrains Mono' },
    axisLine: false as const, tickLine: false as const,
  }

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* Model meta cards */}
      {model && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
          {[
            { icon: <Cpu size={14} className="text-info" />,     k:'Model',       v: model.model },
            { icon: <Layers size={14} className="text-violet" />, k:'Framework',   v: model.framework },
            { icon: <Zap size={14} className="text-warning" />,  k:'Window',      v: `${model.window_size} samples` },
            { icon: <Activity size={14} className="text-success" />, k:'Sample Rate', v: `${model.sample_rate/1000} kHz` },
          ].map(({ icon, k, v }) => (
            <div key={k} className="card flex items-center gap-3 py-3">
              <div className="p-2 rounded-lg shrink-0" style={{ background: 'var(--bg)' }}>{icon}</div>
              <div>
                <p className="section-label">{k}</p>
                <p className="text-[13px] font-semibold truncate mt-0.5" style={{ color: 'var(--fg)' }}>{v}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Charts grid — flex-1 fills remaining space */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 min-h-0">
        {[
          {
            title: 'Fault Class Distribution', sub: 'Breakdown of detected classes',
            chart: pieData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                    outerRadius="70%" innerRadius="42%" paddingAngle={3} strokeWidth={0}>
                    {pieData.map((_,i) => <Cell key={i} fill={PALETTE[i%4]} />)}
                  </Pie>
                  <Tooltip {...tipStyle} />
                </PieChart>
              </ResponsiveContainer>
            ) : null,
          },
          {
            title: 'Hourly Fault Rate', sub: 'Faults per hour — last 24h',
            chart: lineData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="4 4" stroke={gridColor} />
                  <XAxis dataKey="hour" {...axisProps} />
                  <YAxis {...axisProps} />
                  <Tooltip {...tipStyle} />
                  <Line type="monotone" dataKey="faults" stroke="#006FEE"
                    strokeWidth={2} dot={{ r:2.5, fill:'#006FEE', strokeWidth:0 }} activeDot={{ r:4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : null,
          },
          {
            title: 'Avg Inference Latency', sub: 'ONNX runtime — ms per class',
            chart: latData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={latData} barSize={36}>
                  <CartesianGrid strokeDasharray="4 4" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="class" {...axisProps} />
                  <YAxis {...axisProps} />
                  <Tooltip {...tipStyle} />
                  <Bar dataKey="avg" radius={[5,5,0,0]} name="ms">
                    {latData.map((_,i) => <Cell key={i} fill={PALETTE[i%4]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : null,
          },
          {
            title: 'Events per Class', sub: 'Total recorded events by fault type',
            chart: pieData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pieData} barSize={36}>
                  <CartesianGrid strokeDasharray="4 4" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="name" {...axisProps} />
                  <YAxis {...axisProps} />
                  <Tooltip {...tipStyle} />
                  <Bar dataKey="value" radius={[5,5,0,0]} name="Events">
                    {pieData.map((_,i) => <Cell key={i} fill={PALETTE[i%4]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : null,
          },
        ].map(({ title, sub, chart }) => (
          <div key={title} className="card flex flex-col min-h-0">
            <p className="text-[13px] font-semibold shrink-0" style={{ color: 'var(--fg)' }}>{title}</p>
            <p className="text-[11px] mt-0.5 mb-3 shrink-0" style={{ color: 'var(--muted)' }}>{sub}</p>
            <div className="flex-1 min-h-0">
              {chart ?? <div className="flex items-center justify-center h-full text-[12px]" style={{ color: 'var(--subtle)' }}>No data yet</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
