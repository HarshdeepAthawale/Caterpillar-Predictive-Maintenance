const CLASS_STYLES: Record<string, string> = {
  'Normal'     : 'badge-normal',
  'Inner Race' : 'badge-inner',
  'Ball Fault' : 'badge-ball',
  'Outer Race' : 'badge-outer',
}

const STATUS_STYLES: Record<string, string> = {
  healthy : 'badge-healthy',
  warning : 'badge-warning',
  critical: 'badge-critical',
}

interface Props {
  label: string
  type?: 'fault' | 'status'
  size?: 'sm' | 'md'
}

export default function FaultBadge({ label, type = 'fault', size = 'md' }: Props) {
  const style = type === 'fault' ? CLASS_STYLES[label] : STATUS_STYLES[label]
  const px    = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${px} ${style ?? 'bg-white/10 text-fg'}`}>
      {label}
    </span>
  )
}
