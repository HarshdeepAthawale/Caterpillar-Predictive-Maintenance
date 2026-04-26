import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchHistory } from '../api/client'
import { useStore } from '../store'
import FaultBadge from '../components/FaultBadge'
import { Download, RefreshCw, Filter } from 'lucide-react'
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
      limit: 300,
    }),
    refetchInterval: 15000,
  })

  const exportCSV = () => {
    if (!data) return
    const rows = [['ID','Machine','Fault Class','Confidence','Latency (ms)','Timestamp']]
    data.forEach(e => rows.push([
      String(e.id), e.machine_id, e.fault_class,
      (e.confidence * 100).toFixed(2), e.latency_ms.toFixed(2), e.timestamp,
    ]))
    const csv  = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `fault_history_${machineId}.csv`; a.click()
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-fg">Fault History</h1>
          <p className="text-muted text-sm">{data?.length ?? 0} records — {machineId}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="btn-ghost">
            <RefreshCw size={14} /> Refresh
          </button>
          <button onClick={exportCSV} className="btn-primary">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5">
          <Filter size={14} className="text-muted" />
          <span className="text-xs font-medium text-muted">Filter:</span>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {FAULT_CLASSES.map(cls => (
            <button key={cls} onClick={() => setFilterClass(cls)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors
                ${filterClass === cls
                  ? 'bg-cat-dark text-white border-cat-dark'
                  : 'bg-white border-border text-muted hover:border-cat-dark/40 hover:text-fg'}`}>
              {cls}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <label className="flex items-center gap-2 text-sm text-muted cursor-pointer select-none">
            <input type="checkbox" checked={faultsOnly} onChange={e => setFaultsOnly(e.target.checked)}
              className="rounded accent-cat-dark" />
            Faults only
          </label>
          <select value={hours} onChange={e => setHours(Number(e.target.value))}
            className="bg-white border border-border rounded-lg text-sm text-fg px-3 py-1.5
                       focus:outline-none focus:ring-2 focus:ring-cat-yellow/50">
            <option value={1}>Last 1h</option>
            <option value={6}>Last 6h</option>
            <option value={24}>Last 24h</option>
            <option value={168}>Last 7 days</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto p-0">
        {isLoading ? (
          <div className="text-center py-16 text-muted text-sm">Loading records...</div>
        ) : !data?.length ? (
          <div className="text-center py-16 text-muted text-sm">No records found for this filter.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left bg-bg">
                <th className="px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">#</th>
                <th className="px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Machine</th>
                <th className="px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Fault Class</th>
                <th className="px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Confidence</th>
                <th className="px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Latency</th>
                <th className="px-5 py-3 text-xs font-semibold text-muted uppercase tracking-wider">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map(e => (
                <tr key={e.id} className="hover:bg-bg/60 transition-colors">
                  <td className="px-5 py-3 text-muted font-mono text-xs">{e.id}</td>
                  <td className="px-5 py-3 text-fg font-medium">{e.machine_id}</td>
                  <td className="px-5 py-3"><FaultBadge label={e.fault_class} /></td>
                  <td className="px-5 py-3 font-mono font-semibold text-fg">
                    {(e.confidence * 100).toFixed(1)}%
                  </td>
                  <td className="px-5 py-3 font-mono text-muted text-xs">
                    {e.latency_ms.toFixed(1)} ms
                  </td>
                  <td className="px-5 py-3 text-muted text-xs font-mono">
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
