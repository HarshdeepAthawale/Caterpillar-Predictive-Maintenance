import { useEffect, useRef } from 'react'

interface Props {
  data: number[]
  color?: string
  height?: number
}

export default function WaveformChart({ data, color = '#2563EB', height = 130 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || data.length === 0) return
    const ctx = canvas.getContext('2d')!
    const W   = canvas.width
    const H   = canvas.height
    const mid = H / 2
    const max = Math.max(...data.map(Math.abs), 0.01)

    ctx.clearRect(0, 0, W, H)

    // White background
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, W, H)

    // Grid lines
    ctx.strokeStyle = '#F3F4F6'
    ctx.lineWidth = 1
    ;[0.25, 0.5, 0.75].forEach(r => {
      ctx.beginPath(); ctx.moveTo(0, H * r); ctx.lineTo(W, H * r); ctx.stroke()
    })

    // Zero line
    ctx.strokeStyle = '#E5E7EB'
    ctx.lineWidth = 1.5
    ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(W, mid); ctx.stroke()

    // Gradient fill
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, `${color}22`)
    grad.addColorStop(1, `${color}05`)
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.moveTo(0, mid)
    data.forEach((v, i) => {
      const x = (i / (data.length - 1)) * W
      const y = mid - (v / max) * mid * 0.85
      ctx.lineTo(x, y)
    })
    ctx.lineTo(W, mid)
    ctx.closePath()
    ctx.fill()

    // Waveform line
    ctx.strokeStyle = color
    ctx.lineWidth   = 1.8
    ctx.lineJoin    = 'round'
    ctx.beginPath()
    data.forEach((v, i) => {
      const x = (i / (data.length - 1)) * W
      const y = mid - (v / max) * mid * 0.85
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.stroke()
  }, [data, color])

  return (
    <canvas
      ref={canvasRef}
      width={900}
      height={height}
      className="w-full rounded-xl border border-border"
      style={{ height }}
    />
  )
}
