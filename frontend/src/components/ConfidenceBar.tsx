const COLORS: Record<string, string> = {
  Normal      : '#17C964',
  'Inner Race': '#F5A524',
  'Ball Fault': '#7828C8',
  'Outer Race': '#F31260',
}

export default function ConfidenceBar({ probabilities }: { probabilities: Record<string, number> }) {
  const sorted = Object.entries(probabilities).sort(([, a], [, b]) => b - a)

  return (
    <div className="space-y-3">
      {sorted.map(([cls, prob]) => (
        <div key={cls} className="flex items-center gap-3">
          <span className="text-[12px] text-muted w-24 shrink-0">{cls}</span>
          <div className="flex-1 bg-bg rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${(prob * 100).toFixed(1)}%`, backgroundColor: COLORS[cls] ?? '#006FEE' }}
            />
          </div>
          <span className="text-[12px] font-mono text-fg w-12 text-right shrink-0">
            {(prob * 100).toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  )
}
