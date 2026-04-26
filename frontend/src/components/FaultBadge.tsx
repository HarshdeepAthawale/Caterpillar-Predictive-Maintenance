const FAULT_CLASS: Record<string, string> = {
  'Normal'     : 'badge-normal',
  'Inner Race' : 'badge-inner',
  'Ball Fault' : 'badge-ball',
  'Outer Race' : 'badge-outer',
}

const STATUS_CLASS: Record<string, string> = {
  healthy : 'badge-healthy',
  warning : 'badge-warning',
  critical: 'badge-critical',
}

interface Props {
  label: string
  type?: 'fault' | 'status'
}

export default function FaultBadge({ label, type = 'fault' }: Props) {
  const cls = type === 'fault' ? FAULT_CLASS[label] : STATUS_CLASS[label]
  return (
    <span className={cls ?? 'badge bg-gray-100 text-gray-600 ring-1 ring-gray-200'}>
      {label}
    </span>
  )
}
