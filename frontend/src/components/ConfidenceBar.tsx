const COLORS: Record<string, string> = {
  'Normal'     : '#66bb6a',
  'Inner Race' : '#ffa726',
  'Ball Fault' : '#ab47bc',
  'Outer Race' : '#ef5350',
}

interface Props {
  probabilities: Record<string, number>
}

export default function ConfidenceBar({ probabilities }: Props) {
  return (
    <div className="space-y-2">
      {Object.entries(probabilities).map(([cls, prob]) => (
        <div key={cls}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted">{cls}</span>
            <span className="text-fg font-mono">{(prob * 100).toFixed(1)}%</span>
          </div>
          <div className="w-full bg-border rounded-full h-1.5">
            <div
              className="h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${prob * 100}%`, backgroundColor: COLORS[cls] ?? '#4fc3f7' }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
