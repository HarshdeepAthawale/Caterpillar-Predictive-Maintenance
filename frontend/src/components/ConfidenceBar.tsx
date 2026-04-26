const COLORS: Record<string, string> = {
  'Normal'     : '#16A34A',
  'Inner Race' : '#D97706',
  'Ball Fault' : '#7C3AED',
  'Outer Race' : '#DC2626',
}

interface Props { probabilities: Record<string, number> }

export default function ConfidenceBar({ probabilities }: Props) {
  return (
    <div className="space-y-3">
      {Object.entries(probabilities).map(([cls, prob]) => (
        <div key={cls}>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-medium text-fg">{cls}</span>
            <span className="text-muted font-mono">{(prob * 100).toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{ width: `${prob * 100}%`, backgroundColor: COLORS[cls] ?? '#2563EB' }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
