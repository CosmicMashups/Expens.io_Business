import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import type { ProjectProfitabilityData } from '@/types'
import { formatPeso } from '@/lib/utils'
import { chartAxisTick, chartGrid, chartTooltipStyle } from '@/lib/chartTheme'

export function ProjectProfitabilityChart({ data }: { data: ProjectProfitabilityData[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
        <CartesianGrid {...chartGrid} />
        <XAxis type="number" tick={chartAxisTick} tickFormatter={(v) => formatPeso(v).replace(/\.\d+$/, '')} />
        <YAxis type="category" dataKey="project_name" width={80} tick={chartAxisTick} />
        <Tooltip formatter={(v) => formatPeso(Number(v))} contentStyle={chartTooltipStyle} />
        <Bar dataKey="profit" animationDuration={600}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.profit >= 0 ? '#22C55E' : '#EF4444'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
