const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageNumber, PageBreak, LevelFormat, TableOfContents
} = require('docx');
const fs = require('fs');

// ── Colours (matching system navy/amber theme) ─────────────────────────────
const NAVY    = "1E3A5F";
const BLUE    = "2E75B6";
const WHITE   = "FFFFFF";
const ALTROW  = "EEF4FA";
const NOTEBG  = "EFF6FF";
const TIPBG   = "F0FDF4";
const WARNBG  = "FFF7ED";

// ── Layout ────────────────────────────────────────────────────────────────
const TW = 9360; // content width in DXA (US Letter, 1" margins)
const CM = { top: 90, bottom: 90, left: 120, right: 120 };
const bdr  = { style: BorderStyle.SINGLE, size: 1, color: "AECBEA" };
const BDRS = { top: bdr, bottom: bdr, left: bdr, right: bdr };

// ── Paragraph / run builders ───────────────────────────────────────────────
function run(text, opts) {
  return new TextRun(Object.assign({ text: text, font: "Arial", size: 22 }, opts || {}));
}

function body(text) {
  return new Paragraph({ spacing: { before: 80, after: 80 }, children: [run(text)] });
}

function blank() {
  return new Paragraph({ spacing: { before: 40, after: 40 }, children: [run("")] });
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore: true,
    spacing: { before: 360, after: 180 },
    children: [new TextRun({ text: text, font: "Arial", size: 34, bold: true, color: NAVY })]
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text: text, font: "Arial", size: 28, bold: true, color: BLUE })]
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 180, after: 80 },
    children: [new TextRun({ text: text, font: "Arial", size: 24, bold: true, color: NAVY })]
  });
}

function bullet(text, lvl) {
  return new Paragraph({
    numbering: { reference: "bullets", level: lvl || 0 },
    spacing: { before: 40, after: 40 },
    children: [run(text)]
  });
}

function step(text) {
  return new Paragraph({
    numbering: { reference: "numbers", level: 0 },
    spacing: { before: 40, after: 40 },
    children: [run(text)]
  });
}

function callout(label, text, fill, col) {
  return new Table({
    width: { size: TW, type: WidthType.DXA },
    columnWidths: [TW],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: BDRS,
            shading: { fill: fill, type: ShadingType.CLEAR },
            margins: CM,
            width: { size: TW, type: WidthType.DXA },
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: label + ": ", font: "Arial", size: 22, bold: true, color: col }),
                  new TextRun({ text: text, font: "Arial", size: 22 })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}

function NOTE(text)    { return callout("NOTE",    text, NOTEBG, BLUE);    }
function TIP(text)     { return callout("TIP",     text, TIPBG,  "166534"); }
function WARNING(text) { return callout("WARNING", text, WARNBG, "92400E"); }

function screenshot(label) {
  return new Table({
    width: { size: TW, type: WidthType.DXA },
    columnWidths: [TW],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: BDRS,
            shading: { fill: "F5F5F5", type: ShadingType.CLEAR },
            margins: { top: 200, bottom: 200, left: 200, right: 200 },
            width: { size: TW, type: WidthType.DXA },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: "[ Screenshot: " + label + " ]", font: "Arial", size: 20, italics: true, color: "888888" })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}

// ── Table builders ────────────────────────────────────────────────────────
function hCell(text, w) {
  return new TableCell({
    borders: BDRS,
    shading: { fill: NAVY, type: ShadingType.CLEAR },
    margins: CM,
    width: { size: w, type: WidthType.DXA },
    children: [new Paragraph({ children: [new TextRun({ text: text, font: "Arial", size: 20, bold: true, color: WHITE })] })]
  });
}

function dCell(text, w, fill, bold) {
  return new TableCell({
    borders: BDRS,
    shading: { fill: fill || WHITE, type: ShadingType.CLEAR },
    margins: CM,
    width: { size: w, type: WidthType.DXA },
    children: [new Paragraph({ children: [new TextRun({ text: text, font: "Arial", size: 20, bold: !!bold })] })]
  });
}

function table2(rows, w1, w2, header) {
  var trs = [];
  if (header) {
    trs.push(new TableRow({ tableHeader: true, children: [hCell(header[0], w1), hCell(header[1], w2)] }));
  }
  rows.forEach(function(r, i) {
    var f = i % 2 === 0 ? WHITE : ALTROW;
    trs.push(new TableRow({ children: [dCell(r[0], w1, f, true), dCell(r[1], w2, f, false)] }));
  });
  return new Table({ width: { size: TW, type: WidthType.DXA }, columnWidths: [w1, w2], rows: trs });
}

function table3(rows, w1, w2, w3, header) {
  var trs = [];
  if (header) {
    trs.push(new TableRow({ tableHeader: true, children: [hCell(header[0], w1), hCell(header[1], w2), hCell(header[2], w3)] }));
  }
  rows.forEach(function(r, i) {
    var f = i % 2 === 0 ? WHITE : ALTROW;
    trs.push(new TableRow({ children: [dCell(r[0], w1, f, true), dCell(r[1], w2, f, false), dCell(r[2], w3, f, false)] }));
  });
  return new Table({ width: { size: TW, type: WidthType.DXA }, columnWidths: [w1, w2, w3], rows: trs });
}

// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENT CONTENT
// ═══════════════════════════════════════════════════════════════════════════
function buildContent() {
  var c = [];

  // ─── COVER ───────────────────────────────────────────────────────────────
  c.push(new Paragraph({ spacing: { before: 2800, after: 0 }, children: [run("")] }));
  c.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 160 },
    children: [new TextRun({ text: "Expensio Business", font: "Arial", size: 64, bold: true, color: NAVY })]
  }));
  c.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 80 },
    children: [new TextRun({ text: "User Manual", font: "Arial", size: 40, italics: true, color: BLUE })]
  }));
  c.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 400 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BLUE, space: 1 } },
    children: [new TextRun({ text: "Enterprise Financial Operations", font: "Arial", size: 24, color: "555555" })]
  }));
  c.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400, after: 60 }, children: [run("Version 1.0  |  May 25, 2026", { color: "666666", size: 20 })] }));
  c.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 60 }, children: [run("Primary audience: Finance Managers", { color: "666666", size: 20 })] }));
  c.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 }, children: [run("Also useful for: Accountants (read/create; no Approvals menu)", { color: "666666", size: 20 })] }));
  c.push(new Paragraph({ children: [new PageBreak()] }));

  // ─── TABLE OF CONTENTS ───────────────────────────────────────────────────
  c.push(new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 180 },
    children: [new TextRun({ text: "Table of Contents", font: "Arial", size: 34, bold: true, color: NAVY })]
  }));
  c.push(new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" }));
  c.push(new Paragraph({ children: [new PageBreak()] }));

  // ═════════════════════════════════════════════════════════════════════════
  // 1. DOCUMENT INFORMATION
  // ═════════════════════════════════════════════════════════════════════════
  c.push(h1("1. Document Information"));
  c.push(table2([
    ["System name",      "Expensio Business"],
    ["Manual type",      "End User Manual"],
    ["Version",          "1.0"],
    ["Last updated",     "May 25, 2026"],
    ["Primary audience", "Finance Manager"],
    ["Also useful for",  "Accountants (read/create; no Approvals menu)"]
  ], 3000, 6360, ["Item", "Detail"]));

  // ═════════════════════════════════════════════════════════════════════════
  // 2. INTRODUCTION
  // ═════════════════════════════════════════════════════════════════════════
  c.push(h1("2. Introduction"));

  c.push(h2("2.1 What Is Expensio Business?"));
  c.push(body("Expensio Business is a web application that brings your company's financial operations into one place. Instead of maintaining four separate Excel workbooks, you sign in once and work from a single dashboard linked to your projects, expenses, payroll, and monitoring reports."));
  c.push(blank());
  c.push(body("The application is built for construction company finance teams who need to:"));
  c.push(bullet("Track every cash disbursement (daily expenses)."));
  c.push(bullet("Maintain project-specific expense registers."));
  c.push(bullet("Record bi-monthly payroll by project."));
  c.push(bullet("Produce project monitoring reports (contracted reports) showing collections, expense breakdowns, and profit per job."));

  c.push(h2("2.2 Who Should Read This Manual?"));
  c.push(body("This manual is written for financial managers — the people who enter data, review totals, approve submissions, and export reports for management or auditors. If your account is set up as Accountant, most of this guide still applies, but you will not see the Approvals menu. You do not need any knowledge of software development to use the system."));

  c.push(h2("2.3 The Four Spreadsheets This System Replaces"));
  c.push(table2([
    ["Daily Expenses Report.xlsx",      "Daily Expenses — company-wide cash-out log."],
    ["Project Expenses Report.xlsx",    "Project Expenses — expenses recorded per project."],
    ["Payroll Summary.xlsx",            "Payroll — bi-monthly payroll by project."],
    ["Project Monitoring Report.xlsx",  "Monitoring — annual contracted report per project."]
  ], 3800, 5560, ["Legacy Excel file", "Purpose in Expensio Business"]));
  c.push(blank());
  c.push(body("Expensio Business does not remove Excel entirely: you can still import legacy files to migrate data and export current data when you need a spreadsheet for filing or sharing."));

  c.push(h2("2.4 Why the Old Way Was Difficult"));
  c.push(body("Before Expensio Business, no single file contained the full financial picture. Finance managers moved data by hand between workbooks every month. Common pain points included:"));
  c.push(blank());
  c.push(table2([
    ["Project name mismatches",     "The daily sheet used a short tag (e.g. NSCR-Malolos), the project sheet used a different spelling (NSCR-MALOLOS), and the monitoring row used a long client name. A single typo broke sums and links."],
    ["Duplicate entries",           "The same payment could appear in both the Daily Expenses file and the Project Expenses file for the same job."],
    ["Seventeen manual columns",    "Each expense category column on the monitoring report had to be updated by filtering, summing, and pasting — for every project, every month."],
    ["Payroll vs monitoring",       "Payroll used short project codes; the monitoring report used client-facing names. Reconciliation between the two was entirely manual."],
    ["No live dashboard",           "Answering any leadership question about project profitability required opening and cross-referencing multiple files."]
  ], 2800, 6560, ["Pain point", "What happened"]));
  c.push(blank());
  c.push(body("Expensio Business addresses each of these by centralising all four data sets, enforcing consistent project IDs, automating the expense rollup, and providing a year-scoped dashboard."));

  // ═════════════════════════════════════════════════════════════════════════
  // 3. GETTING STARTED
  // ═════════════════════════════════════════════════════════════════════════
  c.push(h1("3. Getting Started"));

  c.push(h2("3.1 Signing In"));
  c.push(step("Open the Expensio Business website address provided by your administrator."));
  c.push(step("On the login screen you will see Expens.io Business and the subtitle Enterprise Financial Operations."));
  c.push(step("Sign in using one of the two options:"));
  c.push(bullet("Enter your email and password, then click Sign in.", 1));
  c.push(bullet("Click Continue with Google if your organisation uses Google accounts.", 1));
  c.push(step("After a successful sign in you are taken to the Dashboard."));
  c.push(blank());
  c.push(NOTE("If you see a message about configuring the system, contact your administrator. The application is not yet connected to the company database and this is not something you can fix yourself."));
  c.push(blank());
  c.push(screenshot("Login screen — email field, password field, Sign in button, and Continue with Google button"));

  c.push(h2("3.2 Screen Layout"));
  c.push(body("After signing in, the screen is divided into three areas:"));
  c.push(blank());
  c.push(table2([
    ["Sidebar (left)",  "Main navigation menu, grouped into Overview, Finance, Operations, and System. Click any item to go to that page."],
    ["Top bar",         "Shows your name, your role badge (e.g. finance manager), and the Sign out option."],
    ["Main area",       "Displays the currently selected page — Dashboard, Daily Expenses, and so on."]
  ], 2400, 6960, ["Area", "Description"]));
  c.push(blank());
  c.push(body("On a phone or small tablet, tap the menu icon in the top bar to open the sidebar. At the bottom of the sidebar you can Collapse it to show icons only, saving screen space."));
  c.push(blank());
  c.push(screenshot("Main screen showing sidebar, top bar, and Dashboard main area"));

  c.push(h2("3.3 Sidebar Menu — Finance Manager View"));
  c.push(body("The sidebar items visible to a Finance Manager are listed below. Accountants see the same menu but without Approvals. Guests see reports only."));
  c.push(blank());
  c.push(table3([
    ["Overview",   "Dashboard",        "Year overview and KPI cards."],
    ["Overview",   "Projects",         "Master project list and detail pages."],
    ["Finance",    "Daily Expenses",   "Company-wide cash-out log."],
    ["Finance",    "Project Expenses", "Per-project expense register."],
    ["Finance",    "Payroll",          "Bi-monthly payroll grid."],
    ["Operations", "Monitoring",       "Project monitoring (contracted) reports."],
    ["Operations", "Approvals",        "Items waiting for your review (Finance Manager only)."],
    ["System",     "Audit Logs",       "Read-only history of all changes."]
  ], 1600, 2400, 5360, ["Group", "Menu item", "What it opens"]));
  c.push(blank());
  c.push(NOTE("Finance managers do not see Admin in the menu. Only Owner and Developer accounts have access to Admin."));

  c.push(h2("3.4 Year Selectors"));
  c.push(body("Many pages include a year dropdown, typically offering the current year and one year either side. Charts and monitoring reports always reflect the year you have selected. Confirm the year is correct before entering data or running Aggregate Expenses."));

  c.push(h2("3.5 Signing Out"));
  c.push(body("Click Sign out in the top bar when you have finished. Do not simply close the browser tab without signing out, as your session may remain active on that device."));

  // ═════════════════════════════════════════════════════════════════════════
  // 4. ROLES AND PERMISSIONS
  // ═════════════════════════════════════════════════════════════════════════
  c.push(h1("4. Your Role and Permissions"));

  c.push(h2("4.1 Permission Summary"));
  c.push(body("Your access level is determined by the role assigned to your account by an administrator. The three roles finance staff hold are Finance Manager, Accountant, and Guest."));
  c.push(blank());
  c.push(table3([
    ["View all finance pages",          "Yes", "Yes", "Yes"],
    ["Add, edit, and delete records",   "Yes", "Yes", "No"],
    ["Approve submissions",             "Yes", "No",  "No"],
    ["Export to Excel",                 "Yes", "Yes", "No"],
    ["View Audit Logs",                 "Yes", "Yes", "No"],
    ["Change system settings (Admin)",  "No",  "No",  "No"]
  ], 4200, 1720, 1720, ["Action", "Finance Manager", "Accountant", "Guest"]));

  c.push(h2("4.2 What Finance Manager Means in Practice"));
  c.push(bullet("You can enter and correct daily expenses, project expenses, payroll, and monitoring data."));
  c.push(bullet("You can approve or reject items in the Approvals queue when approval workflows are enabled."));
  c.push(bullet("You can export data to Excel for auditors or management."));
  c.push(bullet("You can review Audit Logs to see who changed any record and when."));
  c.push(bullet("You cannot add users or change approval workflow settings. Those actions require an Owner account under Admin."));
  c.push(blank());
  c.push(body("Your role is shown under your name in the top bar, for example: finance manager."));

  // ═════════════════════════════════════════════════════════════════════════
  // 5. DASHBOARD
  // ═════════════════════════════════════════════════════════════════════════
  c.push(h1("5. Dashboard"));

  c.push(body("Menu: Overview > Dashboard"));
  c.push(blank());
  c.push(body("The Dashboard is the first page you see after signing in. It provides a single-screen view of company finances for the selected year — useful for a quick health check before diving into individual modules."));
  c.push(blank());
  c.push(screenshot("Dashboard — year selector, six KPI cards, and charts"));

  c.push(h2("5.1 Reading the Dashboard"));
  c.push(step("Choose the year in the top-right dropdown."));
  c.push(step("Review the six summary cards:"));
  c.push(bullet("Total Expenses YTD", 1));
  c.push(bullet("Payroll YTD", 1));
  c.push(bullet("Active Projects", 1));
  c.push(bullet("Amount Collected", 1));
  c.push(bullet("Outstanding Balance", 1));
  c.push(bullet("Yearly Profit", 1));
  c.push(step("Review the charts: Monthly Expenses, Category Breakdown, Payroll Trend, Project Profitability, and Payment Aging (when data exists for those charts)."));
  c.push(step("If a yellow Overdue / partial invoices alert banner appears, read the listed invoices and follow up with the billing team."));
  c.push(step("Scroll to Recent Activity to see the latest approval-related events."));
  c.push(blank());
  c.push(NOTE("Dashboard totals reflect saved data as it currently stands. If you have recently entered new daily expenses and want the expense and profit figures to be current, run Aggregate Expenses on the Monitoring page before reviewing the Dashboard."));

  // ═════════════════════════════════════════════════════════════════════════
  // 6. PROJECTS
  // ═════════════════════════════════════════════════════════════════════════
  c.push(h1("6. Projects"));

  c.push(body("Menu: Overview > Projects"));
  c.push(blank());
  c.push(body("The Projects page is the master registry for all jobs. Every other module — daily expenses, project expenses, payroll, and monitoring reports — must link to a project record here. Always create a project before adding financial data for that job."));

  c.push(h2("6.1 Browsing the Project List"));
  c.push(bullet("Search by project name or Project ID."));
  c.push(bullet("Filter by status: All, Active, Quotation, Completed, On Hold, Archived."));
  c.push(bullet("Switch between grid view and table view."));

  c.push(h2("6.2 Creating a New Project"));
  c.push(step("Click New Project."));
  c.push(step("Complete the form:"));
  c.push(blank());
  c.push(table2([
    ["Project ID",   "Short unique code for this job (e.g. NSCR-MALOLOS, AMS). Used in payroll entries and Excel imports. Cannot be changed after saving."],
    ["Project name", "Full descriptive name shown on reports and project cards."],
    ["Status",       "The project's current stage. Lifecycle: Quotation > Awarded > Active > Suspended > Completed > Archived."]
  ], 2400, 6960, ["Field", "Description"]));
  c.push(blank());
  c.push(step("Click Save. The project appears in the list and is immediately available for linking to expense, payroll, and monitoring records."));
  c.push(blank());
  c.push(WARNING("The Project ID cannot be changed after the project is saved. Choose a code consistent with the labels you use in your Excel payroll and expense files so that future imports match without error."));

  c.push(h2("6.3 Editing a Project"));
  c.push(step("Click the project card or row to open its detail page."));
  c.push(step("Click Edit to update the project name or status."));
  c.push(step("Click Back to return to the project list."));
  c.push(blank());
  c.push(body("The project detail page contains tabs that show data filtered to that project only: Overview, Daily Expenses, Project Expenses, Payroll, and Monitoring."));

  // ═════════════════════════════════════════════════════════════════════════
  // 7. DAILY EXPENSES
  // ═════════════════════════════════════════════════════════════════════════
  c.push(h1("7. Daily Expenses"));

  c.push(body("Menu: Finance > Daily Expenses"));
  c.push(blank());
  c.push(body("This page replaces Daily Expenses Report.xlsx. Use it to record every cash payment leaving the company — materials, diesel, meals, subcontractor invoices, and so on. Each entry is linked to a formal Project (rather than a free-text tag as in the old Excel file) and assigned a category that drives the monitoring report rollup."));
  c.push(blank());
  c.push(screenshot("Daily Expenses page — filter bar above the expense table"));

  c.push(h2("7.1 Filtering the List"));
  c.push(table2([
    ["Year",     "Show expenses for a specific calendar year."],
    ["Month",    "Narrow to a specific month, or choose All months."],
    ["Project",  "Show expenses for one project only. Must be selected before importing."],
    ["Category", "Filter by a specific expense category."]
  ], 1800, 7560, ["Filter", "Effect"]));

  c.push(h2("7.2 Adding a Daily Expense"));
  c.push(step("Click Add Expense."));
  c.push(step("Complete the form using the field descriptions below."));
  c.push(blank());
  c.push(table2([
    ["Project",             "The project this payment belongs to. Select from the Projects list."],
    ["Date",                "The date the payment was made."],
    ["Particulars",         "Short description of what was paid for (e.g. Diesel, Meals, Materials)."],
    ["Cash out",            "The amount paid."],
    ["VAT rate",            "Choose one: 12% Standard, 3% Percentage Tax, 0% Zero-Rated, or 5% Special. The form shows a live VAT amount calculated from the cash out."],
    ["Category",            "The expense category. Determines which column on the monitoring report this line is counted toward when Aggregate Expenses is run. See Section 11 for the full list."],
    ["Receipt / Invoice URL","Optional. Link to a stored receipt or invoice file."]
  ], 2600, 6760, ["Field", "Description"]));
  c.push(blank());
  c.push(step("Click Save. The expense appears in the table with its approval status shown."));
  c.push(blank());
  c.push(TIP("Record expenses as soon as receipts arrive. Delayed entry makes it harder to verify amounts before month-end close and before running Aggregate Expenses."));

  c.push(h2("7.3 Table Columns"));
  c.push(table2([
    ["Date",        "Date the payment was made."],
    ["Project",     "The linked project."],
    ["Particulars", "Description of the expense."],
    ["Category",    "Assigned expense category."],
    ["Cash Out",    "Amount paid."],
    ["VAT",         "Calculated VAT amount."],
    ["Status",      "Approval status — shown when expense approvals are enabled by your administrator."]
  ], 2000, 7360, ["Column", "Description"]));

  c.push(h2("7.4 Viewing and Deleting an Expense"));
  c.push(body("Click any row to open the detail panel on the right side of the screen. From the detail panel you can Delete expense if you have permission. Records are soft-deleted and are not immediately removed from the database permanently."));

  // ═════════════════════════════════════════════════════════════════════════
  // 8. PROJECT EXPENSES
  // ═════════════════════════════════════════════════════════════════════════
  c.push(h1("8. Project Expenses"));

  c.push(body("Menu: Finance > Project Expenses"));
  c.push(blank());
  c.push(body("This page replaces Project Expenses Report.xlsx, which held one sheet per project. Use it for job-specific expense lines you want tracked in the project register. Project expense lines are simpler than daily expenses: there is no VAT rate selector and these lines do not roll up by category into the monitoring report in the same way as daily expenses."));
  c.push(blank());
  c.push(WARNING("Avoid recording the same payment in both Daily Expenses and Project Expenses. Duplicate entries were the most common error in the legacy Excel process and will produce inflated figures after Aggregate Expenses is run."));

  c.push(h2("8.1 Filtering"));
  c.push(body("Use the Year and Project filters to narrow the list to the job and period you need."));

  c.push(h2("8.2 Adding a Project Expense"));
  c.push(body("Use the inline form at the top of the page:"));
  c.push(blank());
  c.push(table2([
    ["Project",     "The project this line belongs to."],
    ["Date",        "Date of the expense."],
    ["Particulars", "Description of the item or payment."],
    ["Amount",      "The expense amount."]
  ], 2000, 7360, ["Field", "Description"]));
  c.push(blank());
  c.push(body("Save the line and it appears in the project's expense register."));

  c.push(h2("8.3 Excel Import and Export"));
  c.push(body("When importing, the system maps each Excel sheet name to a Project ID. If the sheet is named NSCR-MALOLOS, the system looks for a project with exactly that Project ID. Spelling must match exactly — NSCR-Malolos and NSCR-MALOLOS are treated as two different projects."));
  c.push(blank());
  c.push(body("The positional column layout expected on import is: date in column B, amount in column F."));
  c.push(blank());
  c.push(body("Click Export to download the current register as an Excel file matching the legacy Project Expenses layout."));

  // ═════════════════════════════════════════════════════════════════════════
  // 9. PAYROLL
  // ═════════════════════════════════════════════════════════════════════════
  c.push(h1("9. Payroll"));

  c.push(body("Menu: Finance > Payroll"));
  c.push(blank());
  c.push(body("This page replaces Payroll Summary.xlsx. Each worker has one row per year per project, with 24 bi-monthly pay-period columns (January 15, January 31, through December 15, December 31). The Total column is calculated automatically from those 24 values."));
  c.push(blank());
  c.push(screenshot("Payroll page — year dropdown, project filter, worker type chips, and grid view"));

  c.push(h2("9.1 Page Controls"));
  c.push(table2([
    ["Year dropdown",      "Select the calendar year. Each year is tracked separately."],
    ["Project filter",     "Show payroll for one project only."],
    ["Worker type chips",  "Show All, Employee, or Organisation rows."],
    ["View toggle",        "Switch between grid view (full 24-column table) and summary view (total per project)."]
  ], 2800, 6560, ["Control", "Effect"]));

  c.push(h2("9.2 Entering Payroll Amounts"));
  c.push(step("Select the correct year and project."));
  c.push(step("In grid view, locate the worker row you need."));
  c.push(step("Click the pay-period cell for the date you are entering (e.g. Jan 15)."));
  c.push(step("Type the payroll amount."));
  c.push(step("Press Enter or click away to save. The Total column updates immediately."));
  c.push(blank());
  c.push(NOTE("If payroll lock is enabled by your administrator, locked rows show disabled cells and cannot be edited. Contact your administrator if you need to unlock a row."));

  c.push(h2("9.3 Excel Import and Export"));
  c.push(body("To import from Payroll Summary.xlsx the file must have a sheet named PAYROLL SUMMARY with a three-row header where row 3 contains the 24 pay dates. Each data row is matched to a project by Project ID."));
  c.push(blank());
  c.push(body("Click Export to download a workbook that recreates the Payroll Summary layout."));

  c.push(h2("9.4 Payroll and the Monitoring Report"));
  c.push(body("Payroll totals are not automatically rolled into the monitoring report's expense columns. After running Aggregate Expenses on the Monitoring page, cross-reference the Labor Cost column on each project's monitoring report against the Payroll summary view for the same project and year. Adjust the Labor Cost field on the monitoring report manually where needed."));

  // ═════════════════════════════════════════════════════════════════════════
  // 10. MONITORING
  // ═════════════════════════════════════════════════════════════════════════
  c.push(h1("10. Monitoring (Project Monitoring)"));

  c.push(body("Menu: Operations > Monitoring"));
  c.push(blank());
  c.push(body("This page replaces Project Monitoring Report.xlsx (the CONTRACTED REPORT {year} sheet). Each monitoring report is an annual contracted record for one project. It stores client details, project dates, accomplishment percentage, billing amounts, 17 expense category columns, and computed total expenses, profit, and balance to be collected."));
  c.push(blank());
  c.push(screenshot("Monitoring page — year dropdown, Aggregate Expenses button, and project report cards"));

  c.push(h2("10.1 Page Controls"));
  c.push(table2([
    ["Year dropdown",      "Select the year. Each year's reports are stored separately."],
    ["Aggregate Expenses", "Rolls up all daily expenses for the year into the expense category columns on every project's monitoring report. See Section 10.3."],
    ["Export",             "Downloads the reports as an Excel file in the contracted-report layout (sheet named CONTRACTED REPORT {year}, row-2 column headers)."],
    ["Import",             "Loads monitoring reports from an Excel file. Projects are matched by project name or Project ID."]
  ], 2800, 6560, ["Control", "Effect"]));

  c.push(h2("10.2 Reading Report Cards"));
  c.push(body("Each project's report appears as a card on the page. Each card shows:"));
  c.push(bullet("Report ID and approval status badge."));
  c.push(bullet("Client name."));
  c.push(bullet("Accomplishment progress bar and percentage."));
  c.push(bullet("Contracted amount, amount collected, balance to be collected, and total expenses."));
  c.push(bullet("Profit — displayed in green when positive, red when negative."));
  c.push(blank());
  c.push(body("Click a card to open the full detail view, which includes the breakdown across all 17 expense category columns."));

  c.push(h2("10.3 Aggregate Expenses"));
  c.push(body("Aggregate Expenses is the action that replaces the monthly manual copy-and-paste process. When you click it (for the selected year), the system:"));
  c.push(blank());
  c.push(step("Finds all daily expenses for each project in that year."));
  c.push(step("Groups amounts by expense category."));
  c.push(step("Writes the category totals into the matching columns on each project's monitoring report."));
  c.push(step("Updates Total Expenses, Profit, and Balance to Be Collected on each report."));
  c.push(blank());
  c.push(WARNING("Payroll is not included in this rollup. The Labor Cost column is not updated by Aggregate Expenses. Cross-reference against the Payroll page and adjust the Labor Cost field manually."));
  c.push(blank());
  c.push(TIP("Run Aggregate Expenses after reviewing Daily Expenses for completeness. The rollup includes all saved daily expense lines for the year regardless of their approval status — if your policy is to aggregate only after expenses are approved, clear the Approvals queue first."));

  c.push(h2("10.4 Monitoring Report Fields"));
  c.push(table2([
    ["Project Name",             "Name of the project."],
    ["Project / Client",         "Client organisation."],
    ["Date Start / Date Finish", "Project timeline."],
    ["Accomplishment",           "Progress percentage (0 to 100)."],
    ["Remarks",                  "Free-text notes."],
    ["Contracted Amount",        "Total contract value."],
    ["Tax Amount",               "Tax on the contract."],
    ["Amount Collected",         "Payments received from the client to date."],
    ["Balance to Be Collected",  "Contracted Amount minus Amount Collected — computed automatically."],
    ["Expense category columns", "17 columns filled by Aggregate Expenses. See Section 11 for the full list."],
    ["Total Expenses",           "Sum of all 17 category columns — computed automatically."],
    ["Profit",                   "Amount Collected minus Total Expenses — computed automatically."]
  ], 2800, 6560, ["Field", "Description"]));

  // ═════════════════════════════════════════════════════════════════════════
  // 11. EXPENSE CATEGORIES
  // ═════════════════════════════════════════════════════════════════════════
  c.push(h1("11. Expense Categories and Monitoring Columns"));

  c.push(body("When you add a daily expense you choose a category. When Aggregate Expenses is run that category's total is written to the corresponding column on the monitoring report. Use this table when coding expenses to make sure the right monitoring column is updated."));
  c.push(blank());
  c.push(table2([
    ["Material cost",           "Material Cost / RENTAL of Scaffolds ETC. / Tools & Equips"],
    ["Coil breakdown",          "Coil Breakdown"],
    ["Labor cost",              "Labor Cost"],
    ["Company outing",          "Company Outing / 13th Month / Christmas Expenses"],
    ["Mandatories",             "Mandatories"],
    ["Equipment / power tools", "EQUIPMENT / HEAVY EQUIPMENTS / POWER TOOLS"],
    ["1601 C compensation",     "1601 C (Compensation)"],
    ["Diesel / tollgate",       "Diesel / Maintenance / Tollgate / MACHINE / NEW VEHICLES / Vehicle Registration"],
    ["Equipment maintenance",   "Equipment / vehicle / tools maintenance (calibration)"],
    ["Subcon",                  "SUBCON PROJ. PAYMENT / supplier"],
    ["House rentals",           "HOUSE RENTALS / Utilities / Maintenance"],
    ["Surety / commission",     "Surety Bond / Commission"],
    ["5% commission",           "5% Com"],
    ["12% VAT",                 "12% VAT"],
    ["Uniforms / PPE",          "UNIFORMS / PPE's / MEDICAL Expenses / medicines"],
    ["ISO certification",       "ISO Certification"],
    ["Others",                  "OTHERS (Meal, PF, drawings, Seminars, Permits etc. & Const Fee)"]
  ], 3200, 6160, ["Select this category on the daily expense", "Monitoring report column it maps to"]));
  c.push(blank());
  c.push(NOTE("Imported daily expenses from Excel are assigned category Others unless you update them. After a large import, review and correct categories before running Aggregate Expenses."));

  // ═════════════════════════════════════════════════════════════════════════
  // 12. EXCEL IMPORT AND EXPORT
  // ═════════════════════════════════════════════════════════════════════════
  c.push(h1("12. Excel Import and Export"));

  c.push(h2("12.1 When to Import"));
  c.push(bullet("First-time setup — load your existing legacy workbooks."));
  c.push(bullet("Bulk catch-up — bring in many rows from an external sheet at once."));
  c.push(blank());
  c.push(NOTE("Always import after projects exist in the system with matching IDs or names. The import process cannot create new project records."));

  c.push(h2("12.2 When to Export"));
  c.push(bullet("Monthly backup."));
  c.push(bullet("Sharing a report with someone who still uses Excel."));
  c.push(bullet("Providing data for an auditor."));
  c.push(blank());
  c.push(body("Click Export on the relevant page. The browser downloads an .xlsx file. If the download does not start, check your browser pop-up blocker settings."));

  c.push(h2("12.3 File-by-File Import Guide"));
  c.push(blank());
  c.push(table3([
    ["Daily Expenses Report.xlsx",
     "Daily Expenses",
     "Select a project in the filter bar before clicking Import, or you will see: Select a project for import. The file must contain DATE and CASH OUT columns. Imported rows are assigned category Others by default — update categories before running Aggregate Expenses."],
    ["Project Expenses Report.xlsx",
     "Project Expenses",
     "Each sheet name must match a Project ID exactly (case-sensitive). The layout is positional: date in column B, amount in column F."],
    ["Payroll Summary.xlsx",
     "Payroll",
     "The sheet must be named PAYROLL SUMMARY with a three-row header and the 24 pay dates in row 3. Each data row is matched to a project by Project ID."],
    ["Project Monitoring Report.xlsx",
     "Monitoring",
     "The sheet name must follow the pattern CONTRACTED REPORT {year} (e.g. CONTRACTED REPORT 2024). Row 2 must contain the standard column headers. Projects are matched by project name or Project ID."]
  ], 2600, 1800, 4960, ["Legacy file", "App page", "Import notes"]));

  c.push(h2("12.4 Tips for Successful Import"));
  c.push(step("Create projects first with the same IDs used in your Excel files (e.g. NSCR-MALOLOS, AMS)."));
  c.push(step("Use consistent spelling. NSCR-Malolos and NSCR-MALOLOS are treated as different projects."));
  c.push(step("For daily expenses, select the target project in the filter bar before importing."));
  c.push(step("After importing daily expenses, run Aggregate Expenses on the Monitoring page for that year."));
  c.push(step("Check the import success message (e.g. Imported 12 rows) and spot-check a few lines in the table."));

  // ═════════════════════════════════════════════════════════════════════════
  // 13. APPROVALS
  // ═════════════════════════════════════════════════════════════════════════
  c.push(h1("13. Approvals"));

  c.push(body("Menu: Operations > Approvals   (Finance Managers only — Accountants do not see this menu item)"));
  c.push(blank());
  c.push(body("The Approvals page is only active when an administrator has enabled one or more workflow settings under Admin > Settings:"));
  c.push(blank());
  c.push(table2([
    ["Expense approvals",  "Daily and project expenses may require approval before they are treated as finalised."],
    ["Payroll lock",       "Prevents editing locked payroll rows. (Protects finalised pay data — this is not an approval workflow itself.)"],
    ["Report approvals",   "Monitoring reports can enter an approval queue before being considered final."]
  ], 2400, 6960, ["Setting", "Effect when enabled"]));
  c.push(blank());
  c.push(NOTE("Finance managers can approve items but cannot turn these workflow settings on or off themselves. That requires an Owner account under Admin."));

  c.push(h2("13.1 Working Through the Approvals Queue"));
  c.push(step("Open Operations > Approvals."));
  c.push(step("Select the Pending tab to see items that need action."));
  c.push(step("Read each card: it shows the item type (daily expense, project expense, payroll, or project monitoring report), the amount or relevant figure, the linked project, and the date of submission."));
  c.push(step("Click Approve or Reject. You can also select multiple items and bulk approve when that option is available."));
  c.push(blank());
  c.push(body("The four tabs — All, Pending, Approved, Rejected — each show a count. Rejected items remain on the Rejected tab for reference. If no items are pending you will see: All caught up -- No items pending your review."));
  c.push(blank());
  c.push(TIP("If your team's policy is to run Aggregate Expenses only after daily expenses are approved, clear the Pending tab before clicking Aggregate Expenses on the Monitoring page. The rollup includes all saved daily expense lines for the year regardless of their approval status."));

  // ═════════════════════════════════════════════════════════════════════════
  // 14. AUDIT LOGS
  // ═════════════════════════════════════════════════════════════════════════
  c.push(h1("14. Audit Logs"));

  c.push(body("Menu: System > Audit Logs"));
  c.push(blank());
  c.push(body("The Audit Logs page is a read-only, immutable record of every create, update, and delete action taken in the system. It covers: projects, daily expenses, project expenses, payroll, and project monitoring reports."));

  c.push(h2("14.1 What Each Entry Shows"));
  c.push(table2([
    ["Timestamp", "Date and time the action occurred."],
    ["Actor",     "Email address of the user who made the change."],
    ["Module",    "Which part of the system was affected (e.g. daily_expenses, payroll)."],
    ["Action",    "The type of change: insert, update, or delete."],
    ["Record ID", "Identifier of the specific record that was changed."]
  ], 2000, 7360, ["Column", "Description"]));
  c.push(blank());
  c.push(body("Click a row to expand and see additional detail. Audit entries cannot be deleted or edited."));

  c.push(h2("14.2 Filtering"));
  c.push(body("Use the module filter to show entries for one area only: projects, daily_expenses, project_expenses, payroll, project_monitoring_reports, or All modules."));

  c.push(h2("14.3 When Finance Managers Use Audit Logs"));
  c.push(bullet("To verify who changed a monitoring total before a board meeting."));
  c.push(bullet("To respond to an external audit request about a specific change."));
  c.push(bullet("To investigate an accidental deletion and identify who performed it."));

  // ═════════════════════════════════════════════════════════════════════════
  // 15. RECOMMENDED MONTHLY WORKFLOW
  // ═════════════════════════════════════════════════════════════════════════
  c.push(h1("15. Recommended Workflow"));

  c.push(body("The checklist below describes a steady monthly rhythm for finance managers. Adjust timing to match your pay runs and management reporting calendar."));

  c.push(h2("At the Start of the Year — or When a New Job Is Won"));
  c.push(step("Open Projects > New Project."));
  c.push(step("Enter the Project ID (use a code consistent with your payroll files where possible), the Project name, and the initial Status."));
  c.push(step("Create or import the Monitoring report for that project for the calendar year."));

  c.push(h2("Ongoing — Weekly or Daily"));
  c.push(step("Record Daily Expenses as payments occur. Assign the correct project and category — categories drive the monitoring rollup."));
  c.push(step("Record Project Expenses only when that register is the appropriate place for the line. Do not enter the same payment in both modules."));
  c.push(step("After each pay run, update Payroll for the relevant project and pay periods."));

  c.push(h2("Monthly — or Before Management Meetings"));
  c.push(step("Open Monitoring, select the year, and click Aggregate Expenses to refresh all expense category columns from daily expenses."));
  c.push(step("Review Labor Cost and other columns against the Payroll page. Adjust monitoring fields manually for any amounts not captured in daily expenses (particularly payroll)."));
  c.push(step("Open the Dashboard and confirm KPIs and charts for the same year."));
  c.push(step("If expense approvals are enabled, clear the Approvals queue for any pending daily expenses, project expenses, or payroll submissions."));
  c.push(step("Export monitoring or expense data if you need an Excel copy for filing or email."));

  c.push(h2("End of Year"));
  c.push(step("Export each module for archival: Daily Expenses, Payroll, and Monitoring."));
  c.push(step("Set completed projects to Completed or Archived on the Projects page."));

  // ═════════════════════════════════════════════════════════════════════════
  // 16. TROUBLESHOOTING
  // ═════════════════════════════════════════════════════════════════════════
  c.push(h1("16. Troubleshooting"));

  c.push(table2([
    ["Cannot sign in",
     "Confirm your email and password with your administrator. For Google sign-in, use the company-approved account."],
    ["Login shows a 'Configure environment' or database error",
     "The administrator must connect the application to the company database. This is not something you can fix as a user."],
    ["Import says 'Select a project for import'",
     "On Daily Expenses, choose a project in the filter bar and then try the import again."],
    ["Import brought in 0 rows",
     "Check that sheet names and project IDs in the Excel file match exactly what is in Projects. For monitoring reports, project names must match an existing project name or Project ID."],
    ["Aggregate Expenses did not change Labor Cost",
     "This is expected behaviour. Payroll is not included in the Aggregate Expenses rollup. Update Labor Cost manually as part of your monthly payroll reconciliation."],
    ["Duplicate amounts appear after running Aggregate Expenses",
     "Check whether the same payment has been recorded in both Daily Expenses and Project Expenses for that project."],
    ["Dashboard shows zeros",
     "Set the year dropdown to the year your data was entered for."],
    ["Cannot edit a payroll cell",
     "Payroll lock may be enabled by your administrator, or your account may be read-only. Contact your administrator."],
    ["No Approvals menu visible",
     "Accountants and Guest accounts do not see the Approvals menu. If you believe you should have Finance Manager access, contact your administrator."],
    ["Export did not download",
     "Check your browser pop-up blocker. Try again or switch to a different browser."],
    ["Need to change your role or add a new user",
     "Contact your system Owner. Role changes are made under Admin > Users, which requires an Owner or Developer account."]
  ], 3400, 5960, ["Problem", "What to try"]));

  // ═════════════════════════════════════════════════════════════════════════
  // 17. GLOSSARY
  // ═════════════════════════════════════════════════════════════════════════
  c.push(h1("17. Glossary"));

  c.push(table2([
    ["Project ID",                           "Short unique code for a job, used in payroll entries and Excel imports. Cannot be changed after the project is saved."],
    ["Project name",                         "Full descriptive name shown on reports and project cards."],
    ["Daily expense",                        "A single cash-out line with date, particulars, cash out amount, VAT rate, project link, and category."],
    ["Project expense",                      "An expense line in the project-specific register. Simpler than a daily expense: no VAT rate selector and no category-based rollup to the monitoring report."],
    ["Monitoring report / PMR / contracted report", "Annual contracted record for one project covering billing amounts, collections, 17 expense category columns, and computed profit."],
    ["Contracted amount",                    "Total contract value for the job."],
    ["Accomplishment",                       "Progress percentage (0 to 100) recorded on the monitoring report."],
    ["Amount collected",                     "Payments received from the client to date."],
    ["Balance to be collected",              "Contracted amount minus amount collected — computed automatically on the report."],
    ["Aggregate Expenses",                   "The action on the Monitoring page that sums daily expenses by category and writes the totals into the matching monitoring report columns for the selected year."],
    ["Pay period",                           "One bi-monthly payroll column, for example Jan 15 or Jan 31."],
    ["VAT",                                  "Value-added tax on a daily expense. The rate is selected per entry (12% Standard, 3% Percentage Tax, 0% Zero-Rated, or 5% Special). The amount is calculated automatically from the cash out."],
    ["Approval status",                      "Pending, Approved, or Rejected — shown on records when an approval workflow is enabled."],
    ["Locked (payroll)",                     "A payroll row that cannot be edited because payroll lock has been enabled by an administrator."],
    ["Soft delete",                          "Records that are deleted in the application are marked as deleted but not immediately purged from the database."],
    ["YTD",                                  "Year to date — from 1 January through 31 December of the selected year."]
  ], 3000, 6360, ["Term", "Meaning"]));

  // ═════════════════════════════════════════════════════════════════════════
  // APPENDIX — DOCUMENT HISTORY
  // ═════════════════════════════════════════════════════════════════════════
  c.push(h1("Appendix — Document History"));
  c.push(table3([
    ["1.0", "May 25, 2026", "Initial user manual for financial managers."]
  ], 1200, 2400, 5760, ["Version", "Date", "Changes"]));
  c.push(blank());
  c.push(blank());
  c.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "End of document", font: "Arial", size: 20, italics: true, color: "888888" })]
  }));

  return c;
}

// ═══════════════════════════════════════════════════════════════════════════
// BUILD DOCUMENT
// ═══════════════════════════════════════════════════════════════════════════
var doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run:       { size: 34, bold: true, font: "Arial", color: NAVY },
        paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 0 }
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run:       { size: 28, bold: true, font: "Arial", color: BLUE },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 }
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run:       { size: 24, bold: true, font: "Arial", color: NAVY },
        paragraph: { spacing: { before: 180, after: 80 }, outlineLevel: 2 }
      }
    ]
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
          { level: 1, format: LevelFormat.BULLET, text: "\u25E6", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1080, hanging: 360 } } } }
        ]
      },
      {
        reference: "numbers",
        levels: [
          { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } }
        ]
      }
    ]
  },
  sections: [{
    properties: {
      page: {
        size:   { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: BLUE, space: 1 } },
          spacing: { before: 0, after: 80 },
          children: [new TextRun({ text: "Expensio Business  |  User Manual  |  v1.0", font: "Arial", size: 18, color: "555555" })]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: BLUE, space: 1 } },
          spacing: { before: 80, after: 0 },
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({ text: "Page ", font: "Arial", size: 18, color: "555555" }),
            new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 18, color: "555555" }),
            new TextRun({ text: " of ", font: "Arial", size: 18, color: "555555" }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], font: "Arial", size: 18, color: "555555" })
          ]
        })]
      })
    },
    children: buildContent()
  }]
});

const path = require('path');
const outDocx = path.join(__dirname, 'Expensio_Business_User_Manual.docx');

Packer.toBuffer(doc).then(function(buf) {
  fs.writeFileSync(outDocx, buf);
  console.log('Wrote DOCX:', outDocx);
}).catch(function(e) {
  console.error(e);
  process.exit(1);
});
