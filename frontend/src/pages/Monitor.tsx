import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { useWebSocket } from '../hooks/useWebSocket'
import WaveformChart from '../components/WaveformChart'
import ConfidenceBar from '../components/ConfidenceBar'
import FaultBadge from '../components/FaultBadge'
import { AlertCircle, CheckCircle, Wifi, WifiOff } from 'lucide-react'

const FAULT_COLOR: Record<string, string> = {
  Normal: '#17C964', 'Inner Race': '#F5A524', 'Ball Fault': '#7828C8', 'Outer Race': '#F31260',
}
const WINDOW = 300

export default function Monitor() {
  const machineId   = useStore(s => s.machineId)
  const latest      = useStore(s => s.latestPrediction)
  const isConnected = useStore(s => s.isConnected)
  const darkMode    = useStore(s => s.darkMode)
  useWebSocket(machineId)

  const [wave, setWave] = useState<number[]>(Array(WINDOW).fill(0))
  const tick = useRef(0)

  useEffect(() => {
    const id = setInterval(() => {
      tick.current += 0.10
      const base  = Math.sin(tick.current) * 0.45 + Math.sin(tick.current * 3.1) * 0.1
      const noise = (Math.random() - 0.5) * 0.22
      const fault = latest?.is_fault ? Math.sin(tick.current * 6) * 0.45 : 0
      setWave(p => [...p.slice(1), base + noise + fault])
    }, 35)
    return () => clearInterval(id)
  }, [latest?.is_fault])

  const color   = latest ? (FAULT_COLOR[latest.fault_class] ?? '#006FEE') : '#006FEE'
  const isFault = latest?.is_fault ?? false

  return (
    <div className="flex flex-col gap-4 h-full">

      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-base font-semibold" style={{ color: 'var(--fg)' }}>Live Monitor</h2>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--muted)' }}>{machineId} — drive end accelerometer</p>
        </div>
        <div className={`flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded border
          ${isConnected ? 'text-success bg-success/8 border-success/20' : 'text-danger bg-danger/8 border-danger/20'}`}>
          {isConnected ? <Wifi size={13} /> : <WifiOff size={13} />}
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      {/* Fault alert */}
      {isFault && (
        <div className="flex items-start gap-3 p-4 rounded-lg border border-danger/25 bg-danger/5 shrink-0">
          <AlertCircle size={16} className="text-danger mt-0.5 shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-danger">Fault Detected</p>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--muted)' }}>
              {latest?.fault_class} — {(latest!.confidence * 100).toFixed(1)}% confidence. Schedule maintenance.
            </p>
          </div>
          <div className="ml-auto shrink-0"><FaultBadge label={latest!.fault_class} /></div>
        </div>
      )}

      {/* Waveform — flex-1 fills remaining space */}
      <div className="card flex flex-col flex-1 min-h-0">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[12px] font-medium" style={{ color: 'var(--fg)' }}>
              {latest?.fault_class ?? 'No signal'} — vibration amplitude
            </span>
          </div>
          <span className="text-[11px] font-mono" style={{ color: 'var(--subtle)' }}>12 kHz · {WINDOW} pts</span>
        </div>
        <div className="flex-1 min-h-0">
          <WaveformChart data={wave} color={color} darkMode={darkMode} />
        </div>
        <div className="flex justify-between text-[10px] font-mono mt-2 shrink-0" style={{ color: 'var(--subtle)' }}>
          <span>← {(WINDOW / 12000 * 1000).toFixed(0)} ms ago</span>
          <span>now →</span>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 shrink-0">
        <div className="card lg:col-span-2">
          <p className="text-[12px] font-semibold mb-3" style={{ color: 'var(--fg)' }}>Current Reading</p>
          {latest ? (
            <div className="space-y-0">
              {[
                ['Classification', <FaultBadge label={latest.fault_class} />],
                ['Confidence', <span className="font-mono text-[12px] font-semibold" style={{color}}>{(latest.confidence*100).toFixed(2)}%</span>],
                ['Latency',    <span className="font-mono text-[12px]" style={{color:'var(--fg)'}}>{latest.latency_ms.toFixed(1)} ms</span>],
                ['Status', isFault
                  ? <span className="flex items-center gap-1 text-[11px] font-semibold text-danger"><AlertCircle size={11}/>Fault</span>
                  : <span className="flex items-center gap-1 text-[11px] font-semibold text-success"><CheckCircle size={11}/>Normal</span>
                ],
              ].map(([k,v],i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b last:border-0" style={{borderColor:'var(--border)'}}>
                  <span className="text-[12px]" style={{color:'var(--muted)'}}>{k as string}</span>{v}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[12px] text-center py-8" style={{ color: 'var(--subtle)' }}>Waiting…</p>
          )}
        </div>

        <div className="card lg:col-span-3">
          <p className="text-[12px] font-semibold mb-4" style={{ color: 'var(--fg)' }}>Fault Probability</p>
          {latest
            ? <ConfidenceBar probabilities={latest.probabilities} />
            : <p className="text-[12px] text-center py-8" style={{ color: 'var(--subtle)' }}>No prediction yet</p>}
        </div>
      </div>
    </div>
  )
}
