import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { chartPalette } from '@/lib/designTokens'
import { chartTooltipStyle } from '@/lib/chartTheme'

export function ExpenseCategoryPie({ data }: { data: { category: string; amount: number }[] }) {
  if (data.length === 0 || data.every((d) => d.amount === 0)) {
    return (
      <p className="flex h-[260px] items-center justify-center text-sm text-text-secondary">
        No category data for this period
      </p>
    )
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="amount"
          nameKey="category"
          cx="40%"
          cy="50%"
          innerRadius={40}
          outerRadius={80}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={chartPalette[i % chartPalette.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={chartTooltipStyle} />
        <Legend layout="vertical" align="right" verticalAlign="middle" />
      </PieChart>
    </ResponsiveContainer>
  )
}
