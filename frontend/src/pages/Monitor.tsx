import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { useWebSocket } from '../hooks/useWebSocket'
import WaveformChart from '../components/WaveformChart'
import ConfidenceBar from '../components/ConfidenceBar'
import FaultBadge from '../components/FaultBadge'
import { Wifi, WifiOff, Zap } from 'lucide-react'

const FAULT_COLORS: Record<string, string> = {
  'Normal'     : '#66bb6a',
  'Inner Race' : '#ffa726',
  'Ball Fault' : '#ab47bc',
  'Outer Race' : '#ef5350',
}

const WINDOW = 200  // points shown in rolling waveform

export default function Monitor() {
  const machineId   = useStore(s => s.machineId)
  const latest      = useStore(s => s.latestPrediction)
  const isConnected = useStore(s => s.isConnected)
  useWebSocket(machineId)

  const [waveform, setWaveform] = useState<number[]>(Array(WINDOW).fill(0))
  const tickRef = useRef(0)

  // Generate simulated waveform point each render
  useEffect(() => {
    const id = setInterval(() => {
      tickRef.current += 0.15
      const base  = Math.sin(tickRef.current) * 0.6
      const noise = (Math.random() - 0.5) * 0.4
      const fault = latest?.is_fault ? Math.sin(tickRef.current * 4) * 0.4 : 0
      const val   = base + noise + fault
      setWaveform(prev => [...prev.slice(1), val])
    }, 50)
    return () => clearInterval(id)
  }, [latest?.is_fault])

  const faultColor = latest ? FAULT_COLORS[latest.fault_class] ?? '#4fc3f7' : '#4fc3f7'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-fg">Live Monitor</h1>
          <p className="text-muted text-sm">Real-time vibration signal — {machineId}</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          {isConnected
            ? <><Wifi size={16} className="text-green" /><span className="text-green">Live</span></>
            : <><WifiOff size={16} className="text-red" /><span className="text-red">Disconnected</span></>
          }
        </div>
      </div>

      {/* Waveform */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <p className="text-fg text-sm font-semibold">Vibration Signal (Drive End Accelerometer)</p>
          <span className="text-xs text-muted font-mono">12 kHz sampling</span>
        </div>
        <WaveformChart data={waveform} color={faultColor} height={140} />
        <div className="flex justify-between text-xs text-muted mt-2">
          <span>← 10s ago</span>
          <span>Now →</span>
        </div>
      </div>

      {/* Prediction panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card space-y-4">
          <p className="text-fg text-sm font-semibold">Current Classification</p>
          {latest ? (
            <>
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full animate-pulse"
                  style={{ backgroundColor: faultColor }}
                />
                <FaultBadge label={latest.fault_class} />
                {latest.is_fault && (
                  <span className="flex items-center gap-1 text-xs text-red">
                    <Zap size={12} /> Fault Detected
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-bg rounded-lg p-3">
                  <p className="text-muted text-xs">Confidence</p>
                  <p className="text-fg font-bold text-lg">{(latest.confidence * 100).toFixed(2)}%</p>
                </div>
                <div className="bg-bg rounded-lg p-3">
                  <p className="text-muted text-xs">Latency</p>
                  <p className="text-fg font-bold text-lg">{latest.latency_ms.toFixed(1)} ms</p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-muted text-sm">Waiting for signal...</p>
          )}
        </div>

        <div className="card">
          <p className="text-fg text-sm font-semibold mb-4">Fault Probability</p>
          {latest ? (
            <ConfidenceBar probabilities={latest.probabilities} />
          ) : (
            <p className="text-muted text-sm">No data yet</p>
          )}
        </div>
      </div>
    </div>
  )
}
