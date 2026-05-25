# Excel import runbook

Use this guide for one-time migration and ongoing bulk uploads from the four legacy workbooks.

## Prerequisites: create projects first

Create every project in **Projects** before importing. Matching is case-insensitive on `project_id` and `project_name` (not fuzzy).

### Sample file reference (`src/assets/sample/`)

| Source file | How projects are referenced | Example values |
|-------------|------------------------------|----------------|
| Payroll Summary.xlsx | Column A = `project_id` | `AMS`, `ASURION`, `BARN` |
| Project Expenses Report.xlsx | Sheet name = `project_id` | `NSCR-MALOLOS` |
| Daily Expenses Report.xlsx | Column H (project tag) | `Asurion - PVD`, `NSCR-Malolos`, `office` |
| Project Monitoring Report.xlsx | PROJECT NAME column | Full names e.g. `NSCR-P (Malolos- Tutuban)...` |

Validate workbook structure: `npm run audit:excel`

## Import order

1. **Daily Expenses** — column H resolves project per row (optional filter override).
2. **Set categories** on daily lines (Appendix A in USER_MANUAL.md) before aggregating.
3. **Payroll** — row codes match `project_id`.
4. **Project Expenses** (optional) — avoid duplicating lines already in Daily if PMR uses Aggregate Expenses.
5. **Monitoring (PMR)** — billing, collections, accomplishment; expense columns rebuilt by aggregate.
6. **Aggregate Expenses** on Monitoring for the year.
7. **Labor Cost** on each PMR — manual reconcile from Payroll (not auto-linked).

## In-app options

| Method | When to use |
|--------|-------------|
| Per-module **Import** button | Single file, quick catch-up |
| **Finance → Data Migration** | All four files in one session with preview |

## CLI (large one-time loads)

```bash
node scripts/migrate-from-excel.mjs --year 2024 \
  --daily path/to/Daily.xlsx \
  --payroll path/to/Payroll.xlsx \
  --project-expenses path/to/ProjectExpenses.xlsx \
  --pmr path/to/PMR.xlsx
```

Requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the environment.
