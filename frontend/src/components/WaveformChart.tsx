import { useEffect, useRef } from 'react'

interface Props {
  data: number[]
  color?: string
  height?: number
}

export default function WaveformChart({ data, color = '#4fc3f7', height = 120 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || data.length === 0) return
    const ctx   = canvas.getContext('2d')!
    const W     = canvas.width
    const H     = canvas.height
    const mid   = H / 2
    const max   = Math.max(...data.map(Math.abs), 1)

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#1a1d2e'
    ctx.fillRect(0, 0, W, H)

    // Grid line
    ctx.strokeStyle = '#2a2d3e'
    ctx.lineWidth   = 1
    ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(W, mid); ctx.stroke()

    // Waveform
    ctx.strokeStyle = color
    ctx.lineWidth   = 1.5
    ctx.beginPath()
    data.forEach((v, i) => {
      const x = (i / (data.length - 1)) * W
      const y = mid - (v / max) * (mid * 0.85)
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.stroke()
  }, [data, color])

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={height}
      className="w-full rounded-lg"
      style={{ height }}
    />
  )
}
