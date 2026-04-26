export default function HealthGauge({ score }: { score: number }) {
  const pct   = Math.min(Math.max(score, 0), 100)
  const color = pct > 75 ? '#17C964' : pct > 40 ? '#F5A524' : '#F31260'
  const label = pct > 75 ? 'Healthy' : pct > 40 ? 'Warning' : 'Critical'

  // SVG arc path
  const r    = 52
  const cx   = 64
  const cy   = 64
  const circ = Math.PI * r
  const dash = (pct / 100) * circ

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="128" height="80" viewBox="0 0 128 80">
        {/* Track */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="#E8E8EC" strokeWidth="10" strokeLinecap="round"
        />
        {/* Fill */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(.4,0,.2,1)' }}
        />
        {/* Score text */}
        <text x={cx} y={cy - 4} textAnchor="middle" fill={color}
          fontSize="22" fontWeight="700" fontFamily="Inter, sans-serif">
          {pct.toFixed(0)}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="#6E6E80"
          fontSize="10" fontFamily="Inter, sans-serif">
          / 100
        </text>
      </svg>
      <span className="text-[12px] font-semibold" style={{ color }}>{label}</span>
    </div>
  )
}
