import { useEffect, useRef, useCallback } from 'react'
import { useStore } from '../store'
import type { Prediction } from '../api/client'

export function useWebSocket(machineId: string) {
  const ws           = useRef<WebSocket | null>(null)
  const setConnected = useStore(s => s.setConnected)
  const setLatest    = useStore(s => s.setLatestPrediction)
  const pushEvent    = useStore(s => s.pushEvent)

  const connect = useCallback(() => {
    const url = `ws://${window.location.hostname}:8000/ws/demo/${machineId}`
    ws.current = new WebSocket(url)

    ws.current.onopen = () => {
      setConnected(true)
      console.log('WS connected:', url)
    }

    ws.current.onmessage = (e) => {
      const msg = JSON.parse(e.data)
      if (msg.type === 'prediction') {
        const pred = msg.data as Prediction
        setLatest(pred)
        if (pred.is_fault) {
          pushEvent({
            id: Date.now(),
            machine_id  : pred.machine_id,
            fault_class : pred.fault_class,
            fault_id    : pred.fault_id,
            confidence  : pred.confidence,
            is_fault    : pred.is_fault,
            latency_ms  : pred.latency_ms,
            timestamp   : pred.timestamp,
          })
        }
      }
    }

    ws.current.onclose = () => {
      setConnected(false)
      // Reconnect after 2s
      setTimeout(connect, 2000)
    }

    ws.current.onerror = () => {
      ws.current?.close()
    }
  }, [machineId, setConnected, setLatest, pushEvent])

  useEffect(() => {
    connect()
    return () => {
      ws.current?.close()
      setConnected(false)
    }
  }, [connect])
}
