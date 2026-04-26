import { useEffect, useRef } from 'react'

export default function WaveformChart({
  data, color = '#006FEE', darkMode = false,
}: { data: number[]; color?: string; darkMode?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas || data.length < 2) return

    const dpr  = window.devicePixelRatio || 1
    const W    = canvas.clientWidth
    const H    = canvas.clientHeight
    if (W === 0 || H === 0) return
    canvas.width  = W * dpr
    canvas.height = H * dpr
    const ctx = canvas.getContext('2d')!
    ctx.scale(dpr, dpr)

    const bg      = darkMode ? '#16181C' : '#FFFFFF'
    const gridClr = darkMode ? '#2F3336' : '#F7F7F8'
    const zeroClr = darkMode ? '#2F3336' : '#E8E8EC'
    const mid     = H / 2
    const max     = Math.max(...data.map(Math.abs), 0.001)

    // Background
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, W, H)

    // Grid lines
    ctx.strokeStyle = gridClr
    ctx.lineWidth = 1
    ;[0.25, 0.5, 0.75].forEach(r => {
      ctx.beginPath(); ctx.moveTo(0, H * r); ctx.lineTo(W, H * r); ctx.stroke()
    })

    // Zero line dashed
    ctx.strokeStyle = zeroClr
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(W, mid); ctx.stroke()
    ctx.setLineDash([])

    // Gradient fill
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, `${color}22`)
    grad.addColorStop(1, `${color}00`)
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.moveTo(0, mid)
    data.forEach((v, i) => ctx.lineTo((i / (data.length - 1)) * W, mid - (v / max) * mid * 0.82))
    ctx.lineTo(W, mid)
    ctx.closePath()
    ctx.fill()

    // Waveform line
    ctx.strokeStyle = color
    ctx.lineWidth   = 1.8
    ctx.lineJoin    = 'round'
    ctx.lineCap     = 'round'
    ctx.beginPath()
    data.forEach((v, i) => {
      const x = (i / (data.length - 1)) * W
      const y = mid - (v / max) * mid * 0.82
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.stroke()
  }, [data, color, darkMode])

  return (
    <canvas
      ref={ref}
      style={{ width: '100%', height: '100%', display: 'block' }}
      className="rounded-lg"
    />
  )
}
