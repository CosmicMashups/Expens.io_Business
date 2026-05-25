import { cn } from '@/lib/utils'

export function SectionHeader({
  label,
  action,
  className,
}: {
  label: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn('mb-4 flex items-center justify-between', className)}>
      <div className="flex-1">
        <p className="font-mono text-[11px] uppercase tracking-widest text-text-secondary">{label}</p>
        <div className="mt-2 h-px w-full max-w-xs bg-gradient-to-r from-accent/40 to-transparent" />
      </div>
      {action}
    </div>
  )
}
