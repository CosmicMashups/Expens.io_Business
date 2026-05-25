import logoSrc from '@/assets/images/logo.png'
import { cn } from '@/lib/utils'

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
  lg: 'h-16 w-16',
} as const

type LogoProps = {
  variant?: 'full' | 'icon'
  size?: keyof typeof sizeClasses
  showSubtitle?: boolean
  className?: string
}

export function Logo({
  variant = 'full',
  size = 'sm',
  showSubtitle = false,
  className,
}: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <img
        src={logoSrc}
        alt="Expensio Business"
        className={cn('shrink-0 rounded-md object-contain', sizeClasses[size])}
      />
      {variant === 'full' && (
        <div className="flex items-baseline gap-0.5 overflow-hidden">
          <span className="font-display text-lg font-bold text-accent">Expens.io</span>
          {showSubtitle && (
            <span className="font-body text-sm font-medium text-text-secondary">Business</span>
          )}
        </div>
      )}
    </div>
  )
}
