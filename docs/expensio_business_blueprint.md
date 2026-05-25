# Expens.io Business — Cursor Redesign Prompt

---

## Product Vision

You are redesigning **Expens.io Business**, an enterprise financial operations platform for construction companies. This is a complete UI/UX overhaul that preserves all existing business logic, Supabase integration, routing, and schema while rebuilding the visual layer from scratch.

**Design mandate:** Expens.io Business must feel like it belongs to the same product family as the consumer Expens.io app — same visual DNA, same interaction polish, same premium fintech feel — but tuned entirely for enterprise operations. No personal finance flows. No gamification. No consumer wallet UX. Business workflows only.

**Emotional tone:** Intelligent. Reliable. Professional. Calm under pressure. Premium without being cold.

**Do not touch:**
- Supabase service files (`src/services/`)
- Hook logic (`src/hooks/`)
- Store logic (`src/store/`)
- Type definitions (`src/types/`)
- Route structure (`src/App.tsx` — only reskin the shell, not the routes)
- Zod schemas and form validation logic
- Excel import/export logic (`src/services/excel/`)
- RLS policies, migrations, or database functions

---

## Architecture

### Folder structure to establish

```
src/
├── components/
│   ├── shell/              # AppShell, Sidebar, TopBar, PageHeader
│   ├── primitives/         # Typography, Divider, Badge, Tag, Pill
│   ├── cards/              # KPICard, ProjectCard, AuditRow, ApprovalCard
│   ├── charts/             # ChartWrapper, BarChart, LineChart, PieChart, AreaChart
│   ├── tables/             # DataTable, TableHeader, TableRow, ColumnFilter
│   ├── forms/              # FormSection, FieldGroup, CurrencyInput, DatePicker
│   ├── drawers/            # DetailDrawer, SidePanel
│   ├── modals/             # ConfirmModal, FormModal
│   ├── feedback/           # EmptyState, LoadingSkeleton, ErrorBanner, Toast
│   ├── badges/             # StatusBadge, ApprovalBadge, RoleBadge
│   └── ui/                 # shadcn primitives (Button, Input, Card, Label, etc.)
├── pages/                  # Route-level screens — only visual layer changes
├── lib/                    # supabase.ts, permissions.ts, constants.ts
├── hooks/                  # Untouched
├── services/               # Untouched
├── store/                  # Untouched
└── types/                  # Untouched
```

### Design system file

Create `src/lib/designTokens.ts`:

```ts
export const tokens = {
  colors: {
    bgBase: "#0B0C10",
    bgSurface: "#12151C",
    bgElevated: "#1A1E2A",
    bgCard: "#181C27",
    border: "#1F2535",
    borderSubtle: "#252B3B",
    accentPrimary: "#0099FF",
    accentSecondary: "#00E0D3",
    accentPrimaryMuted: "rgba(0,153,255,0.12)",
    success: "#22C55E",
    successMuted: "rgba(34,197,94,0.12)",
    warning: "#F59E0B",
    warningMuted: "rgba(245,158,11,0.12)",
    danger: "#EF4444",
    dangerMuted: "rgba(239,68,68,0.12)",
    textPrimary: "#F0F4FF",
    textSecondary: "#8892A4",
    textTertiary: "#4B5563",
    navActive: "#0099FF",
    navDefault: "#6B7280",
  },
  radius: {
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "20px",
    "2xl": "24px",
  },
  font: {
    display: "'Syne', sans-serif",
    body: "'Manrope', sans-serif",
    mono: "'JetBrains Mono', monospace",
  },
};
```

Add to `index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
```

### Tailwind config

Extend `tailwind.config.ts` with:

```ts
theme: {
  extend: {
    colors: {
      base: "#0B0C10",
      surface: "#12151C",
      elevated: "#1A1E2A",
      card: "#181C27",
      border: "#1F2535",
      "border-subtle": "#252B3B",
      accent: "#0099FF",
      "accent-muted": "rgba(0,153,255,0.12)",
      teal: "#00E0D3",
      success: "#22C55E",
      warning: "#F59E0B",
      danger: "#EF4444",
      "text-primary": "#F0F4FF",
      "text-secondary": "#8892A4",
      "text-tertiary": "#4B5563",
    },
    fontFamily: {
      display: ["Syne", "sans-serif"],
      body: ["Manrope", "sans-serif"],
      mono: ["JetBrains Mono", "monospace"],
    },
    borderRadius: {
      DEFAULT: "12px",
      sm: "8px",
      lg: "16px",
      xl: "20px",
      "2xl": "24px",
    },
    boxShadow: {
      card: "0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)",
      elevated: "0 4px 24px rgba(0,0,0,0.5)",
      glow: "0 0 20px rgba(0,153,255,0.15)",
    },
  },
}
```

---

## UI / UX Specification

### Global layout

```
┌─────────────────────────────────────────────────┐
│  TopBar (sticky, 56px, blur backdrop)            │
├──────────────┬──────────────────────────────────┤
│  Sidebar     │  Page Content                    │
│  (220px)     │  (scrollable)                    │
│  collapsible │  PageHeader                      │
│  to 64px     │  + Tabs (if applicable)          │
│              │  + Content sections              │
└──────────────┴──────────────────────────────────┘
```

### Global CSS baseline

Add to `src/index.css`:

```css
:root {
  --bg-base: #0B0C10;
  --bg-surface: #12151C;
  --bg-elevated: #1A1E2A;
  --bg-card: #181C27;
  --border: #1F2535;
  --border-subtle: #252B3B;
  --accent: #0099FF;
  --accent-muted: rgba(0, 153, 255, 0.12);
  --teal: #00E0D3;
  --success: #22C55E;
  --warning: #F59E0B;
  --danger: #EF4444;
  --text-primary: #F0F4FF;
  --text-secondary: #8892A4;
  --text-tertiary: #4B5563;
}

* { box-sizing: border-box; }

body {
  background: var(--bg-base);
  color: var(--text-primary);
  font-family: 'Manrope', sans-serif;
  -webkit-font-smoothing: antialiased;
}

::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #1F2535; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #2D3548; }
```

---

## Component System

### `AppShell` — `src/components/shell/AppShell.tsx`

```tsx
// Full-screen layout grid: Sidebar + TopBar + main content
// - background: bg-base (#0B0C10)
// - Sidebar: fixed left, 220px expanded / 64px collapsed
// - TopBar: sticky top, 56px, backdrop-blur, border-bottom border-subtle
// - main: ml-[220px] or ml-[64px], pt-[56px], min-h-screen
// - Sidebar state from uiStore (existing)
// - Smooth transition: transition-all duration-200 ease-in-out
```

Implementation:

```tsx
export function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useUiStore();
  const sidebarWidth = sidebarCollapsed ? 64 : 220;

  return (
    <div className="min-h-screen bg-[#0B0C10] text-[#F0F4FF] font-body">
      <TopBar />
      <Sidebar />
      <main
        className="transition-all duration-200 ease-in-out pt-[56px]"
        style={{ marginLeft: sidebarWidth }}
      >
        {children}
      </main>
    </div>
  );
}
```

---

### `TopBar` — `src/components/shell/TopBar.tsx`

```tsx
// - Height: 56px
// - Background: rgba(18, 21, 28, 0.85) + backdrop-blur-md
// - Border-bottom: 1px solid #1F2535
// - Position: fixed top-0, z-50, full width
// - Left: Expens.io Business wordmark
//   - "Expens.io" in accent blue (#0099FF), font-display weight-700, 18px
//   - " Business" in text-secondary, font-body weight-500, 14px
// - Right: year selector dropdown + user avatar + role badge + sign-out
// - Year selector: compact select with border border-subtle, bg-elevated, rounded-lg, text-sm
```

---

### `Sidebar` — `src/components/shell/Sidebar.tsx`

```tsx
// - Width: 220px expanded, 64px collapsed
// - Background: #12151C
// - Border-right: 1px solid #1F2535
// - Fixed height, overflow-y auto with custom scrollbar
// - Top: logo area 56px (aligned with TopBar)
// - Nav groups with labels when expanded
// - Each nav item:
//   - Icon (20px, Lucide)
//   - Label (hidden when collapsed)
//   - Active: bg-accent-muted, text-accent (#0099FF), left border 2px accent
//   - Hover: bg-[#1A1E2A], text-primary
//   - Inactive: text-secondary
//   - Border-radius: rounded-lg, mx-2, px-3, py-2
//   - Transition: colors 150ms
// - Bottom: collapse toggle button
// - Show Approvals only if canApprove
// - Show Audit only if canViewAudit
// - Show Admin only if canConfigureSettings

const navGroups = [
  {
    label: "Overview",
    items: [
      { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/projects", icon: Briefcase, label: "Projects" },
    ],
  },
  {
    label: "Finance",
    items: [
      { to: "/daily-expenses", icon: Receipt, label: "Daily Expenses" },
      { to: "/project-expenses", icon: FolderOpen, label: "Project Expenses" },
      { to: "/payroll", icon: Users, label: "Payroll" },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/project-monitoring", icon: BarChart3, label: "Monitoring" },
      { to: "/approvals", icon: CheckSquare, label: "Approvals", permission: "canApprove" },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/audit", icon: ClipboardList, label: "Audit Logs", permission: "canViewAudit" },
      { to: "/admin", icon: Settings, label: "Admin", permission: "canConfigureSettings" },
    ],
  },
];
```

---

### `PageHeader` — `src/components/shell/PageHeader.tsx`

```tsx
// Props: title, subtitle?, actions?, tabs?
// - Padding: px-8 pt-8 pb-6
// - Title: font-display font-700 text-2xl text-primary
// - Subtitle: text-sm text-secondary mt-1
// - Actions: right-aligned row (export, import, create buttons)
// - Bottom divider: 1px solid #1F2535 if no tabs
// - Tabs (if provided): horizontal tab strip below, border-b border-subtle
//   - Active tab: border-b-2 border-accent text-accent
//   - Inactive: text-secondary hover:text-primary

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  tabs?: { label: string; value: string }[];
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}
```

---

### `KPICard` — `src/components/cards/KPICard.tsx`

```tsx
// Props: label, value, change?, changeLabel?, icon, variant, loading?
// Variants: default | success | warning | danger | info
// - Background: #181C27
// - Border: 1px solid #1F2535
// - Border-radius: 16px
// - Padding: 20px
// - Icon: 40px circle with variant muted background, variant-colored icon
// - Label: 11px uppercase tracking-widest font-mono text-secondary
// - Value: 28px font-display font-700 text-primary (use JetBrains Mono for currency)
// - Change row: up/down arrow + percentage + label, success/danger colored
// - Loading: shimmer skeleton placeholder
// - Hover: border-color shifts to #2D3548, shadow-card

const variantStyles = {
  default: { icon: "text-accent", bg: "bg-accent-muted" },
  success: { icon: "text-success", bg: "bg-success/10" },
  warning: { icon: "text-warning", bg: "bg-warning/10" },
  danger: { icon: "text-danger", bg: "bg-danger/10" },
  info: { icon: "text-teal", bg: "bg-teal/10" },
};
```

---

### `SectionHeader` — `src/components/primitives/SectionHeader.tsx`

```tsx
// Props: label, action?
// - Label: 11px font-mono uppercase tracking-widest text-secondary
// - Bottom border: gradient from accent/40 to transparent, 1px, mt-2
// - Action: small ghost button or link aligned right
// Used inside cards and page content blocks to label sub-sections
```

---

### `DataTable` — `src/components/tables/DataTable.tsx`

```tsx
// Props: columns, data, loading?, emptyState?, onRowClick?, stickyHeader?, filters?
// - Table container: rounded-xl border border-[#1F2535] overflow-hidden bg-[#12151C]
// - Sticky header: bg-[#181C27] border-b border-[#1F2535]
// - Header cells: 11px font-mono uppercase tracking-widest text-secondary px-4 py-3
// - Body rows: border-b border-[#1F2535] hover:bg-[#1A1E2A] transition-colors cursor-pointer
// - Body cells: 13px text-primary px-4 py-3.5
// - Currency cells: font-mono text-right
// - Loading: 8 skeleton rows with shimmer
// - Empty: EmptyState component centered
// - Keyboard: arrow keys navigate rows, Enter triggers onRowClick
// - Column sorting: click header to toggle asc/desc, chevron icon
// - Sticky filters row below header if filters provided
```

---

### `StatusBadge` — `src/components/badges/StatusBadge.tsx`

```tsx
// Props: status, size?
// Map status strings to visual treatments:
// "active" | "quotation" | "completed" | "on_hold" | "archived"
// "pending" | "approved" | "rejected"
// "employee" | "organization"
// - Pill shape: rounded-full, px-2.5 py-0.5, text-xs font-mono
// - No border, only background + text color
// - Size sm: text-xs / size md: text-sm

const statusMap: Record<string, { label: string; bg: string; text: string }> = {
  active:      { label: "Active",      bg: "bg-success/10",  text: "text-success" },
  quotation:   { label: "Quotation",   bg: "bg-accent-muted", text: "text-accent" },
  completed:   { label: "Completed",   bg: "bg-teal/10",      text: "text-teal" },
  on_hold:     { label: "On Hold",     bg: "bg-warning/10",   text: "text-warning" },
  archived:    { label: "Archived",    bg: "bg-[#252B3B]",    text: "text-secondary" },
  pending:     { label: "Pending",     bg: "bg-warning/10",   text: "text-warning" },
  approved:    { label: "Approved",    bg: "bg-success/10",   text: "text-success" },
  rejected:    { label: "Rejected",    bg: "bg-danger/10",    text: "text-danger" },
};
```

---

### `ApprovalCard` — `src/components/cards/ApprovalCard.tsx`

```tsx
// Props: item (approval_queue row), onApprove, onReject, onViewDetail
// - Card: bg-card border border-subtle rounded-xl p-5
// - Top row: entity type tag (left) + date (right, text-tertiary font-mono text-xs)
// - Entity type: styled pill (Daily Expense = blue, Payroll = teal, PMR = purple)
// - Middle: description, amount (if applicable) font-mono text-lg font-700
// - Bottom: submitter info + action buttons (Approve = success, Reject = danger)
// - Hover: border-[#2D3548] shadow-elevated
// - Pending only: show action buttons. Approved/rejected: show readonly badge + reviewer
```

---

### `ProjectCard` — `src/components/cards/ProjectCard.tsx`

```tsx
// Props: project, onClick
// - Card: bg-card border border-subtle rounded-xl p-5 hover:border-[#2D3548]
// - Status badge top-right
// - Project name: font-display font-700 text-base text-primary
// - Project ID: font-mono text-xs text-tertiary
// - Budget bar: thin progress bar accent-colored, below project name
// - Stats row: expenses, payroll, completion % — font-mono text-xs
// - Bottom: assigned team avatars (if applicable) + last updated
```

---

### `ChartWrapper` — `src/components/charts/ChartWrapper.tsx`

```tsx
// Props: title, subtitle?, children, loading?, action?
// - Container: bg-card border border-subtle rounded-xl p-5
// - Title: font-display font-600 text-base text-primary
// - Subtitle: text-xs text-secondary mt-0.5
// - Action: small ghost button top-right
// - Loading: skeleton placeholder matching chart height
// - Chart area: pt-4

// Recharts defaults to use:
// - CartesianGrid: stroke="#1F2535" strokeDasharray="3 3"
// - Tooltip: bg-elevated border-border rounded-lg shadow-elevated
// - Axes: tick color #8892A4, font-mono 11px
// - Bar/Line: fill/stroke from accent palette
// - Animation: duration 600ms ease-in-out
```

Chart color palette (use in order):

```ts
export const chartPalette = [
  "#0099FF", // accent primary
  "#00E0D3", // teal
  "#22C55E", // success
  "#F59E0B", // warning
  "#A855F7", // purple
  "#F97316", // orange
  "#EC4899", // pink
  "#06B6D4", // cyan
];
```

---

### `EmptyState` — `src/components/feedback/EmptyState.tsx`

```tsx
// Props: icon, title, description, action?
// - Centered, py-16
// - Icon: 48px Lucide icon, text-tertiary, mb-4
// - Title: font-display font-600 text-base text-primary
// - Description: text-sm text-secondary text-center max-w-xs mt-1
// - Action: ghost or accent button mt-4
```

---

### `LoadingSkeleton` — `src/components/feedback/LoadingSkeleton.tsx`

```tsx
// - bg-[#1A1E2A] rounded-lg
// - animate-pulse (Tailwind)
// - Variants: text (h-4 w-X), card (h-32), table-row (h-12 w-full), kpi (h-24 w-full)
```

---

### `DetailDrawer` — `src/components/drawers/DetailDrawer.tsx`

```tsx
// Props: open, onClose, title, subtitle?, children, actions?
// - Side panel sliding from right, 480px wide
// - Overlay: backdrop-blur-sm bg-black/40
// - Panel: bg-surface border-l border-subtle h-screen overflow-y-auto
// - Header: 64px, px-6, border-b border-subtle, close button right
// - Body: px-6 py-5
// - Footer (actions): sticky bottom, px-6 py-4, border-t border-subtle
// - Animation: translateX from 100% to 0, duration 250ms ease-out
```

---

### `ConfirmModal` — `src/components/modals/ConfirmModal.tsx`

```tsx
// Props: open, onClose, onConfirm, title, description, confirmLabel, variant
// - Overlay: fixed inset-0, backdrop-blur-sm bg-black/50
// - Modal: bg-elevated border border-subtle rounded-2xl p-6, max-w-md, shadow-elevated
// - Title: font-display font-700 text-lg
// - Description: text-sm text-secondary mt-2
// - Actions: row mt-6, cancel ghost + confirm (variant-colored)
// - Animation: scale from 0.95 to 1 + fade in, duration 200ms
```

---

### `FormSection` — `src/components/forms/FormSection.tsx`

```tsx
// Props: title, description?, children
// - Section container with pb-6 border-b border-subtle last:border-0
// - Title: font-mono text-xs uppercase tracking-widest text-secondary mb-1
// - Description: text-xs text-tertiary mb-4
// - Children: grid grid-cols-2 gap-4 or grid-cols-1 as needed
```

---

### `CurrencyInput` — `src/components/forms/CurrencyInput.tsx`

```tsx
// - Left prefix: "₱" in text-secondary, bg-elevated, border-r border-subtle
// - Input: font-mono text-right text-primary
// - Formats on blur with toLocaleString
// - Integrates with React Hook Form via Controller
```

---

## Page-by-page Redesign

---

### `/login` — Login Page

```tsx
// Full-screen centered layout, bg-base
// Center card: bg-elevated border border-subtle rounded-2xl p-10 w-[400px] shadow-elevated
// Top: wordmark — "Expens.io" accent + " Business" secondary, font-display, centered
// Subtitle: "Enterprise Financial Operations", text-sm text-secondary, centered, mb-8
// Form: email + password inputs, sign-in button (accent), Google OAuth button (ghost)
// Input style: bg-surface border border-subtle rounded-lg px-3 py-2.5 text-sm
//   focus: border-accent ring-1 ring-accent/20
// Sign in button: full-width, bg-accent text-white font-600 rounded-lg py-2.5
// Google button: full-width, border border-subtle bg-surface text-primary, Google icon left
// Footer: version number text-tertiary text-xs text-center mt-6
// Background: subtle radial gradient from accent/5 at top-center
```

---

### `/dashboard` — Dashboard

**Layout:**

```
PageHeader: "Dashboard" + year selector (move from TopBar to here, inline right)
KPI Grid: 6 cards, 3-column responsive
Charts Row 1: Monthly Expenses (BarChart, 8col) + Category Breakdown (PieChart, 4col)
Charts Row 2: Payroll Trend (AreaChart, 6col) + Project Profitability (BarChart, 6col)
Alerts Banner: overdue invoices (if any), dismissible
Recent Activity: last 10 approval queue items
```

**KPI cards:**

```tsx
const kpiItems = [
  { label: "Total Expenses YTD", icon: Receipt, variant: "default" },
  { label: "Payroll YTD", icon: Users, variant: "info" },
  { label: "Active Projects", icon: Briefcase, variant: "success" },
  { label: "Amount Collected", icon: TrendingUp, variant: "success" },
  { label: "Outstanding Balance", icon: AlertCircle, variant: "warning" },
  { label: "Yearly Profit", icon: DollarSign, variant: "success" }, // danger if negative
];
// All data from get_dashboard_summary RPC — do not change the hook
```

**Chart specifics:**
- Monthly Expenses: `<BarChart>` grouped by month, accent-colored bars, cartesian grid
- Category Breakdown: `<PieChart>` with chartPalette, inner radius 40%, legend right
- Payroll Trend: `<AreaChart>` teal fill with gradient, 12 months
- Project Profitability: `<BarChart>` horizontal, one bar per project, success/danger by profit sign

---

### `/projects` — Projects

**Layout:**

```
PageHeader: "Projects" + [+ New Project] button (accent)
Filter bar: search input + status filter chips (All / Active / Quotation / Completed / On Hold / Archived)
Toggle: Grid view | Table view (icon buttons, top-right of content area)
Grid: 3-column ProjectCard grid
Table: DataTable with columns: ID, Name, Status, Budget, Created, Actions
```

**Filter chips:**

```tsx
// Horizontal scrollable row of pill buttons
// Active: bg-accent text-white
// Inactive: bg-surface border border-subtle text-secondary hover:text-primary
```

**Project detail panel (`/projects/:id`):**

```tsx
// Full page with back button in PageHeader
// Two-column layout: left (project info) | right (linked financial summary)
// Left: name, status, dates, description, assigned team
// Right: KPI mini-cards (expenses, payroll, monitoring reports)
// Below: tabbed DataTables for Daily Expenses / Project Expenses / Monitoring Reports
```

---

### `/daily-expenses` — Daily Expenses

**Layout:**

```
PageHeader: "Daily Expenses" + [Import Excel] + [Export] + [+ Add Expense] (if canCreate)
Filter bar (sticky): year select + month select + project select + category select + search
DataTable columns: Date | Project | Particulars | Category | Cash Out | VAT | Status | Actions
Inline create row: appears at top of table when [+ Add] clicked (if canCreate)
```

**Table behavior:**
- Category column: colored StatusBadge per category code
- Cash Out + VAT: font-mono right-aligned, formatted ₱X,XXX.XX
- Status: ApprovalBadge (pending/approved/rejected)
- Row click: opens DetailDrawer with full expense info + edit form (if canEdit)
- Actions column: edit icon + delete icon (ghost, small, show on row hover only)

**Detail drawer content:**
```
Expense ID (font-mono text-tertiary)
Project name
Date, Particulars, Category
Cash Out | VAT | Total
Receipt link (if present)
Approval status + approver
Notes
Edit form (if canEdit and not approved)
```

---

### `/project-expenses` — Project Expenses

**Layout:**

```
PageHeader: "Project Expenses" + [Import] + [Export] + [+ Add]
Filter bar: project select + search
DataTable: Date | Project | Description | Amount | VAT | Supplier | Status | Actions
Row click: DetailDrawer
```

Same visual treatment as Daily Expenses.

---

### `/payroll` — Payroll

**Layout:**

```
PageHeader: "Payroll" + year selector + [Import] + [Export] + [+ Add Entry]
Filter bar: project select + worker type filter (All / Employee / Organization) + search
Layout mode toggle: Summary | Grid
```

**Grid view:**

```tsx
// Horizontal scroll table
// Row: Worker name | Type | Project | Jan 15 | Jan 31 | ... | Dec 31 | Total
// Period headers: grouped month labels above
// Cells: font-mono text-right, amount formatted
// Empty cells: text-tertiary "—"
// Total column: font-700 text-primary
// Locked rows (if payroll_lock_enabled): lock icon, no edit
```

**Summary view:**

```tsx
// Card per project: project name + total payroll + period breakdown mini chart
```

---

### `/project-monitoring` — Project Monitoring

**Layout:**

```
PageHeader: "Project Monitoring" + year selector + [Import] + [Export] + [+ New Report]
Filter bar: project select + status filter + date range
Cards grid or list toggle
```

**Monitoring card:**

```tsx
// bg-card border border-subtle rounded-xl p-5
// Top: Report ID (font-mono text-tertiary text-xs) + status badge
// Client name: font-display font-700 text-base
// Progress bar: accomplishment %, accent-colored, with percentage label
// Stats grid (2x2):
//   Contracted Amount | Tax Amount
//   Amount Collected  | Balance
// Expenses breakdown: small horizontal stacked bar by category
// Profit: large font-mono, success if positive, danger if negative
// Actions: [Aggregate Expenses] + [View Detail] + [Edit] + [Approve] (if applicable)
```

**Detail view (`/project-monitoring/:id`):**

```tsx
// Two columns: left (report info + financial summary) | right (category breakdown table)
// Category table: 17 expense category rows with amounts, font-mono
// Timeline: DateStart → DateFinish visual bar
// Approve/reject action bar at bottom (if pending + canApprove)
```

---

### `/approvals` — Approval Queue

**Layout:**

```
PageHeader: "Approvals"
Tab strip: All | Pending | Approved | Rejected (with count badges)
Filter bar: entity type filter + project filter + date range
```

**Queue list:**

```tsx
// Vertical stack of ApprovalCards
// Pending tab: sorted by oldest first
// Group by entity type with SectionHeader dividers
// Bulk select (checkbox) + [Approve All Selected] action bar at bottom when items selected
```

---

### `/audit` — Audit Logs

**Layout:**

```
PageHeader: "Audit Logs" + date range filter + actor filter + module filter
DataTable:
  Timestamp (font-mono text-xs) | Actor | Role badge | Module | Action | Record ID
Row click: expands inline to show JSON diff (before/after)
```

**Diff display:**

```tsx
// Inline expandable row, bg-[#0B0C10] rounded-lg p-4 font-mono text-xs
// Before: text-danger / After: text-success
// Side-by-side diff for changed fields only
```

---

### `/admin` — Admin

**Layout:**

```
PageHeader: "Administration"
Tab strip: Users | Settings
```

**Users tab:**

```tsx
// DataTable: Name | Email | Role | Status | Actions
// Role: RoleBadge (owner=accent, finance_manager=teal, accountant=success, etc.)
// Actions: edit role + deactivate (owner/developer only)
// Edit role: inline dropdown select, save with confirmation
```

**Settings tab:**

```tsx
// FormSection layout:
// "Workflows" section: expense approvals toggle, payroll lock toggle, report approvals toggle
// "Finance" section: default VAT rate input
// Each toggle: styled Switch component (shadcn) with label + description text-tertiary
// Save button: accent, only appears when changes made (dirty state)
```

---

## Interaction Rules

### Navigation

```
- Active route: accent left border on nav item, accent text, accent-muted bg
- Route transitions: fade in 200ms (add React Transition Group or CSS transitions on route outlet)
- Sidebar collapse: smooth 200ms width transition, labels fade out, tooltips appear on hover
- TopBar year selector: changes propagate via Zustand or query param
```

### Tables

```
- Row hover: bg-[#1A1E2A]
- Row click: opens DetailDrawer (right slide)
- Keyboard navigation: ArrowUp/Down moves focus between rows, Enter opens drawer, Escape closes
- Sort: click column header toggles asc → desc → none
- Column with sorting shows ChevronUp/Down icon
- Sticky header on scroll (use overflow-auto + thead position:sticky top-0)
```

### Forms

```
- Error state: border-danger, error message text-danger text-xs below field
- Focus state: border-accent ring-1 ring-accent/20
- Disabled: opacity-50 cursor-not-allowed
- Submit button: shows LoadingSpinner when pending, disabled
- Success: Sonner toast "Saved successfully" success variant
- Error: Sonner toast with error message, danger variant
```

### Modals and drawers

```
- All overlays: backdrop-blur-sm + bg-black/40
- Open animation: scale 0.97→1 + fade, 200ms
- Close: Escape key, click outside, or close button
- Focus trap inside modal when open
- Scroll lock on body when modal open
```

### Buttons

```tsx
// Variants:
// - primary: bg-accent text-white hover:bg-accent/90
// - success: bg-success text-white
// - danger: bg-danger text-white  
// - ghost: bg-transparent border border-subtle text-secondary hover:text-primary hover:bg-elevated
// - link: text-accent underline-offset-4 hover:underline
// Sizes: sm (h-8 text-xs px-3) | md (h-9 text-sm px-4) | lg (h-10 text-base px-5)
// Loading: replace children with <LoadingSpinner size="sm" />
// Rounded: rounded-lg (all buttons)
// Transition: colors 150ms
```

---

## Backend Integration Notes

**Do not change any of the following:**

- `src/services/projectMonitoringService.ts` — all RPC calls preserved
- `src/services/excel/importer.ts` and `exporter.ts`
- `src/hooks/` — all hook files untouched
- `src/store/authStore.ts` and `src/store/uiStore.ts`
- `src/lib/permissions.ts`
- `src/lib/supabase.ts`
- `src/types/index.ts`

**Only the following may be modified in existing files:**

- Class names / Tailwind classes in page components and layout components
- Import paths when moving components to new folder structure
- `src/components/ui/` — reskin shadcn primitives to match dark theme

**Toast notifications:**

```tsx
// Keep Sonner. Reskin with:
// toastOptions: {
//   style: { background: "#1A1E2A", border: "1px solid #1F2535", color: "#F0F4FF" },
//   className: "font-body text-sm",
// }
// In App.tsx: <Toaster position="bottom-right" toastOptions={...} />
```

**TanStack Query devtools:** Keep in dev only.

---

## Production Readiness

### Loading states

Every data-fetching page must implement:

```tsx
// 1. KPI cards: <LoadingSkeleton variant="kpi" /> × N while loading
// 2. DataTable: <LoadingSkeleton variant="table-row" /> × 8 while loading
// 3. Charts: <LoadingSkeleton variant="card" className="h-64" /> while loading
// 4. ProjectCards: <LoadingSkeleton variant="card" /> × 6 while loading
// Never show stale data mixed with loading state
```

### Empty states

Every list/table/chart needs an `<EmptyState />`:

```tsx
const emptyStates = {
  projects:       { icon: Briefcase,    title: "No projects yet",             description: "Create your first project to start tracking expenses." },
  dailyExpenses:  { icon: Receipt,      title: "No expenses recorded",        description: "Add daily expenses to track spending across projects." },
  payroll:        { icon: Users,        title: "No payroll entries",          description: "Add payroll records for this year and project." },
  monitoring:     { icon: BarChart3,    title: "No monitoring reports",       description: "Create a contracted report to begin tracking." },
  approvals:      { icon: CheckSquare,  title: "All caught up",               description: "No items pending your review." },
  audit:          { icon: ClipboardList,title: "No audit events found",       description: "Activity will appear here as changes are made." },
};
```

### Error boundaries

Wrap each route page with an `ErrorBoundary` that shows:

```tsx
// bg-card border border-danger/20 rounded-xl p-8 text-center
// Icon: AlertTriangle text-danger 40px
// Title: "Something went wrong"
// Description: error.message (dev only) else generic
// Action: [Retry] button that resets the boundary + refetches
```

### Accessibility

```
- All interactive elements: focus-visible ring (ring-2 ring-accent/50 ring-offset-2 ring-offset-base)
- All icon-only buttons: aria-label
- All form inputs: associated <label> via htmlFor
- All tables: <caption> or aria-label on <table>
- DataTable keyboard nav: role="row" + tabIndex on rows
- Status badges: aria-label="Status: {status}"
- Modal: role="dialog" aria-modal aria-labelledby
- Color is never the only indicator (always paired with icon or text)
- Minimum touch target: 44×44px on all interactive elements
- Reduced motion: @media (prefers-reduced-motion: reduce) — disable transitions and animations
```

### Responsive behavior

```
- Sidebar: at <768px, collapse to overlay drawer (slide over content, not push)
- KPI grid: 2-col at md, 1-col at sm
- Charts: full-width stack on mobile
- DataTable: horizontal scroll on mobile, pin first column
- Page padding: px-8 desktop → px-4 mobile
- DetailDrawer: full-screen on mobile
```

---

## Scalability

### Design token evolution

All color, spacing, and typography values must reference `designTokens.ts` or CSS custom properties. No hardcoded hex values in component files. Use Tailwind classes that map to the extended config.

### Component composition pattern

```tsx
// Prefer composition over configuration:
// <ChartWrapper title="Monthly Expenses" loading={isLoading}>
//   <RechartsBarChart data={data} />
// </ChartWrapper>
// Not: <BarChart title="..." data={...} loading={...} />
```

### New modules

When adding future modules (e.g. Procurement, Contracts, Budgeting):

```
1. Add nav item to sidebar navGroups array
2. Add route in App.tsx
3. Reuse PageHeader + DataTable + DetailDrawer + KPICard
4. Add service file in src/services/
5. Add hook in src/hooks/
6. No new design primitives unless strictly necessary
```

### Performance

```
- All page-level components: React.lazy() + <Suspense fallback={<PageSkeleton />}>
- Charts: only render when tab/section is visible (IntersectionObserver)
- DataTable: virtualize rows if > 100 items (use @tanstack/react-virtual)
- Images / receipts: lazy load with loading="lazy"
- Bundle: keep chart library (Recharts) in separate chunk via Vite manualChunks
```

---

## Implementation Order

Execute in this sequence:

1. Install fonts (Syne, Manrope, JetBrains Mono) via Google Fonts in `index.html`
2. Establish `tailwind.config.ts` extended palette and `src/index.css` CSS variables
3. Create `src/lib/designTokens.ts`
4. Build shell: `TopBar`, `Sidebar`, `AppShell`, `PageHeader`
5. Build primitives: `SectionHeader`, `StatusBadge`, `LoadingSkeleton`, `EmptyState`
6. Build feedback: `ConfirmModal`, `DetailDrawer`, `Toast config`
7. Build data primitives: `KPICard`, `ChartWrapper`, `DataTable`
8. Build domain cards: `ProjectCard`, `ApprovalCard`
9. Build form primitives: `FormSection`, `CurrencyInput`, `FormModal`
10. Redesign Login page
11. Redesign Dashboard page (wire existing hooks, replace UI only)
12. Redesign Projects pages
13. Redesign Daily Expenses page
14. Redesign Project Expenses page
15. Redesign Payroll page
16. Redesign Project Monitoring page
17. Redesign Approvals page
18. Redesign Audit Logs page
19. Redesign Admin pages
20. Audit: accessibility pass, empty states, loading states, responsive
21. Final: remove all legacy component files replaced by new system