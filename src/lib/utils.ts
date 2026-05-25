import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

export const formatPeso = (value: number, currency = 'PHP') =>
  new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)

export const formatDate = (date: string | null) =>
  date ? format(new Date(date), 'dd MMM yyyy') : '—'

export const formatPercent = (value: number) => `${value.toFixed(2)}%`
