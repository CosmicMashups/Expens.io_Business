import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { formatPeso } from '@/lib/utils'
import { chartAxisTick, chartGrid, chartTooltipStyle } from '@/lib/chartTheme'

export function PayrollTrendChart({ data }: { data: { month: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="payrollGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00E0D3" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#00E0D3" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...chartGrid} />
        <XAxis dataKey="month" tick={chartAxisTick} />
        <YAxis tick={chartAxisTick} tickFormatter={(v) => formatPeso(v).replace(/\.\d+$/, '')} />
        <Tooltip formatter={(v) => formatPeso(Number(v))} contentStyle={chartTooltipStyle} />
        <Area
          type="monotone"
          dataKey="total"
          stroke="#00E0D3"
          fill="url(#payrollGrad)"
          strokeWidth={2}
          animationDuration={600}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
