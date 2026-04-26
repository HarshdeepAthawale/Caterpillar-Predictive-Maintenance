interface Props {
  score: number   // 0-100
  size?: number
}

export default function HealthGauge({ score, size = 120 }: Props) {
  const r      = (size / 2) * 0.8
  const cx     = size / 2
  const cy     = size / 2
  const circ   = Math.PI * r
  const offset = circ * (1 - score / 100)
  const color  = score > 75 ? '#66bb6a' : score > 40 ? '#ffa726' : '#ef5350'

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size / 1.6} viewBox={`0 0 ${size} ${size / 1.6}`}>
        {/* Background arc */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="#2a2d3e" strokeWidth={size * 0.07} strokeLinecap="round"
        />
        {/* Score arc */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={size * 0.07}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <span className="text-2xl font-bold" style={{ color }}>{score.toFixed(0)}%</span>
      <span className="text-muted text-xs">Health Score</span>
    </div>
  )
}
