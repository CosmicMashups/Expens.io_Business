import type { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon?: LucideIcon
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <Icon className="mb-4 h-12 w-12 text-text-tertiary" aria-hidden />}
      <p className="font-display text-base font-semibold text-text-primary">{title}</p>
      {description && (
        <p className="mt-1 max-w-xs text-sm text-text-secondary">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function EmptyStateButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <Button variant="default" onClick={onClick}>
      {label}
    </Button>
  )
}
