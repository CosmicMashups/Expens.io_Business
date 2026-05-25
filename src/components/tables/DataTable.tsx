import { useState, useMemo } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LoadingSkeleton } from '@/components/feedback/LoadingSkeleton'
import { EmptyState } from '@/components/feedback/EmptyState'

export type DataTableColumn<T> = {
  id: string
  header: string
  accessorKey?: keyof T
  cell?: (row: T) => React.ReactNode
  align?: 'left' | 'right' | 'center'
  mono?: boolean
  sortable?: boolean
}

export function DataTable<T extends { id?: string }>({
  columns,
  data,
  loading,
  emptyState,
  onRowClick,
  stickyHeader = true,
  getRowId,
  caption,
}: {
  columns: DataTableColumn<T>[]
  data: T[]
  loading?: boolean
  emptyState?: { title: string; description?: string }
  onRowClick?: (row: T) => void
  stickyHeader?: boolean
  getRowId?: (row: T) => string
  caption?: string
}) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [focusedIndex, setFocusedIndex] = useState(-1)

  const tableColumns = useMemo<ColumnDef<T>[]>(
    () =>
      columns.map((col) => ({
        id: col.id,
        accessorKey: col.accessorKey as string,
        header: col.header,
        enableSorting: col.sortable !== false,
        cell: ({ row }) =>
          col.cell ? col.cell(row.original) : String(row.getValue(col.id) ?? ''),
      })),
    [columns],
  )

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: getRowId ?? ((row, i) => (row as { id?: string }).id ?? String(i)),
  })

  if (loading) {
    return (
      <div className="space-y-2 rounded-xl border border-border bg-surface p-4">
        <LoadingSkeleton variant="table-row" count={8} />
      </div>
    )
  }

  if (!loading && data.length === 0 && emptyState) {
    return (
      <div className="rounded-xl border border-border bg-surface">
        <EmptyState title={emptyState.title} description={emptyState.description} />
      </div>
    )
  }

  const rows = table.getRowModel().rows

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" aria-label={caption}>
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead
            className={cn(
              'border-b border-border bg-card',
              stickyHeader && 'sticky top-0 z-10',
            )}
          >
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header, i) => {
                  const col = columns[i]
                  const sorted = header.column.getIsSorted()
                  return (
                    <th
                      key={header.id}
                      className={cn(
                        'px-4 py-3 font-mono text-[11px] uppercase tracking-widest text-text-secondary',
                        col?.align === 'right' && 'text-right',
                        col?.sortable !== false && 'cursor-pointer select-none hover:text-text-primary',
                      )}
                      onClick={col?.sortable !== false ? header.column.getToggleSortingHandler() : undefined}
                    >
                      <span className="inline-flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {sorted === 'asc' && <ChevronUp className="h-3 w-3" />}
                        {sorted === 'desc' && <ChevronDown className="h-3 w-3" />}
                      </span>
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={row.id}
                role={onRowClick ? 'button' : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                className={cn(
                  'border-b border-border transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-elevated focus-visible:bg-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/50',
                  focusedIndex === rowIndex && 'bg-elevated',
                )}
                onClick={() => onRowClick?.(row.original)}
                onKeyDown={(e) => {
                  if (!onRowClick) return
                  if (e.key === 'Enter') onRowClick(row.original)
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setFocusedIndex((i) => Math.min(i + 1, rows.length - 1))
                  }
                  if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setFocusedIndex((i) => Math.max(i - 1, 0))
                  }
                }}
              >
                {row.getVisibleCells().map((cell, i) => {
                  const col = columns[i]
                  return (
                    <td
                      key={cell.id}
                      className={cn(
                        'px-4 py-3.5 text-[13px] text-text-primary',
                        col?.align === 'right' && 'text-right',
                        col?.mono && 'font-mono',
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
