import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/shell/PageHeader'
import { useProject } from '@/hooks/useProjects'
import { useDailyExpenses } from '@/hooks/useDailyExpenses'
import { useProjectExpenses } from '@/hooks/useProjectExpenses'
import { usePayroll } from '@/hooks/usePayroll'
import { useProjectMonitoring } from '@/hooks/useProjectMonitoring'
import { StatusBadge } from '@/components/badges/StatusBadge'
import { KPICard } from '@/components/cards/KPICard'
import { DataTable } from '@/components/tables/DataTable'
import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton'
import { Button } from '@/components/ui/button'
import { formatDate, formatPeso } from '@/lib/utils'
import { Receipt, Wallet, Users, BarChart3 } from 'lucide-react'

const tabOptions = [
  { label: 'Overview', value: 'overview' },
  { label: 'Daily Expenses', value: 'daily' },
  { label: 'Project Expenses', value: 'project-expenses' },
  { label: 'Payroll', value: 'payroll' },
  { label: 'Monitoring', value: 'monitoring' },
] as const

export function ProjectDetailPage() {
  const { id } = useParams()
  const year = new Date().getFullYear()
  const [tab, setTab] = useState<string>('overview')
  const { data: project, isLoading } = useProject(id)
  const { data: daily = [] } = useDailyExpenses({ projectId: id, year })
  const { data: pe = [] } = useProjectExpenses({ projectId: id, year })
  const { data: payroll = [] } = usePayroll(year, id)
  const { data: pmr = [] } = useProjectMonitoring(year)
  const reports = pmr.filter((r) => r.project_id === id)

  const dailyTotal = daily.reduce((s, e) => s + e.cash_out, 0)
  const peTotal = pe.reduce((s, e) => s + e.cash_out, 0)
  const payrollTotal = payroll.reduce((s, p) => s + p.total_payroll, 0)

  if (isLoading || !project) {
    return (
      <div className="px-4 py-8 md:px-8">
        <LoadingSkeleton variant="kpi" count={3} />
      </div>
    )
  }

  return (
    <div className="px-4 pb-8 md:px-8">
      <PageHeader
        title={project.project_name}
        subtitle={project.project_id}
        tabs={tabOptions.map((t) => ({ label: t.label, value: t.value }))}
        activeTab={tab}
        onTabChange={setTab}
        actions={
          <>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/projects">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/projects/${id}/edit`}>Edit</Link>
            </Button>
          </>
        }
      />

      {tab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <StatusBadge status={project.status} size="md" />
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-text-secondary">Created</dt>
                <dd>{formatDate(project.created_at)}</dd>
              </div>
              <div>
                <dt className="text-text-secondary">Last updated</dt>
                <dd>{formatDate(project.updated_at)}</dd>
              </div>
            </dl>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <KPICard label="Daily expenses" value={dailyTotal} icon={Receipt} variant="default" />
            <KPICard label="Project expenses" value={peTotal} icon={Wallet} variant="info" />
            <KPICard label="Payroll YTD" value={payrollTotal} icon={Users} variant="warning" />
            <KPICard
              label="Reports"
              value={reports.length}
              formatter={(v) => String(v)}
              icon={BarChart3}
              variant="success"
            />
          </div>
        </div>
      )}

      {tab === 'daily' && (
        <DataTable
          columns={[
            { id: 'date', header: 'Date', cell: (e) => formatDate(e.expense_date) },
            { id: 'particulars', header: 'Particulars', accessorKey: 'particulars' },
            { id: 'cash', header: 'Cash out', align: 'right', mono: true, cell: (e) => formatPeso(e.cash_out) },
          ]}
          data={daily}
          emptyState={{ title: 'No daily expenses for this project' }}
          caption="Daily expenses"
        />
      )}

      {tab === 'project-expenses' && (
        <DataTable
          columns={[
            { id: 'date', header: 'Date', cell: (e) => formatDate(e.expense_date) },
            { id: 'particulars', header: 'Particulars', accessorKey: 'particulars' },
            { id: 'cash', header: 'Amount', align: 'right', mono: true, cell: (e) => formatPeso(e.cash_out) },
          ]}
          data={pe}
          emptyState={{ title: 'No project expenses' }}
          caption="Project expenses"
        />
      )}

      {tab === 'payroll' && (
        <DataTable
          columns={[
            { id: 'worker', header: 'Worker', accessorKey: 'worker_name' },
            {
              id: 'total',
              header: 'Total',
              align: 'right',
              mono: true,
              cell: (p) => formatPeso(p.total_payroll),
            },
          ]}
          data={payroll}
          emptyState={{ title: 'No payroll entries' }}
          caption="Payroll"
        />
      )}

      {tab === 'monitoring' && (
        <DataTable
          columns={[
            { id: 'id', header: 'Report ID', accessorKey: 'report_id', mono: true },
            {
              id: 'collected',
              header: 'Collected',
              align: 'right',
              mono: true,
              cell: (r) => formatPeso(r.amount_collected),
            },
            {
              id: 'profit',
              header: 'Profit',
              align: 'right',
              mono: true,
              cell: (r) => formatPeso(r.profit),
            },
          ]}
          data={reports}
          emptyState={{ title: 'No monitoring reports' }}
          caption="Monitoring reports"
        />
      )}
    </div>
  )
}
