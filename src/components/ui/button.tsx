import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-base disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        default: 'bg-accent text-white hover:bg-accent/90',
        primary: 'bg-accent text-white hover:bg-accent/90',
        success: 'bg-success text-white hover:bg-success/90',
        danger: 'bg-danger text-white hover:bg-danger/90',
        destructive: 'bg-danger text-white hover:bg-danger/90',
        outline: 'border border-border-subtle bg-surface text-text-primary hover:bg-elevated',
        secondary: 'bg-elevated text-text-primary hover:bg-elevated/80',
        ghost: 'border border-border-subtle bg-transparent text-text-secondary hover:bg-elevated hover:text-text-primary',
        link: 'text-accent underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 text-sm',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-10 px-5 text-base',
        icon: 'h-9 w-9 min-h-[44px] min-w-[44px]',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
Button.displayName = 'Button'
