import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchHistory } from '../api/client'
import { useStore } from '../store'
import FaultBadge from '../components/FaultBadge'
import { Download, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { format } from 'date-fns'
import { clsx } from 'clsx'

const CLASSES   = ['All', 'Normal', 'Inner Race', 'Ball Fault', 'Outer Race']
const HOURS_OPT = [{ v: 1, l: '1h' }, { v: 6, l: '6h' }, { v: 24, l: '24h' }, { v: 168, l: '7d' }]

export default function History() {
  const machineId       = useStore(s => s.machineId)
  const [cls, setCls]   = useState('All')
  const [fOnly, setFOnly] = useState(false)
  const [hours, setHours] = useState(24)

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['history', machineId, cls, fOnly, hours],
    queryFn : () => fetchHistory({
      machine_id  : machineId,
      fault_class : cls !== 'All' ? cls : undefined,
      faults_only : fOnly || undefined,
      hours, limit: 500,
    }),
    refetchInterval: 20000,
  })

  const exportCSV = () => {
    if (!data) return
    const rows = [['ID','Machine','Fault Class','Confidence %','Latency ms','Timestamp']]
    data.forEach(e => rows.push([String(e.id), e.machine_id, e.fault_class,
      (e.confidence*100).toFixed(2), e.latency_ms.toFixed(2), e.timestamp]))
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([rows.map(r=>r.join(',')).join('\n')], {type:'text/csv'}))
    a.download = `faults_${machineId}.csv`; a.click()
  }

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 shrink-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <SlidersHorizontal size={13} style={{ color: 'var(--subtle)' }} />
          {CLASSES.map(c => (
            <button key={c} onClick={() => setCls(c)}
              className={clsx('px-2.5 py-1 rounded text-[12px] font-medium border transition-all',
                cls === c
                  ? 'border-transparent'
                  : ''
              )}
              style={cls === c
                ? { background: 'var(--fg)', color: 'var(--surface)', borderColor: 'var(--fg)' }
                : { background: 'var(--surface)', color: 'var(--muted)', borderColor: 'var(--border)' }
              }>
              {c}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center rounded overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
            {HOURS_OPT.map(o => (
              <button key={o.v} onClick={() => setHours(o.v)}
                className="px-3 py-1.5 text-[12px] font-medium transition-colors"
                style={hours===o.v
                  ? { background: 'var(--fg)', color: 'var(--surface)' }
                  : { background: 'var(--surface)', color: 'var(--muted)' }}>
                {o.l}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-1.5 text-[12px] cursor-pointer" style={{ color: 'var(--muted)' }}>
            <input type="checkbox" checked={fOnly} onChange={e => setFOnly(e.target.checked)} className="rounded" />
            Faults only
          </label>

          <button onClick={() => refetch()} className="btn-ghost" disabled={isFetching}>
            <RotateCcw size={13} className={isFetching ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={exportCSV} className="btn-primary">
            <Download size={13} /> Export
          </button>
        </div>
      </div>

      <p className="text-[12px] shrink-0" style={{ color: 'var(--muted)' }}>
        {isLoading ? 'Loading…' : `${data?.length ?? 0} records`}
      </p>

      {/* Table — flex-1 fills remaining height */}
      <div className="flex-1 min-h-0 overflow-hidden rounded-lg" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="h-full overflow-y-auto">
          <table className="w-full text-[13px]">
            <thead className="sticky top-0 z-10" style={{ background: 'var(--bg)' }}>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['#','Machine','Fault Class','Confidence','Latency','Timestamp'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider whitespace-nowrap"
                    style={{ color: 'var(--subtle)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-16 text-[12px]" style={{ color: 'var(--subtle)' }}>Loading…</td></tr>
              ) : !data?.length ? (
                <tr><td colSpan={6} className="text-center py-16 text-[12px]" style={{ color: 'var(--subtle)' }}>No records match this filter.</td></tr>
              ) : data.map(e => (
                <tr key={e.id} className="transition-colors"
                  style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={ev => (ev.currentTarget.style.background = 'var(--bg)')}
                  onMouseLeave={ev => (ev.currentTarget.style.background = 'transparent')}>
                  <td className="px-4 py-2.5 font-mono text-[11px]" style={{ color: 'var(--subtle)' }}>{e.id}</td>
                  <td className="px-4 py-2.5 font-medium" style={{ color: 'var(--fg)' }}>{e.machine_id}</td>
                  <td className="px-4 py-2.5"><FaultBadge label={e.fault_class} /></td>
                  <td className="px-4 py-2.5 font-mono" style={{ color: 'var(--fg)' }}>{(e.confidence*100).toFixed(1)}%</td>
                  <td className="px-4 py-2.5 font-mono text-[11px]" style={{ color: 'var(--subtle)' }}>{e.latency_ms.toFixed(1)} ms</td>
                  <td className="px-4 py-2.5 font-mono text-[11px]" style={{ color: 'var(--subtle)' }}>
                    {format(new Date(e.timestamp), 'MMM d, HH:mm:ss')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
