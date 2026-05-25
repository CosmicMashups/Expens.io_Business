import { useState } from 'react'
import {
  Receipt,
  Users,
  Briefcase,
  TrendingUp,
  AlertCircle,
  DollarSign,
  CheckSquare,
} from 'lucide-react'
import { PageHeader } from '@/components/shell/PageHeader'
import { KPICard } from '@/components/cards/KPICard'
import { ChartWrapper } from '@/components/charts/ChartWrapper'
import { MonthlyExpensesChart } from '@/components/charts/MonthlyExpensesChart'
import { ProjectProfitabilityChart } from '@/components/charts/ProjectProfitabilityChart'
import { PayrollTrendChart } from '@/components/charts/PayrollTrendChart'
import { ExpenseCategoryPie } from '@/components/charts/ExpenseCategoryPie'
import { PaymentAgingChart } from '@/components/charts/PaymentAgingChart'
import { ErrorBanner } from '@/components/feedback/ErrorBanner'
import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton'
import { StatusBadge } from '@/components/badges/StatusBadge'
import {
  useDashboardSummary,
  useMonthlyExpenses,
  useProjectProfitability,
  usePaymentAging,
  useOverdueWarnings,
} from '@/hooks/useDashboard'
import { usePayroll } from '@/hooks/usePayroll'
import { useApprovalQueue } from '@/hooks/useApprovals'
import { formatDate } from '@/lib/utils'
import { PAYROLL_PERIOD_COLUMNS } from '@/types'

export function DashboardPage() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [dismissAlerts, setDismissAlerts] = useState(false)
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary(year)
  const { data: monthly = [], isLoading: monthlyLoading } = useMonthlyExpenses(year)
  const { data: profitability = [], isLoading: profitLoading } = useProjectProfitability(year)
  const { data: aging = [] } = usePaymentAging()
  const { data: overdue = [] } = useOverdueWarnings()
  const { data: payroll = [], isLoading: payrollLoading } = usePayroll(year)
  const { data: recentApprovals = [] } = useApprovalQueue()

  const payrollTrend = PAYROLL_PERIOD_COLUMNS.slice(0, 12).map((col) => ({
    month: col.label,
    total: payroll.reduce((s, p) => s + Number(p[col.key] ?? 0), 0),
  }))

  const categoryPie = [{ category: 'Expenses YTD', amount: summary?.total_expenses_ytd ?? 0 }]
  const profitVariant = (summary?.total_profit_ytd ?? 0) >= 0 ? 'success' : 'danger'

  const yearSelect = (
    <select
      className="h-9 rounded-lg border border-border-subtle bg-elevated px-3 text-sm text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/20"
      value={year}
      onChange={(e) => setYear(Number(e.target.value))}
      aria-label="Year"
    >
      {[year - 1, year, year + 1].map((y) => (
        <option key={y} value={y} className="bg-surface">
          {y}
        </option>
      ))}
    </select>
  )

  return (
    <div className="px-4 pb-8 md:px-8">
      <PageHeader title="Dashboard" subtitle="Finance overview" actions={yearSelect} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KPICard
          label="Total Expenses YTD"
          value={summary?.total_expenses_ytd ?? 0}
          icon={Receipt}
          variant="default"
          loading={summaryLoading}
        />
        <KPICard
          label="Payroll YTD"
          value={summary?.total_payroll_ytd ?? 0}
          icon={Users}
          variant="info"
          loading={summaryLoading}
        />
        <KPICard
          label="Active Projects"
          value={summary?.active_projects_count ?? 0}
          formatter={(v) => String(v)}
          icon={Briefcase}
          variant="success"
          loading={summaryLoading}
        />
        <KPICard
          label="Amount Collected"
          value={summary?.total_amount_collected ?? 0}
          icon={TrendingUp}
          variant="success"
          loading={summaryLoading}
        />
        <KPICard
          label="Outstanding Balance"
          value={summary?.total_outstanding_balance ?? 0}
          icon={AlertCircle}
          variant={(summary?.total_outstanding_balance ?? 0) > 0 ? 'warning' : 'default'}
          loading={summaryLoading}
        />
        <KPICard
          label="Yearly Profit"
          value={summary?.total_profit_ytd ?? 0}
          icon={DollarSign}
          variant={profitVariant}
          loading={summaryLoading}
        />
      </div>

      {!dismissAlerts && overdue && overdue.length > 0 && (
        <div className="mt-6">
          <ErrorBanner
            title="Overdue / partial invoices"
            variant="warning"
            onDismiss={() => setDismissAlerts(true)}
            description={
              <ul className="space-y-1 text-left">
                {overdue.slice(0, 5).map(
                  (inv: {
                    id: string
                    invoice_number: string
                    due_date: string
                    project?: { project_name: string }
                  }) => (
                    <li key={inv.id}>
                      {inv.project?.project_name} — {inv.invoice_number} — due{' '}
                      {formatDate(inv.due_date)}
                    </li>
                  ),
                )}
              </ul>
            }
          />
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <ChartWrapper title="Monthly Expenses" loading={monthlyLoading}>
            <MonthlyExpensesChart data={monthly} />
          </ChartWrapper>
        </div>
        <div className="lg:col-span-4">
          <ChartWrapper title="Category Breakdown" loading={summaryLoading}>
            <ExpenseCategoryPie data={categoryPie} />
          </ChartWrapper>
        </div>
        <div className="lg:col-span-6">
          <ChartWrapper title="Payroll Trend" subtitle="12-month view" loading={payrollLoading}>
            <PayrollTrendChart data={payrollTrend} />
          </ChartWrapper>
        </div>
        <div className="lg:col-span-6">
          <ChartWrapper title="Project Profitability" loading={profitLoading}>
            <ProjectProfitabilityChart data={profitability} />
          </ChartWrapper>
        </div>
      </div>

      {aging.length > 0 && (
        <div className="mt-4">
          <ChartWrapper title="Payment Aging" height="h-auto">
            <PaymentAgingChart data={aging} />
          </ChartWrapper>
        </div>
      )}

      <section className="mt-8">
        <h2 className="mb-4 font-mono text-[11px] uppercase tracking-widest text-text-secondary">
          Recent Activity
        </h2>
        {summaryLoading ? (
          <LoadingSkeleton variant="table-row" count={3} />
        ) : recentApprovals.length === 0 ? (
          <p className="text-sm text-text-secondary">No recent approval activity.</p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
            {recentApprovals.slice(0, 10).map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-elevated"
              >
                <div className="flex items-center gap-3">
                  <CheckSquare className="h-4 w-4 text-text-tertiary" aria-hidden />
                  <div>
                    <p className="text-sm text-text-primary capitalize">
                      {item.entity_type.replace(/_/g, ' ')}
                    </p>
                    <p className="font-mono text-xs text-text-tertiary">
                      {formatDate(item.requested_at)}
                    </p>
                  </div>
                </div>
                <StatusBadge status={item.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
