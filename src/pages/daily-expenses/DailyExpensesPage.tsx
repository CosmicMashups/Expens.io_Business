import { useState } from 'react'
import { PageHeader } from '@/components/shell/PageHeader'
import { useDailyExpenses, useDailyExpenseMutations } from '@/hooks/useDailyExpenses'
import { useRole } from '@/hooks/useRole'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { ApprovalBadge } from '@/components/badges/ApprovalBadge'
import { StatusBadge } from '@/components/badges/StatusBadge'
import { DataTable } from '@/components/tables/DataTable'
import { DetailDrawer } from '@/components/drawers/DetailDrawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ProjectSelect } from '@/components/forms/ProjectSelect'
import { CurrencyInput } from '@/components/forms/CurrencyInput'
import { VAT_RATE_OPTIONS } from '@/lib/constants'
import { selectClass } from '@/lib/uiClasses'
import { exportDailyExpenses } from '@/services/excel/exporter'
import { importDailyExpenses } from '@/services/excel/importer'
import { formatDate, formatPeso } from '@/lib/utils'
import { toast } from 'sonner'
import { Plus, Upload, Download } from 'lucide-react'
import type { DailyExpense } from '@/types'

export function DailyExpensesPage() {
  const defaultYear = new Date().getFullYear()
  const [filters, setFilters] = useState({ year: defaultYear, month: 0, projectId: '', category: '' })
  const { data: rows = [], isLoading } = useDailyExpenses({
    year: filters.year,
    month: filters.month || undefined,
    projectId: filters.projectId || undefined,
    category: filters.category || undefined,
  })
  const { create, remove } = useDailyExpenseMutations()
  const { permissions } = useRole()
  const [showForm, setShowForm] = useState(false)
  const [selected, setSelected] = useState<DailyExpense | null>(null)
  const [form, setForm] = useState({
    project_id: '',
    expense_date: new Date().toISOString().slice(0, 10),
    particulars: '',
    cash_out: 0,
    vat_rate: 0.12,
    currency: 'PHP' as const,
    expense_category_code: 'others',
  })

  const vatPreview = Math.round(form.cash_out * form.vat_rate * 100) / 100

  const handleExport = () => {
    const byMonth: Record<number, DailyExpense[]> = {}
    for (const e of rows) {
      const m = new Date(e.expense_date).getMonth() + 1
      if (!byMonth[m]) byMonth[m] = []
      byMonth[m].push(e)
    }
    exportDailyExpenses(byMonth, filters.year, undefined, filters.month > 0)
    toast.success('Export started')
  }

  const handleImport = async (file: File) => {
    if (!form.project_id && !filters.projectId) {
      toast.error('Select a project for import')
      return
    }
    const pid = filters.projectId || form.project_id
    const results = await importDailyExpenses(file, pid, filters.year)
    let count = 0
    for (const r of results) {
      for (const row of r.valid) {
        await create.mutateAsync({ ...row, project_id: pid } as never)
        count++
      }
    }
    toast.success(`Imported ${count} rows`)
  }

  return (
    <div className="px-4 pb-8 md:px-8">
      <PageHeader
        title="Daily Expenses"
        actions={
          <>
            <PermissionGuard require="canExport">
              <Button variant="ghost" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4" />
                Export
              </Button>
            </PermissionGuard>
            <PermissionGuard require="canCreate">
              <label className="cursor-pointer">
                <Button variant="ghost" size="sm" asChild>
                  <span>
                    <Upload className="h-4 w-4" />
                    Import
                  </span>
                </Button>
                <input
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])}
                />
              </label>
              <Button size="sm" onClick={() => setShowForm(!showForm)}>
                <Plus className="h-4 w-4" />
                Add Expense
              </Button>
            </PermissionGuard>
          </>
        }
      />

      <div className="sticky top-14 z-20 mb-4 flex flex-wrap gap-2 rounded-xl border border-border bg-surface/95 p-3 backdrop-blur-sm">
        <select
          className={selectClass}
          value={filters.year}
          onChange={(e) => setFilters((f) => ({ ...f, year: Number(e.target.value) }))}
          aria-label="Year"
        >
          {[filters.year - 1, filters.year, filters.year + 1].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <select
          className={selectClass}
          value={filters.month}
          onChange={(e) => setFilters((f) => ({ ...f, month: Number(e.target.value) }))}
          aria-label="Month"
        >
          <option value={0}>All months</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(2000, i).toLocaleString('en', { month: 'long' })}
            </option>
          ))}
        </select>
        <div className="w-48">
          <ProjectSelect
            value={filters.projectId}
            onChange={(id) => setFilters((f) => ({ ...f, projectId: id }))}
          />
        </div>
      </div>

      {showForm && permissions.canCreate && (
        <div className="mb-6 max-w-2xl space-y-3 rounded-xl border border-border-subtle bg-card p-5">
          <ProjectSelect value={form.project_id} onChange={(id) => setForm((f) => ({ ...f, project_id: id }))} />
          <div>
            <Label htmlFor="exp-date">Date</Label>
            <Input
              id="exp-date"
              type="date"
              className="mt-1.5"
              value={form.expense_date}
              onChange={(e) => setForm((f) => ({ ...f, expense_date: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="particulars">Particulars</Label>
            <Input
              id="particulars"
              className="mt-1.5"
              value={form.particulars}
              onChange={(e) => setForm((f) => ({ ...f, particulars: e.target.value }))}
            />
          </div>
          <div>
            <Label>Cash out</Label>
            <CurrencyInput
              className="mt-1.5"
              value={form.cash_out}
              onChange={(v) => setForm((f) => ({ ...f, cash_out: v }))}
            />
          </div>
          <div>
            <Label>VAT rate</Label>
            <select
              className={`mt-1.5 w-full ${selectClass}`}
              value={form.vat_rate}
              onChange={(e) => setForm((f) => ({ ...f, vat_rate: Number(e.target.value) }))}
            >
              {VAT_RATE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-text-secondary">VAT: {formatPeso(vatPreview)}</p>
          </div>
          <Button
            onClick={async () => {
              await create.mutateAsync(form)
              toast.success('Saved successfully')
              setShowForm(false)
            }}
          >
            Save
          </Button>
        </div>
      )}

      <DataTable<DailyExpense>
        columns={[
          { id: 'expense_date', header: 'Date', cell: (r) => formatDate(r.expense_date) },
          {
            id: 'project',
            header: 'Project',
            cell: (r) => r.project?.project_name ?? '—',
          },
          { id: 'particulars', header: 'Particulars', accessorKey: 'particulars' },
          {
            id: 'category',
            header: 'Category',
            cell: (r) => <StatusBadge status={r.expense_category_code ?? 'others'} />,
          },
          {
            id: 'cash_out',
            header: 'Cash Out',
            align: 'right',
            mono: true,
            cell: (r) => formatPeso(r.cash_out),
          },
          {
            id: 'vat',
            header: 'VAT',
            align: 'right',
            mono: true,
            cell: (r) => formatPeso(r.vat),
          },
          {
            id: 'approval',
            header: 'Status',
            cell: (r) => <ApprovalBadge status={r.approval_status} />,
          },
          {
            id: 'actions',
            header: '',
            sortable: false,
            cell: (r) =>
              permissions.canDelete ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation()
                    remove.mutate(r.id)
                  }}
                >
                  Delete
                </Button>
              ) : null,
          },
        ]}
        data={rows}
        loading={isLoading}
        onRowClick={setSelected}
        emptyState={{
          title: 'No expenses recorded',
          description: 'Add daily expenses to track spending across projects.',
        }}
        caption="Daily expenses"
      />

      <DetailDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.particulars ?? 'Expense'}
        subtitle={selected ? formatDate(selected.expense_date) : undefined}
      >
        {selected && (
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="font-mono text-xs text-text-tertiary">Expense ID</dt>
              <dd className="font-mono text-text-secondary">{selected.id.slice(0, 8)}…</dd>
            </div>
            <div>
              <dt className="text-text-secondary">Project</dt>
              <dd>{selected.project?.project_name ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-text-secondary">Category</dt>
              <dd>
                <StatusBadge status={selected.expense_category_code ?? 'others'} />
              </dd>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-text-secondary">Cash out</dt>
                <dd className="font-mono font-bold">{formatPeso(selected.cash_out)}</dd>
              </div>
              <div>
                <dt className="text-text-secondary">VAT</dt>
                <dd className="font-mono font-bold">{formatPeso(selected.vat)}</dd>
              </div>
            </div>
            <div>
              <dt className="text-text-secondary">Approval</dt>
              <dd className="mt-1">
                <ApprovalBadge status={selected.approval_status} />
              </dd>
            </div>
            {permissions.canDelete && (
              <Button variant="danger" size="sm" onClick={() => remove.mutate(selected.id)}>
                Delete expense
              </Button>
            )}
          </dl>
        )}
      </DetailDrawer>
    </div>
  )
}
