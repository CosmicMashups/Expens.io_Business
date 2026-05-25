import * as React from 'react'
import { cn } from '@/lib/utils'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex h-9 w-full rounded-lg border border-border-subtle bg-surface px-3 py-2.5 text-sm text-text-primary shadow-sm transition-colors placeholder:text-text-tertiary focus-visible:outline-none focus-visible:border-accent focus-visible:ring-1 focus-visible:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-danger',
        className,
      )}
      ref={ref}
      {...props}
    />
  ),
)
Input.displayName = 'Input'
