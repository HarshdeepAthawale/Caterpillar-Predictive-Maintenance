import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchHistory } from '../api/client'
import { useStore } from '../store'
import FaultBadge from '../components/FaultBadge'
import { Download, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'

const FAULT_CLASSES = ['All', 'Normal', 'Inner Race', 'Ball Fault', 'Outer Race']

export default function History() {
  const machineId = useStore(s => s.machineId)
  const [filterClass, setFilterClass] = useState('All')
  const [faultsOnly, setFaultsOnly]   = useState(false)
  const [hours, setHours]             = useState(24)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['history', machineId, filterClass, faultsOnly, hours],
    queryFn : () => fetchHistory({
      machine_id  : machineId,
      fault_class : filterClass !== 'All' ? filterClass : undefined,
      faults_only : faultsOnly || undefined,
      hours,
      limit: 200,
    }),
    refetchInterval: 15000,
  })

  const exportCSV = () => {
    if (!data) return
    const rows  = [['ID', 'Machine', 'Fault Class', 'Confidence', 'Latency (ms)', 'Timestamp']]
    data.forEach(e => rows.push([
      String(e.id), e.machine_id, e.fault_class,
      (e.confidence * 100).toFixed(2), e.latency_ms.toFixed(2), e.timestamp,
    ]))
    const csv  = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url; a.download = 'fault_history.csv'; a.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-fg">Fault History</h1>
          <p className="text-muted text-sm">{data?.length ?? 0} records — {machineId}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refetch()}
            className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-surface border border-border text-muted hover:text-fg transition-colors">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={exportCSV}
            className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-blue/15 border border-blue/30 text-blue hover:bg-blue/25 transition-colors">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card flex flex-wrap gap-4 items-center">
        <div className="flex gap-2">
          {FAULT_CLASSES.map(cls => (
            <button key={cls}
              onClick={() => setFilterClass(cls)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
                ${filterClass === cls
                  ? 'bg-blue/20 border-blue/50 text-blue'
                  : 'bg-bg border-border text-muted hover:text-fg'}`}>
              {cls}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
          <input type="checkbox" checked={faultsOnly} onChange={e => setFaultsOnly(e.target.checked)}
            className="accent-blue" />
          Faults only
        </label>
        <select value={hours} onChange={e => setHours(Number(e.target.value))}
          className="bg-bg border border-border rounded-lg text-sm text-fg px-3 py-1">
          <option value={1}>Last 1h</option>
          <option value={6}>Last 6h</option>
          <option value={24}>Last 24h</option>
          <option value={168}>Last 7 days</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        {isLoading ? (
          <p className="text-muted text-sm text-center py-12">Loading...</p>
        ) : !data?.length ? (
          <p className="text-muted text-sm text-center py-12">No records found</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted text-left">
                <th className="pb-3 pr-4">#</th>
                <th className="pb-3 pr-4">Machine</th>
                <th className="pb-3 pr-4">Fault Class</th>
                <th className="pb-3 pr-4">Confidence</th>
                <th className="pb-3 pr-4">Latency</th>
                <th className="pb-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map(e => (
                <tr key={e.id} className="hover:bg-white/3 transition-colors">
                  <td className="py-2.5 pr-4 text-muted font-mono text-xs">{e.id}</td>
                  <td className="py-2.5 pr-4 text-fg">{e.machine_id}</td>
                  <td className="py-2.5 pr-4">
                    <FaultBadge label={e.fault_class} size="sm" />
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-fg">
                    {(e.confidence * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-muted text-xs">
                    {e.latency_ms.toFixed(1)} ms
                  </td>
                  <td className="py-2.5 text-muted text-xs font-mono">
                    {format(new Date(e.timestamp), 'yyyy-MM-dd HH:mm:ss')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
