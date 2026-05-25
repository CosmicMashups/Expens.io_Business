/**
 * CLI bulk import for legacy Excel workbooks (service role).
 *
 *   npx tsx scripts/migrate-from-excel-cli.ts --year 2024 \
 *     --daily "src/assets/sample/Daily Expenses Report.xlsx" \
 *     --payroll "src/assets/sample/Payroll Summary.xlsx" \
 *     --project-expenses "src/assets/sample/Project Expenses Report.xlsx" \
 *     --pmr "src/assets/sample/Project Monitoring Report.xlsx"
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient } from '@supabase/supabase-js'
import { commitMigration } from '../src/services/excel/importOrchestrator.ts'
import type { MigrationFiles } from '../src/services/excel/importOrchestrator.ts'
import type { Project } from '../src/types/index.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function parseArgs(argv: string[]) {
  const opts: {
    year: number
    aggregate: boolean
    daily?: string
    payroll?: string
    projectExpenses?: string
    pmr?: string
  } = { year: new Date().getFullYear(), aggregate: false }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--year') opts.year = Number(argv[++i])
    else if (a === '--aggregate') opts.aggregate = true
    else if (a === '--daily') opts.daily = argv[++i]
    else if (a === '--payroll') opts.payroll = argv[++i]
    else if (a === '--project-expenses') opts.projectExpenses = argv[++i]
    else if (a === '--pmr') opts.pmr = argv[++i]
  }
  return opts
}

function toFile(filePath: string): File {
  const buf = fs.readFileSync(filePath)
  return new File([buf], path.basename(filePath), {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

async function main() {
  const opts = parseArgs(process.argv)
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) {
    console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (recommended) or VITE_* keys.')
    process.exit(1)
  }

  const supabase = createClient(url, key)
  const { data: projects, error: projErr } = await supabase
    .from('projects')
    .select('*')
    .is('deleted_at', null)
  if (projErr) throw projErr

  const files: MigrationFiles = {}
  if (opts.daily) files.daily = toFile(opts.daily)
  if (opts.payroll) files.payroll = toFile(opts.payroll)
  if (opts.projectExpenses) files.projectExpenses = toFile(opts.projectExpenses)
  if (opts.pmr) files.pmr = toFile(opts.pmr)

  if (!files.daily && !files.payroll && !files.projectExpenses && !files.pmr) {
    console.error('Provide at least one of: --daily, --payroll, --project-expenses, --pmr')
    process.exit(1)
  }

  const result = await commitMigration({
    year: opts.year,
    files,
    projects: projects as Project[],
    supabase,
    aggregateAfterPmr: opts.aggregate,
  })

  console.log(JSON.stringify(result, null, 2))
  if (opts.aggregate) {
    console.log('Note: run Aggregate Expenses in the app if CLI aggregate is not supported.')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
