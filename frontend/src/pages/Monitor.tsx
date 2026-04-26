import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { useWebSocket } from '../hooks/useWebSocket'
import WaveformChart from '../components/WaveformChart'
import ConfidenceBar from '../components/ConfidenceBar'
import FaultBadge from '../components/FaultBadge'
import { Wifi, WifiOff, AlertCircle, CheckCircle2 } from 'lucide-react'

const FAULT_COLORS: Record<string, string> = {
  Normal      : '#16A34A',
  'Inner Race': '#D97706',
  'Ball Fault': '#7C3AED',
  'Outer Race': '#DC2626',
}

const WINDOW = 300

export default function Monitor() {
  const machineId   = useStore(s => s.machineId)
  const latest      = useStore(s => s.latestPrediction)
  const isConnected = useStore(s => s.isConnected)
  useWebSocket(machineId)

  const [waveform, setWaveform] = useState<number[]>(Array(WINDOW).fill(0))
  const tickRef = useRef(0)

  useEffect(() => {
    const id = setInterval(() => {
      tickRef.current += 0.12
      const base  = Math.sin(tickRef.current) * 0.5
      const noise = (Math.random() - 0.5) * 0.3
      const fault = latest?.is_fault ? Math.sin(tickRef.current * 5) * 0.5 : 0
      setWaveform(prev => [...prev.slice(1), base + noise + fault])
    }, 40)
    return () => clearInterval(id)
  }, [latest?.is_fault])

  const faultColor = latest ? FAULT_COLORS[latest.fault_class] ?? '#2563EB' : '#2563EB'
  const isFault    = latest?.is_fault ?? false

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-fg">Live Monitor</h1>
          <p className="text-muted text-sm">Real-time vibration stream — {machineId}</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium
          ${isConnected
            ? 'bg-success/8 border-success/25 text-success'
            : 'bg-danger/8 border-danger/25 text-danger'}`}>
          {isConnected ? <Wifi size={15} /> : <WifiOff size={15} />}
          {isConnected ? 'Live Stream' : 'Disconnected'}
        </div>
      </div>

      {/* Fault alert banner */}
      {isFault && (
        <div className="flex items-center gap-3 p-4 rounded-2xl border-2 border-danger/30 bg-danger/5">
          <AlertCircle size={20} className="text-danger shrink-0" />
          <div>
            <p className="font-semibold text-danger text-sm">Fault Detected</p>
            <p className="text-xs text-muted mt-0.5">
              {latest?.fault_class} — {(latest!.confidence * 100).toFixed(1)}% confidence
            </p>
          </div>
          <FaultBadge label={latest!.fault_class} />
        </div>
      )}

      {/* Waveform */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-semibold text-fg">Drive End Accelerometer</p>
            <p className="text-xs text-muted">12 kHz sampling — rolling window (300 pts)</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 rounded" style={{ backgroundColor: faultColor }} />
            <span className="text-xs text-muted font-medium"
              style={{ color: faultColor }}>{latest?.fault_class ?? 'No signal'}</span>
          </div>
        </div>
        <WaveformChart data={waveform} color={faultColor} height={150} />
        <div className="flex justify-between text-xs text-muted mt-2 px-1">
          <span>← 12 seconds ago</span>
          <span>Now →</span>
        </div>
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Current reading */}
        <div className="card">
          <p className="text-sm font-semibold text-fg mb-4">Current Reading</p>
          {latest ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Fault Class</span>
                <FaultBadge label={latest.fault_class} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Confidence</span>
                <span className="font-bold text-sm" style={{ color: faultColor }}>
                  {(latest.confidence * 100).toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Latency</span>
                <span className="text-sm font-mono text-fg">{latest.latency_ms.toFixed(1)} ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Status</span>
                {isFault
                  ? <span className="flex items-center gap-1 text-xs font-semibold text-danger">
                      <AlertCircle size={12} /> FAULT
                    </span>
                  : <span className="flex items-center gap-1 text-xs font-semibold text-success">
                      <CheckCircle2 size={12} /> NORMAL
                    </span>
                }
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted text-center py-8">Awaiting data...</p>
          )}
        </div>

        {/* Confidence bars */}
        <div className="card lg:col-span-2">
          <p className="text-sm font-semibold text-fg mb-4">Fault Probability Distribution</p>
          {latest ? (
            <ConfidenceBar probabilities={latest.probabilities} />
          ) : (
            <p className="text-sm text-muted text-center py-8">No prediction yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
