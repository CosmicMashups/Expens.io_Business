import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import type { MonthlyExpenseData } from '@/types'
import { formatPeso } from '@/lib/utils'
import { chartPalette } from '@/lib/designTokens'
import { chartAxisTick, chartGrid, chartTooltipStyle } from '@/lib/chartTheme'

export function MonthlyExpensesChart({ data }: { data: MonthlyExpenseData[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid {...chartGrid} />
        <XAxis dataKey="month_name" tick={chartAxisTick} />
        <YAxis tick={chartAxisTick} tickFormatter={(v) => formatPeso(v).replace(/\.\d+$/, '')} />
        <Tooltip formatter={(v) => formatPeso(Number(v))} contentStyle={chartTooltipStyle} />
        <Bar dataKey="total" fill={chartPalette[0]} radius={[4, 4, 0, 0]} animationDuration={600} />
      </BarChart>
    </ResponsiveContainer>
  )
}
