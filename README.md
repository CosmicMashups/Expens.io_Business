# Expensio Business

Internal finance and project monitoring web app for a construction company. Replaces four Excel workbooks with a unified React + Supabase system.

## Stack

- React 19, TypeScript, Vite, Tailwind CSS 3
- Supabase (PostgreSQL, Auth, RLS, Storage)
- TanStack Query, Zustand, SheetJS, Recharts

## Setup

1. Copy `.env.example` to `.env.local` and set Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

2. Apply database migrations (in order):

```bash
supabase db push
# or run SQL files in supabase/migrations/001 through 005 in the Supabase SQL editor
```

3. Create storage bucket `receipts` (private) in Supabase Dashboard.

4. If signup fails with **"Database error creating new user"**, run [supabase/migrations/007_fix_auth_signup.sql](supabase/migrations/007_fix_auth_signup.sql) in the Supabase SQL editor (fixes RLS blocking the signup trigger).

5. Sign up via the app, then promote your user to owner:

```sql
UPDATE user_profiles SET role = 'owner' WHERE email = 'your@email.com';
```

6. Install and run:

```bash
npm install
npm run dev
```

## Scripts

- `npm run dev` — local dev server
- `npm run build` — production build to `dist/`
- `npm run audit:excel` — verify sample workbook structure in `src/assets/sample/`
- `npm run migrate:excel` — CLI bulk import (see [docs/IMPORT_RUNBOOK.md](docs/IMPORT_RUNBOOK.md))

In the app: **Finance → Data Migration** imports all four legacy files with preview.

## Excel parity

Sample workbooks in `src/assets/sample/` drive import/export layouts:

- `Daily Expenses Report.xlsx`
- `Project Expenses Report.xlsx`
- `Payroll Summary.xlsx`
- `Project Monitoring Report.xlsx`

End-user documentation: [docs/USER_MANUAL.md](docs/USER_MANUAL.md).

- Daily Expenses — single sheet, `DATE` / `CASH OUT` headers
- Payroll — `PAYROLL SUMMARY` 3-row header with pay dates
- Project Expenses — positional columns per project sheet
- Project Monitoring — `CONTRACTED REPORT {year}` with row-2 headers

## Deployment

1. Set env vars on your host (Vercel/Netlify)
2. `npm run build` and deploy `dist/`
3. Confirm RLS policies and run post-deploy checks from the implementation spec
