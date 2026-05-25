import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton'
import { cn } from '@/lib/utils'

export function ChartWrapper({
  title,
  subtitle,
  children,
  loading,
  action,
  className,
  height = 'h-64',
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  loading?: boolean
  action?: React.ReactNode
  className?: string
  height?: string
}) {
  return (
    <div className={cn('rounded-xl border border-border-subtle bg-card p-5', className)}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-base font-semibold text-text-primary">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-text-secondary">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className={cn('pt-4', height)}>
        {loading ? <LoadingSkeleton variant="card" className="h-full min-h-[200px]" /> : children}
      </div>
    </div>
  )
}
