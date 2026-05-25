import { cn } from '@/lib/utils'

const statusMap: Record<string, { label: string; bg: string; text: string }> = {
  active: { label: 'Active', bg: 'bg-success/10', text: 'text-success' },
  quotation: { label: 'Quotation', bg: 'bg-accent-muted', text: 'text-accent' },
  completed: { label: 'Completed', bg: 'bg-teal/10', text: 'text-teal' },
  on_hold: { label: 'On Hold', bg: 'bg-warning/10', text: 'text-warning' },
  archived: { label: 'Archived', bg: 'bg-border-subtle', text: 'text-text-secondary' },
  pending: { label: 'Pending', bg: 'bg-warning/10', text: 'text-warning' },
  approved: { label: 'Approved', bg: 'bg-success/10', text: 'text-success' },
  rejected: { label: 'Rejected', bg: 'bg-danger/10', text: 'text-danger' },
  employee: { label: 'Employee', bg: 'bg-accent-muted', text: 'text-accent' },
  organization: { label: 'Organization', bg: 'bg-teal/10', text: 'text-teal' },
}

export function StatusBadge({
  status,
  size = 'sm',
  className,
}: {
  status: string | null | undefined
  size?: 'sm' | 'md'
  className?: string
}) {
  const key = (status ?? 'unknown').toLowerCase().replace(/\s+/g, '_')
  const mapped = statusMap[key] ?? {
    label: status,
    bg: 'bg-elevated',
    text: 'text-text-secondary',
  }

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 font-mono capitalize',
        size === 'sm' ? 'text-xs' : 'text-sm',
        mapped.bg,
        mapped.text,
        className,
      )}
      aria-label={`Status: ${mapped.label}`}
    >
      {mapped.label}
    </span>
  )
}
