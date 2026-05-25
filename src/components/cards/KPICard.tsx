import { cn, formatPeso } from '@/lib/utils'
import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton'
import { ArrowDown, ArrowUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const variantStyles = {
  default: { icon: 'text-accent', bg: 'bg-accent-muted' },
  success: { icon: 'text-success', bg: 'bg-success/10' },
  warning: { icon: 'text-warning', bg: 'bg-warning/10' },
  danger: { icon: 'text-danger', bg: 'bg-danger/10' },
  info: { icon: 'text-teal', bg: 'bg-teal/10' },
} as const

export function KPICard({
  label,
  value,
  formatter = formatPeso,
  change,
  changeLabel,
  icon: Icon,
  variant = 'default',
  loading,
}: {
  label: string
  value: number
  formatter?: (v: number) => string
  change?: number
  changeLabel?: string
  icon?: LucideIcon
  variant?: keyof typeof variantStyles
  loading?: boolean
}) {
  const styles = variantStyles[variant]

  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5">
        <LoadingSkeleton variant="kpi" />
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card transition-colors hover:border-border-subtle hover:shadow-card">
      <div className="flex items-start justify-between">
        <p className="font-mono text-[11px] uppercase tracking-widest text-text-secondary">{label}</p>
        {Icon && (
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-full', styles.bg)}>
            <Icon className={cn('h-5 w-5', styles.icon)} aria-hidden />
          </div>
        )}
      </div>
      <p className="mt-3 font-display text-[28px] font-bold leading-none text-text-primary">
        <span className="font-mono">{formatter(value)}</span>
      </p>
      {change !== undefined && (
        <div className="mt-2 flex items-center gap-1 text-xs">
          {change >= 0 ? (
            <ArrowUp className="h-3 w-3 text-success" />
          ) : (
            <ArrowDown className="h-3 w-3 text-danger" />
          )}
          <span className={change >= 0 ? 'text-success' : 'text-danger'}>{Math.abs(change)}%</span>
          {changeLabel && <span className="text-text-tertiary">{changeLabel}</span>}
        </div>
      )}
    </div>
  )
}
