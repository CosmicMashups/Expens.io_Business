import type { SupabaseClient } from '@supabase/supabase-js'
import {
  importDailyExpenses,
  importPayroll,
  importProjectExpenses,
  importProjectMonitoring,
} from '@/services/excel/importer'
import { dailyExpensesService } from '@/services/dailyExpenses'
import { payrollService } from '@/services/payroll'
import { projectExpensesService } from '@/services/projectExpenses'
import { projectMonitoringService } from '@/services/projectMonitoring'
import { projectsService } from '@/services/projects'
import { insertInChunks } from '@/lib/bulkChunk'
import {
  buildSheetToProjectUuid,
  findProjectByCode,
  findProjectByNameOrId,
  findProjectByTag,
} from '@/lib/projectResolve'
import type { DailyExpense, Payroll, Project, ProjectExpense, ProjectMonitoringReport } from '@/types'
import type { PartialPMR } from '@/types/excel'

export interface ImportPreviewSection {
  label: string
  valid: number
  errors: number
  skipped: number
  skippedSamples: string[]
}

export interface ImportPreview {
  year: number
  sections: ImportPreviewSection[]
  canCommit: boolean
}

export interface MigrationFiles {
  daily?: File
  payroll?: File
  projectExpenses?: File
  pmr?: File
}

export interface CommitImportOptions {
  year: number
  files: MigrationFiles
  /** Preloaded projects (CLI); defaults to projectsService.list(). */
  projects?: Project[]
  /** Service-role client for CLI migrations (bypasses browser anon client). */
  supabase?: SupabaseClient
  /** If set, all daily rows without a tag match use this project UUID. */
  dailyProjectOverrideId?: string
  aggregateAfterPmr?: boolean
}

async function bulkInsertTable(
  table: string,
  rows: Record<string, unknown>[],
  supabase: SupabaseClient,
): Promise<number> {
  if (!rows.length) return 0
  return insertInChunks(rows, async (chunk) => {
    const { error } = await supabase.from(table).insert(chunk)
    if (error) throw error
  })
}

export interface CommitImportResult {
  daily: { imported: number; skipped: number }
  payroll: { imported: number; skipped: number }
  projectExpenses: { imported: number; skipped: number }
  pmr: { imported: number; skipped: number }
  aggregated?: number
}

function previewSection(
  label: string,
  valid: number,
  errors: number,
  skipped: number,
  skippedSamples: string[],
): ImportPreviewSection {
  return { label, valid, errors, skipped, skippedSamples }
}

export async function previewMigration(
  files: MigrationFiles,
  year: number,
  projectsInput?: Project[],
): Promise<ImportPreview> {
  const sections: ImportPreviewSection[] = []
  const projects = projectsInput ?? (await projectsService.list())

  if (files.daily) {
    const results = await importDailyExpenses(files.daily, '', year)
    let valid = 0
    let errors = 0
    const skippedSamples: string[] = []
    let skipped = 0
    for (const r of results) {
      errors += r.errors.length
      for (const row of r.valid) {
        const tag = row.associated_project_name
        if (findProjectByTag(projects, tag)) {
          valid++
        } else if (!tag?.trim()) {
          skipped++
          if (skippedSamples.length < 5) skippedSamples.push('(no project tag)')
        } else {
          skipped++
          if (skippedSamples.length < 5) skippedSamples.push(tag!)
        }
      }
    }
    sections.push(previewSection('Daily Expenses', valid, errors, skipped, skippedSamples))
  }

  if (files.payroll) {
    const results = await importPayroll(files.payroll)
    let valid = 0
    let errors = 0
    const skippedSamples: string[] = []
    let skipped = 0
    for (const r of results) {
      errors += r.errors.length
      for (const row of r.valid) {
        const code = row.worker_name ?? ''
        if (findProjectByCode(projects, code)) valid++
        else {
          skipped++
          if (skippedSamples.length < 5) skippedSamples.push(code || '(empty code)')
        }
      }
    }
    sections.push(previewSection('Payroll', valid, errors, skipped, skippedSamples))
  }

  if (files.projectExpenses) {
    const bySheet = buildSheetToProjectUuid(projects)
    const results = await importProjectExpenses(files.projectExpenses, bySheet)
    let valid = 0
    let errors = 0
    const skippedSamples: string[] = []
    let skipped = 0
    for (const r of results) {
      errors += r.errors.length
      for (const row of r.valid) {
        if (row.project_id) valid++
        else {
          skipped++
          if (skippedSamples.length < 5) skippedSamples.push(r.sheetName)
        }
      }
    }
    sections.push(previewSection('Project Expenses', valid, errors, skipped, skippedSamples))
  }

  if (files.pmr) {
    const results = await importProjectMonitoring(files.pmr)
    let valid = 0
    let errors = 0
    const skippedSamples: string[] = []
    let skipped = 0
    for (const r of results) {
      errors += r.errors.length
      for (const row of r.valid) {
        const name = row._project_name ?? row.report_description ?? ''
        if (findProjectByNameOrId(projects, name) && row.report_id) valid++
        else {
          skipped++
          if (skippedSamples.length < 5) skippedSamples.push(name || r.sheetName)
        }
      }
    }
    sections.push(previewSection('Project Monitoring', valid, errors, skipped, skippedSamples))
  }

  return {
    year,
    sections,
    canCommit: sections.some((s) => s.valid > 0),
  }
}

export async function commitMigration(opts: CommitImportOptions): Promise<CommitImportResult> {
  const projects = opts.projects ?? (await projectsService.list())
  const result: CommitImportResult = {
    daily: { imported: 0, skipped: 0 },
    payroll: { imported: 0, skipped: 0 },
    projectExpenses: { imported: 0, skipped: 0 },
    pmr: { imported: 0, skipped: 0 },
  }

  const sb = opts.supabase
  if (opts.files.daily) {
    result.daily = await commitDailyImport(
      opts.files.daily,
      projects,
      opts.year,
      opts.dailyProjectOverrideId,
      sb,
    )
  }
  if (opts.files.payroll) {
    result.payroll = await commitPayrollImport(opts.files.payroll, projects, sb)
  }
  if (opts.files.projectExpenses) {
    result.projectExpenses = await commitProjectExpensesImport(opts.files.projectExpenses, projects, sb)
  }
  if (opts.files.pmr) {
    result.pmr = await commitPmrImport(opts.files.pmr, projects, sb)
  }
  if (opts.aggregateAfterPmr && (result.pmr.imported > 0 || result.daily.imported > 0)) {
    if (sb) {
      console.warn('Aggregate after import is only supported in the web app (Monitoring → Aggregate Expenses).')
    } else {
      const aggregated = await projectMonitoringService.aggregateAllForYear(opts.year)
      result.aggregated = aggregated.length
    }
  }
  return result
}

export async function commitDailyImport(
  file: File,
  projects: Project[],
  year: number,
  overrideProjectId?: string,
  supabase?: SupabaseClient,
): Promise<{ imported: number; skipped: number; skippedTags: string[] }> {
  const results = await importDailyExpenses(file, '', year)
  const toInsert: Partial<DailyExpense>[] = []
  const skippedTags: string[] = []

  for (const r of results) {
    for (const row of r.valid) {
      const tag = row.associated_project_name
      const proj =
        findProjectByTag(projects, tag) ??
        (overrideProjectId ? projects.find((p) => p.id === overrideProjectId) : undefined)
      if (!proj) {
        if (tag && !skippedTags.includes(tag)) skippedTags.push(tag)
        else if (!tag?.trim() && !skippedTags.includes('(no project tag)')) skippedTags.push('(no project tag)')
        continue
      }
      const { associated_project_name, ...rest } = row
      void associated_project_name
      toInsert.push({ ...rest, project_id: proj.id } as Partial<DailyExpense>)
    }
  }

  const imported = supabase
    ? await bulkInsertTable('daily_expenses', toInsert as Record<string, unknown>[], supabase)
    : await insertInChunks(toInsert, (chunk) => dailyExpensesService.bulkInsert(chunk))
  const skipped = results.reduce((n, r) => n + r.valid.length, 0) - imported
  return { imported, skipped, skippedTags }
}

export async function commitPayrollImport(
  file: File,
  projects: Project[],
  supabase?: SupabaseClient,
): Promise<{ imported: number; skipped: number; skippedTags: string[] }> {
  const results = await importPayroll(file)
  const toInsert: Partial<Payroll>[] = []
  const skippedTags: string[] = []

  for (const r of results) {
    for (const row of r.valid) {
      const code = row.worker_name ?? ''
      const proj = findProjectByCode(projects, code)
      if (!proj) {
        if (code && !skippedTags.includes(code)) skippedTags.push(code)
        continue
      }
      toInsert.push({ ...row, project_id: proj.id })
    }
  }

  const cleaned = toInsert.map(({ total_payroll: _t, ...r }) => r)
  const imported = supabase
    ? await bulkInsertTable('payroll', cleaned as Record<string, unknown>[], supabase)
    : await insertInChunks(toInsert, (chunk) => payrollService.bulkInsert(chunk))
  const skipped = results.reduce((n, r) => n + r.valid.length, 0) - imported
  return { imported, skipped, skippedTags }
}

export async function commitProjectExpensesImport(
  file: File,
  projects: Project[],
  supabase?: SupabaseClient,
): Promise<{ imported: number; skipped: number; skippedTags: string[] }> {
  const bySheet = buildSheetToProjectUuid(projects)
  const results = await importProjectExpenses(file, bySheet)
  const toInsert: Partial<ProjectExpense>[] = []
  const skippedTags: string[] = []

  for (const r of results) {
    for (const row of r.valid) {
      if (!row.project_id) {
        if (!skippedTags.includes(r.sheetName)) skippedTags.push(r.sheetName)
        continue
      }
      toInsert.push(row)
    }
  }

  const imported = supabase
    ? await bulkInsertTable('project_expenses', toInsert as Record<string, unknown>[], supabase)
    : await insertInChunks(toInsert, (chunk) => projectExpensesService.bulkInsert(chunk))
  const skipped = results.reduce((n, r) => n + r.valid.length, 0) - imported
  return { imported, skipped, skippedTags }
}

export async function commitPmrImport(
  file: File,
  projects: Project[],
  supabase?: SupabaseClient,
): Promise<{ imported: number; skipped: number; skippedTags: string[] }> {
  const results = await importProjectMonitoring(file)
  const toInsert: Partial<ProjectMonitoringReport>[] = []
  const skippedTags: string[] = []

  for (const r of results) {
    for (const row of r.valid) {
      const name = row._project_name ?? row.report_description ?? ''
      const proj = findProjectByNameOrId(projects, name)
      if (!proj || !row.report_id) {
        if (name && !skippedTags.includes(name)) skippedTags.push(name)
        continue
      }
      const { _project_name, profit, balance_to_be_collected, ...rest } = row as PartialPMR
      void _project_name
      void profit
      void balance_to_be_collected
      toInsert.push({ ...rest, project_id: proj.id } as Partial<ProjectMonitoringReport>)
    }
  }

  const imported = supabase
    ? await bulkInsertTable(
        'project_monitoring_reports',
        toInsert as Record<string, unknown>[],
        supabase,
      )
    : await insertInChunks(toInsert, (chunk) => projectMonitoringService.bulkInsert(chunk))
  const skipped = results.reduce((n, r) => n + r.valid.length, 0) - imported
  return { imported, skipped, skippedTags }
}
