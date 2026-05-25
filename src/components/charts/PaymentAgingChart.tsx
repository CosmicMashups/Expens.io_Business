import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { PaymentAgingData } from '@/types'
import { chartPalette } from '@/lib/designTokens'
import { chartTooltipStyle } from '@/lib/chartTheme'

export function PaymentAgingChart({ data }: { data: PaymentAgingData[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label>
          {data.map((_, i) => (
            <Cell key={i} fill={chartPalette[i % chartPalette.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={chartTooltipStyle} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}
