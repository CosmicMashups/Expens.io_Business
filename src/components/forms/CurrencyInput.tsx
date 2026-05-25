import { useState, useEffect } from 'react'
import { cn, formatPeso } from '@/lib/utils'

export function CurrencyInput({
  value,
  onChange,
  currency = 'PHP',
  className,
}: {
  value: number
  onChange: (v: number) => void
  currency?: string
  className?: string
}) {
  const [focused, setFocused] = useState(false)
  const [text, setText] = useState(String(value))

  useEffect(() => {
    if (!focused) setText(String(value))
  }, [value, focused])

  return (
    <div
      className={cn(
        'flex overflow-hidden rounded-lg border border-border-subtle bg-surface focus-within:border-accent focus-within:ring-1 focus-within:ring-accent/20',
        className,
      )}
    >
      <span className="flex items-center border-r border-border-subtle bg-elevated px-3 text-sm text-text-secondary">
        ₱
      </span>
      <input
        type="text"
        className="flex-1 bg-transparent px-3 py-2.5 font-mono text-right text-sm text-text-primary focus:outline-none"
        value={focused ? text : formatPeso(value, currency)}
        onFocus={() => {
          setFocused(true)
          setText(String(value))
        }}
        onBlur={() => {
          setFocused(false)
          const n = parseFloat(text.replace(/,/g, '')) || 0
          onChange(n)
        }}
        onChange={(e) => {
          setText(e.target.value)
          const n = parseFloat(e.target.value.replace(/,/g, ''))
          if (!isNaN(n)) onChange(n)
        }}
      />
    </div>
  )
}
