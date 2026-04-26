const FAULT: Record<string, string> = {
  Normal      : 'badge-normal',
  'Inner Race': 'badge-inner',
  'Ball Fault': 'badge-ball',
  'Outer Race': 'badge-outer',
}
const STATUS: Record<string, string> = {
  healthy : 'badge-healthy',
  warning : 'badge-warning',
  critical: 'badge-critical',
}

export default function FaultBadge({
  label, type = 'fault',
}: { label: string; type?: 'fault' | 'status' }) {
  const cls = type === 'fault' ? FAULT[label] : STATUS[label]
  return <span className={cls ?? 'badge bg-bg text-muted'}>{label}</span>
}
