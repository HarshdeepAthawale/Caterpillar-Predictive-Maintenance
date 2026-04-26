interface Props { score: number; size?: number }

export default function HealthGauge({ score, size = 140 }: Props) {
  const r      = (size / 2) * 0.78
  const cx     = size / 2
  const cy     = size / 2
  const circ   = Math.PI * r
  const offset = circ * (1 - Math.min(score, 100) / 100)
  const color  = score > 75 ? '#16A34A' : score > 40 ? '#D97706' : '#DC2626'
  const label  = score > 75 ? 'Healthy' : score > 40 ? 'Warning' : 'Critical'

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.6} viewBox={`0 0 ${size} ${size * 0.6}`}>
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="#E5E7EB" strokeWidth={size * 0.07} strokeLinecap="round"
        />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke={color} strokeWidth={size * 0.07} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.7s ease' }}
        />
        <text x={cx} y={cy * 0.92} textAnchor="middle" fill={color}
          fontSize={size * 0.18} fontWeight="700" fontFamily="Inter, sans-serif">
          {score.toFixed(0)}%
        </text>
      </svg>
      <span className="text-sm font-semibold mt-1" style={{ color }}>{label}</span>
      <span className="text-xs text-muted">Machine Health</span>
    </div>
  )
}
