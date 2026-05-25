import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function ErrorBanner({
  title,
  description,
  onDismiss,
  variant = 'warning',
  className,
}: {
  title: string
  description?: React.ReactNode
  onDismiss?: () => void
  variant?: 'warning' | 'danger'
  className?: string
}) {
  const styles =
    variant === 'danger'
      ? 'border-danger/30 bg-danger/10'
      : 'border-warning/30 bg-warning/10'

  return (
    <div className={cn('rounded-xl border p-4', styles, className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-3">
          <AlertTriangle
            className={cn('h-5 w-5 shrink-0', variant === 'danger' ? 'text-danger' : 'text-warning')}
            aria-hidden
          />
          <div>
            <p className="font-display text-sm font-semibold text-text-primary">{title}</p>
            {description && <div className="mt-1 text-sm text-text-secondary">{description}</div>}
          </div>
        </div>
        {onDismiss && (
          <Button variant="ghost" size="icon" onClick={onDismiss} aria-label="Dismiss">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
