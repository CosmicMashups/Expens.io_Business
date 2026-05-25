const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageNumber, PageBreak, LevelFormat, TableOfContents,
  UnderlineType
} = require('docx');
const fs = require('fs');

// ─── CONSTANTS ──────────────────────────────────────────────────────────────
const TW = 9360; // content width in DXA (US Letter, 1" margins)
const ACCENT = "1F4E79";   // dark navy header fill
const ACCENT2 = "2E75B6";  // medium blue subheader
const LIGHT_FILL = "D6E4F0"; // light blue cell fill
const ALT_FILL = "EEF4FB";   // alternating row fill
const BORDER = { style: BorderStyle.SINGLE, size: 1, color: "BBCFE0" };
const BORDERS = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };
const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const NO_BORDERS = { top: NO_BORDER, bottom: NO_BORDER, left: NO_BORDER, right: NO_BORDER };
const CELL_MARGIN = { top: 100, bottom: 100, left: 120, right: 120 };

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function h1(text, bookmark) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore: true,
    children: [new TextRun({ text, bold: true, size: 32, font: "Arial", color: "1F4E79" })]
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true, size: 28, font: "Arial", color: "2E75B6" })]
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    children: [new TextRun({ text, bold: true, size: 24, font: "Arial", color: "2E4A7A" })]
  });
}

function body(text, options = {}) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    children: [new TextRun({ text, font: "Arial", size: 22, ...options })]
  });
}

function bold(text) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    children: [new TextRun({ text, bold: true, font: "Arial", size: 22 })]
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, font: "Arial", size: 22 })]
  });
}

function numbered(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "numbers", level },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, font: "Arial", size: 22 })]
  });
}

function space(n = 1) {
  return new Paragraph({ children: [new TextRun("")], spacing: { before: n * 60, after: n * 60 } });
}

function note(text, kind = "NOTE") {
  const colors = { NOTE: "0070C0", TIP: "375623", WARNING: "C00000" };
  const fills = { NOTE: "DEEAF1", TIP: "E2EFDA", WARNING: "FFCCCC" };
  const col = colors[kind] || colors.NOTE;
  const fill = fills[kind] || fills.NOTE;
  return new Table({
    width: { size: TW, type: WidthType.DXA },
    columnWidths: [TW],
    rows: [new TableRow({
      children: [new TableCell({
        borders: BORDERS,
        shading: { fill, type: ShadingType.CLEAR },
        margins: CELL_MARGIN,
        width: { size: TW, type: WidthType.DXA },
        children: [new Paragraph({
          children: [
            new TextRun({ text: `${kind}: `, bold: true, font: "Arial", size: 22, color: col }),
            new TextRun({ text, font: "Arial", size: 22 })
          ]
        })]
      })]
    })]
  });
}

function screenshotPlaceholder(label) {
  return new Table({
    width: { size: TW, type: WidthType.DXA },
    columnWidths: [TW],
    rows: [new TableRow({
      children: [new TableCell({
        borders: BORDERS,
        shading: { fill: "F2F2F2", type: ShadingType.CLEAR },
        margins: { top: 200, bottom: 200, left: 200, right: 200 },
        width: { size: TW, type: WidthType.DXA },
        children: [new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: `[ Screenshot: ${label} ]`, font: "Arial", size: 20, color: "888888", italics: true })]
        })]
      })]
    })]
  });
}

function sectionDivider() {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "2E75B6", space: 1 } },
    children: [new TextRun("")],
    spacing: { before: 120, after: 120 }
  });
}

// ─── TABLE HELPERS ──────────────────────────────────────────────────────────

function headerCell(text, width, span) {
  const opts = {};
  if (span) opts.columnSpan = span;
  return new TableCell({
    ...opts,
    borders: BORDERS,
    shading: { fill: ACCENT, type: ShadingType.CLEAR },
    margins: CELL_MARGIN,
    width: { size: width, type: WidthType.DXA },
    children: [new Paragraph({
      children: [new TextRun({ text, bold: true, font: "Arial", size: 20, color: "FFFFFF" })]
    })]
  });
}

function subHeaderCell(text, width) {
  return new TableCell({
    borders: BORDERS,
    shading: { fill: ACCENT2, type: ShadingType.CLEAR },
    margins: CELL_MARGIN,
    width: { size: width, type: WidthType.DXA },
    children: [new Paragraph({
      children: [new TextRun({ text, bold: true, font: "Arial", size: 20, color: "FFFFFF" })]
    })]
  });
}

function dataCell(text, width, fill, bold = false) {
  return new TableCell({
    borders: BORDERS,
    shading: { fill: fill || "FFFFFF", type: ShadingType.CLEAR },
    margins: CELL_MARGIN,
    width: { size: width, type: WidthType.DXA },
    children: [new Paragraph({
      children: [new TextRun({ text, font: "Arial", size: 20, bold })]
    })]
  });
}

function twoColTable(rows, col1W, col2W, headerRow) {
  const tableRows = [];
  if (headerRow) {
    tableRows.push(new TableRow({
      tableHeader: true,
      children: [headerCell(headerRow[0], col1W), headerCell(headerRow[1], col2W)]
    }));
  }
  rows.forEach((row, i) => {
    const fill = i % 2 === 0 ? "FFFFFF" : ALT_FILL;
    tableRows.push(new TableRow({
      children: [dataCell(row[0], col1W, fill, true), dataCell(row[1], col2W, fill)]
    }));
  });
  return new Table({
    width: { size: TW, type: WidthType.DXA },
    columnWidths: [col1W, col2W],
    rows: tableRows
  });
}

function threeColTable(rows, widths, headerRow) {
  const [w1, w2, w3] = widths;
  const tableRows = [];
  if (headerRow) {
    tableRows.push(new TableRow({
      tableHeader: true,
      children: [headerCell(headerRow[0], w1), headerCell(headerRow[1], w2), headerCell(headerRow[2], w3)]
    }));
  }
  rows.forEach((row, i) => {
    const fill = i % 2 === 0 ? "FFFFFF" : ALT_FILL;
    tableRows.push(new TableRow({
      children: [dataCell(row[0], w1, fill, true), dataCell(row[1], w2, fill), dataCell(row[2], w3, fill)]
    }));
  });
  return new Table({
    width: { size: TW, type: WidthType.DXA },
    columnWidths: widths,
    rows: tableRows
  });
}

// ─── DOCUMENT CONTENT ────────────────────────────────────────────────────────

function buildContent() {
  const items = [];

  // ──────────────────────────────────────────────────
  // COVER / TITLE PAGE
  // ──────────────────────────────────────────────────
  items.push(
    new Paragraph({ spacing: { before: 2000 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "COMPANY BUDGET TRACKER", bold: true, size: 52, font: "Arial", color: "1F4E79" })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "User Manual", size: 36, font: "Arial", color: "2E75B6", italics: true })]
    }),
    space(2),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      border: { top: { style: BorderStyle.SINGLE, size: 6, color: "2E75B6", space: 1 }, bottom: { style: BorderStyle.SINGLE, size: 6, color: "2E75B6", space: 1 } },
      children: [new TextRun({ text: "Enterprise Financial Operations — Employee & Manager Edition", size: 22, font: "Arial", color: "444444" })]
    }),
    space(2),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "Version 1.0  |  May 2026", size: 22, font: "Arial", color: "666666" })]
    }),
    new Paragraph({ children: [new PageBreak()] })
  );

  // ──────────────────────────────────────────────────
  // TABLE OF CONTENTS
  // ──────────────────────────────────────────────────
  items.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: "Table of Contents", bold: true, size: 32, font: "Arial", color: "1F4E79" })]
    }),
    new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" }),
    new Paragraph({ children: [new PageBreak()] })
  );

  // ──────────────────────────────────────────────────
  // SECTION 1: Document Information
  // ──────────────────────────────────────────────────
  items.push(h1("1. Document Information"));
  items.push(body("This section provides reference information about this manual and the system it documents."));
  items.push(space());

  const docInfoRows = [
    ["System Name", "Company Budget Tracker"],
    ["Manual Type", "End User Manual"],
    ["Intended Users", "Financial Managers, Accounting Staff, Payroll Officers, Project Managers, Procurement Staff"],
    ["Version", "1.0"],
    ["Prepared Date", "May 2026"],
    ["System Environment", "XAMPP (Apache, MySQL, PHP)"],
    ["Currency", "Philippine Peso (\u20B1)"],
    ["Default VAT Rate", "14% of Cash Out amount"],
  ];
  items.push(twoColTable(docInfoRows, 2800, 6560, ["Item", "Value"]));
  items.push(space());

  items.push(h2("Document Purpose"));
  items.push(body("This manual guides authorized company staff through the day-to-day operation of the Company Budget Tracker. It covers every module available to administrative and guest users, explains how financial data flows through the system, and provides step-by-step instructions for common tasks."));
  items.push(space());

  items.push(h2("Document Conventions"));
  items.push(bullet("Bold text indicates field names, button labels, or menu items."));
  items.push(bullet("Step-by-step instructions are presented as numbered lists."));
  items.push(bullet("NOTE boxes highlight important information."));
  items.push(bullet("WARNING boxes indicate actions that cannot be undone or that may affect data integrity."));
  items.push(bullet("TIP boxes provide shortcuts and efficiency suggestions."));
  items.push(bullet("[ Screenshot ] placeholders indicate where system images will be inserted."));

  // ──────────────────────────────────────────────────
  // SECTION 2: Introduction
  // ──────────────────────────────────────────────────
  items.push(h1("2. Introduction"));

  items.push(h2("2.1 What Is Company Budget Tracker?"));
  items.push(body("Company Budget Tracker is a web-based financial management system designed for tracking and monitoring company expenses, project budgets, payroll, and supplier information. The application helps organizations maintain comprehensive financial records and generate detailed reports for project monitoring, expense tracking, and financial analysis."));
  items.push(space());
  items.push(body("The system is built to serve a construction company's finance team, consolidating data that would otherwise be scattered across spreadsheets, emails, and manual records into a single, structured application. All financial information is stored in a central database and can be accessed by authorized staff from any computer on the company network."));

  items.push(h2("2.2 Business Problems the System Solves"));
  items.push(twoColTable([
    ["Fragmented financial records", "All expenses, payroll, and project monitoring are managed in one place, eliminating the need to reconcile multiple spreadsheets."],
    ["Manual expense rollup", "The system aggregates daily expenses into project monitoring reports automatically, removing tedious copy-and-paste work."],
    ["No real-time project visibility", "Managers can view project profitability, outstanding balances, and expense breakdowns at any time."],
    ["Inconsistent supplier data", "Supplier names, TIN numbers, and addresses are stored once and reused across expense entries."],
    ["Payroll tracking difficulty", "Bi-monthly payroll per project is recorded in a structured grid, with totals calculated automatically."],
    ["Limited audit trail", "Every record is traceable to the module and period it belongs to, supporting financial review and audits."],
  ], 3000, 6360, ["Business Problem", "How the System Helps"]));

  items.push(h2("2.3 Who Uses This System?"));
  items.push(twoColTable([
    ["Administrator (Admin)", "Full access to all data entry forms, reports, editing, deletion, expense calculation updates, and CSV exports."],
    ["Guest", "Read-only access to all reports and dashboards. Can export reports to CSV. Cannot create, edit, or delete any records."],
  ], 2400, 6960, ["User Role", "Access Description"]));

  items.push(h2("2.4 Key Benefits"));
  items.push(bullet("Real-time visibility into project financial health, including profit and outstanding balances."));
  items.push(bullet("Centralized supplier management, eliminating duplicate vendor records."));
  items.push(bullet("Automated VAT calculation (14% of Cash Out) on every daily expense entry."));
  items.push(bullet("Bi-monthly payroll tracking per project with auto-calculated annual totals."));
  items.push(bullet("Detailed expense categorization across 17 expense types, mapped to project monitoring reports."));
  items.push(bullet("CSV export capability for sharing reports with external stakeholders or auditors."));
  items.push(bullet("Role-based access control ensuring staff see and do only what their responsibilities require."));

  items.push(h2("2.5 System Modules at a Glance"));
  items.push(twoColTable([
    ["Reports / Project Monitoring", "Create and manage project financial reports; track contract amounts, collections, and profitability."],
    ["Daily Expenses", "Record individual daily cash-out entries linked to projects and suppliers."],
    ["Project Expenses", "Track expense lines specific to individual projects."],
    ["Supplier Management", "Maintain a directory of company vendors, including TIN and address."],
    ["Payroll", "Record bi-monthly payroll amounts per project and calculate annual totals."],
    ["Dashboard", "View a high-level financial summary of all projects."],
    ["Reports (View)", "Access detailed financial reports with filtering and CSV export."],
  ], 3000, 6360, ["Module", "Purpose"]));

  // ──────────────────────────────────────────────────
  // SECTION 3: Accessing the System
  // ──────────────────────────────────────────────────
  items.push(h1("3. Accessing the System"));

  items.push(h2("3.1 System Requirements"));
  items.push(body("Company Budget Tracker runs in a standard web browser. No additional software needs to be installed on your workstation. The application server is hosted on the company's local network."));
  items.push(space());
  items.push(bullet("Use a modern browser: Google Chrome, Mozilla Firefox, or Microsoft Edge (recommended)."));
  items.push(bullet("Ensure you are connected to the company's local network or VPN."));
  items.push(bullet("Contact your IT administrator for the correct application URL."));

  items.push(h2("3.2 Signing In"));
  items.push(body("The login page is the first screen you see when you open the application. Two user roles are available: Administrator and Guest. Each role uses separate login credentials."));
  items.push(space());
  items.push(screenshotPlaceholder("Login Screen"));
  items.push(space());

  items.push(h3("Signing In as an Administrator"));
  items.push(numbered("Open your web browser and navigate to the application URL provided by your IT administrator."));
  items.push(numbered("On the login page, select the Admin tab."));
  items.push(numbered("Enter your Username in the username field."));
  items.push(numbered("Enter your Password in the password field."));
  items.push(numbered("Click the Sign In button."));
  items.push(numbered("If your credentials are correct, you will be taken to the Administrator Dashboard."));
  items.push(numbered("If you see an error message, check that your username and password are spelled correctly and try again. Contact your Finance System Administrator if the problem persists."));
  items.push(space());

  items.push(h3("Signing In as a Guest"));
  items.push(numbered("Open your web browser and navigate to the application URL."));
  items.push(numbered("On the login page, select the Guest tab."));
  items.push(numbered("If you already have a guest account, enter your Username and Password, then click Sign In."));
  items.push(numbered("If you do not yet have an account, click Register to create a new guest account. Enter a username and password, then submit the registration form. You will be redirected to the login page to sign in."));
  items.push(numbered("On successful login, you will be taken to the Guest Dashboard."));
  items.push(space());

  items.push(note("Guest accounts are read-only. Guests cannot create, edit, or delete any records. If you need editing access, contact your system administrator to have your account upgraded to Admin."));

  items.push(h2("3.3 Signing Out"));
  items.push(body("Always sign out when you have finished working to protect financial data from unauthorized access."));
  items.push(numbered("Locate the Sign Out option in the navigation sidebar or header."));
  items.push(numbered("Click Sign Out. You will be returned to the login screen."));
  items.push(space());
  items.push(note("Do not simply close your browser window without signing out. Your session may remain active and allow others to access your account on that device.", "WARNING"));

  items.push(h2("3.4 Navigating the Application"));
  items.push(body("After signing in, the main application screen is divided into two primary areas: the sidebar navigation and the main content area."));
  items.push(space());
  items.push(screenshotPlaceholder("Main Navigation — Sidebar and Header"));
  items.push(space());

  items.push(twoColTable([
    ["Sidebar (left panel)", "The primary navigation menu. Contains links to the Dashboard, all data entry forms (Admin only), and all report sections. Click any menu item to navigate to that section."],
    ["Main Content Area", "Displays the currently selected page — dashboard, form, or report. All data entry, viewing, and filtering takes place here."],
    ["Navigation Icons", "Each sidebar item includes a descriptive icon for quick identification."],
    ["Active Section Indicator", "The current section is visually highlighted in the sidebar."],
    ["Dropdown Sub-menus", "Some sidebar sections expand to reveal sub-items (e.g., Forms expands to show Daily Expenses, Payroll, etc.)."],
  ], 2600, 6760, ["Interface Element", "Description"]));

  items.push(h2("3.5 Understanding Your Access Level"));
  items.push(body("The menus and options you see depend on your role. The table below summarizes the difference between Admin and Guest views."));
  items.push(space());
  items.push(threeColTable([
    ["Dashboard", "Full view with all project totals", "Full view (read only)"],
    ["Data Entry Forms", "Visible and fully functional", "Not available"],
    ["Reports", "View, edit records, export CSV", "View and export CSV only"],
    ["Edit / Delete Records", "Available", "Not available"],
    ["Update Expense Calculations", "Available", "Not available"],
    ["CSV Export", "Available", "Available"],
  ], [3000, 3180, 3180], ["Feature", "Administrator", "Guest"]));

  // ──────────────────────────────────────────────────
  // SECTION 4: Dashboard Overview
  // ──────────────────────────────────────────────────
  items.push(h1("4. Dashboard Overview"));

  items.push(h2("4.1 Purpose of the Dashboard"));
  items.push(body("The Dashboard is the first screen displayed after signing in. It provides a high-level financial overview of all projects currently tracked in the system. Finance managers and project coordinators use the dashboard to quickly assess the company's financial health without navigating into individual reports."));
  items.push(space());
  items.push(screenshotPlaceholder("Dashboard — Full Overview"));
  items.push(space());

  items.push(h2("4.2 Dashboard Areas"));
  items.push(twoColTable([
    ["Project Summary Cards", "Display key financial metrics for each project: contracted amount, amount collected, total expenses, balance to be collected, and calculated profit."],
    ["Expense Totals", "Aggregated expense figures across all projects, broken down by expense category."],
    ["Project Progress Indicators", "Visual indicators showing accomplishment percentage for active projects."],
    ["Navigation Shortcuts", "Quick links to frequently used modules such as Daily Expenses and Payroll."],
  ], 2800, 6560, ["Dashboard Area", "Purpose"]));

  items.push(h2("4.3 Reading Financial Totals"));
  items.push(body("All monetary values on the dashboard are displayed in Philippine Peso (\u20B1). The following calculations are used throughout the system:"));
  items.push(space());
  items.push(bullet("Profit = Amount Collected minus Total Expenses. A positive figure indicates the project is currently generating surplus; a negative figure indicates the project expenses exceed collections received to date."));
  items.push(bullet("Balance to Be Collected = Contracted Amount minus Amount Collected. This is the outstanding amount owed by the client."));
  items.push(bullet("Total Expenses = Sum of all categorized expense lines recorded for the project."));
  items.push(bullet("VAT on each daily expense = 14% of the Cash Out amount, calculated automatically."));
  items.push(space());
  items.push(note("Dashboard figures reflect the most recently saved data. If you have just entered new expenses, click Update Expenses on the Project Monitoring report to refresh the aggregated totals before reviewing the dashboard.", "TIP"));

  items.push(h2("4.4 Admin Dashboard vs. Guest Dashboard"));
  items.push(body("Both Admin and Guest users have access to the Dashboard. The figures displayed are identical. The difference is that Admins see additional navigation links to data entry forms, while Guests see only report-related options. The financial data itself is the same for both roles."));

  // ──────────────────────────────────────────────────
  // SECTION 5: Data Entry Modules
  // ──────────────────────────────────────────────────
  items.push(h1("5. Data Entry Modules"));
  items.push(body("This section covers every data entry form available to administrators. Each module corresponds to a specific type of financial record. Follow the step-by-step instructions to enter data accurately and consistently."));
  items.push(space());
  items.push(note("Data entry forms are available to Administrator accounts only. Guest users do not have access to these forms. If you are a Guest user, proceed to Section 6 — Reports and Monitoring.", "NOTE"));

  // ── 5.1 Report / Project Monitoring ──
  items.push(h2("5.1 Creating a Project Monitoring Report"));

  items.push(h3("Purpose"));
  items.push(body("A Project Monitoring Report (also called a Contracted Report) is the central financial record for a single project. It stores the project timeline, contract value, amount collected, and a summary of all expenses across 17 categories. Each project must have a report record before daily expenses and payroll can be linked and aggregated into it."));

  items.push(h3("When to Create a Report"));
  items.push(bullet("When a new project is awarded and financial tracking needs to begin."));
  items.push(bullet("At the start of each reporting year, if the project spans multiple years and separate annual records are required."));

  items.push(h3("Steps to Create a New Report"));
  items.push(numbered("In the sidebar, navigate to Forms > Report."));
  items.push(numbered("The Report Creation Form will open in the main content area."));
  items.push(screenshotPlaceholder("Report Creation Form"));
  items.push(numbered("Complete the following fields:"));
  items.push(space());

  items.push(twoColTable([
    ["Report ID", "A unique identifier for this report. Must be distinct from all other report IDs in the system. Use a consistent naming convention (e.g., RPT-2025-001)."],
    ["Report Description", "The project or report name as it will appear on monitoring reports."],
    ["Project ID", "A short project code used to link daily expenses and payroll entries to this report."],
    ["Date Start", "The project commencement date."],
    ["Date Finish", "The expected or actual project completion date."],
    ["Accomplishment (%)", "Current project completion as a percentage (0.00 to 100.00)."],
    ["Remarks", "Any additional notes or status descriptions relevant to this report."],
    ["Contracted Amount", "The total value of the project contract (\u20B1)."],
    ["Tax Amount", "Any tax amounts applicable to the contract."],
    ["Amount Collected", "Total payments received from the client to date (\u20B1)."],
  ], 2800, 6560, ["Field", "Description"]));

  items.push(numbered("Review all entries for accuracy before submitting."));
  items.push(numbered("Click the Submit or Save button. The system will:"));
  items.push(bullet("Create a new record in the current year's project monitoring table.", 1));
  items.push(bullet("Generate a unique Expenses ID (format: EXP- followed by 6 characters) linked to this report.", 1));
  items.push(bullet("Initialize a corresponding expense detail record with zero values for all 17 expense categories.", 1));
  items.push(bullet("Automatically calculate Balance to Be Collected as Contracted Amount minus Amount Collected.", 1));
  items.push(space());

  items.push(note("After creating the report, you can begin entering daily expenses and payroll entries linked to this project. Use Update Expenses in the Project Monitoring Report view to roll up expense totals."));

  // ── 5.2 Daily Expenses ──
  items.push(h2("5.2 Entering Daily Expenses"));

  items.push(h3("Purpose"));
  items.push(body("The Daily Expenses form records individual cash disbursements made by the company each day. Each entry captures the date, nature of the expense, supplier details, and the amount paid. These entries are the source data for the project monitoring expense categories."));

  items.push(h3("When to Use This Module"));
  items.push(bullet("Record every cash payment made for a project on the day it occurs (or as soon as the receipt is available)."));
  items.push(bullet("Use this module for general company expenses that are project-related, such as materials, diesel, subcontractor payments, and utilities."));
  items.push(space());
  items.push(note("Entering expenses daily is strongly recommended. Delayed entry increases the risk of missed or inaccurate records.", "TIP"));

  items.push(h3("Steps to Enter a Daily Expense"));
  items.push(numbered("In the sidebar, navigate to Forms > Daily Expenses."));
  items.push(numbered("The Daily Expense Entry Form will open."));
  items.push(screenshotPlaceholder("Daily Expenses Entry Form"));
  items.push(numbered("Complete the following fields:"));
  items.push(space());

  items.push(twoColTable([
    ["Expenses Date", "The date the payment was made. Use the date picker to select the correct date."],
    ["Particulars", "A brief description of what the payment is for (e.g., Diesel, Materials, Subcontractor Payment)."],
    ["Report / Project", "Select the report or project this expense belongs to. The system will display available reports for linking."],
    ["Supplier", "Select an existing supplier from the list, or enter a new supplier name. If the supplier does not exist, the system will create a new supplier record automatically."],
    ["Supplier TIN", "The supplier's Tax Identification Number (format: XXX-XXX-XXX-XXX). Required for new suppliers."],
    ["Supplier Address", "The supplier's registered address. Required for new suppliers."],
    ["Cash Out", "The total amount paid in Philippine Peso (\u20B1), excluding VAT."],
    ["VAT", "Automatically calculated by the system as 14% of the Cash Out amount. This field is display-only."],
    ["Expense Type / Category", "Select the category that best describes this expense. The category determines which column on the Project Monitoring Report this expense will be applied to when Update Expenses is run."],
  ], 2800, 6560, ["Field", "Description"]));

  items.push(numbered("Review the VAT amount displayed. Verify it is 14% of the Cash Out you entered."));
  items.push(numbered("Click Submit or Save. The system will:"));
  items.push(bullet("Insert the expense record into the monthly expenses table (e.g., records for January 2025 are stored in a table labeled dailyexpenses_2025_01).", 1));
  items.push(bullet("Create or update the supplier record if a new supplier was provided.", 1));
  items.push(bullet("Record the expense in the project-specific expense table for the linked project.", 1));
  items.push(space());

  items.push(h3("Expense Categories"));
  items.push(body("The Expense Type field links each daily expense to a specific column on the Project Monitoring Report. Select the most accurate category to ensure correct financial reporting."));
  items.push(space());

  items.push(twoColTable([
    ["Material Cost", "Raw materials, scaffolding rental, tools, and equipment supplies."],
    ["Coil Breakdown", "Coil-related materials or breakdown expenses."],
    ["Labor Cost", "On-site labor payments (not payroll — use the Payroll module for regular employee pay)."],
    ["Company Outing", "13th month pay, Christmas expenses, and company events."],
    ["Mandatories", "Government-mandated contributions and fees."],
    ["Equipment / Power Tools", "Purchase or rental of heavy equipment and power tools."],
    ["1601 C", "Compensation-related tax filings and payments."],
    ["Vehicle / Diesel / Tollgate", "Fuel, vehicle maintenance, registration, and toll fees."],
    ["Equipment Maintenance", "Calibration and maintenance of equipment and vehicles."],
    ["SubCon", "Subcontractor project payments and supplier fees."],
    ["House Rentals / Utilities", "Rentals, utilities, and site maintenance expenses."],
    ["Surety / Commission", "Surety bond and commission payments."],
    ["5% Commission", "Five-percent commission charges."],
    ["VAT", "Value-added tax payments (separate from the auto-calculated VAT on the expense line)."],
    ["Medical / Insurance", "Uniforms, PPE, medical expenses, and medicines."],
    ["ISO Certification", "ISO certification-related expenses."],
    ["Others", "Meals, permits, professional fees, drawings, seminars, and miscellaneous items."],
  ], 2800, 6560, ["Category", "Typical Use"]));

  items.push(h3("Expected Outcome"));
  items.push(body("After saving, the new expense appears in the daily expenses report for the selected month and project. The expense will be included in the next Update Expenses calculation for the linked project monitoring report."));
  items.push(space());
  items.push(note("If the supplier does not appear in the dropdown, you can type the name directly. The system will prompt you for the TIN and address and create a new supplier record automatically."));

  // ── 5.3 Payroll ──
  items.push(h2("5.3 Entering Payroll"));

  items.push(h3("Purpose"));
  items.push(body("The Payroll module records bi-monthly payroll amounts for each project. Payroll is tracked across 24 pay periods per year (the 15th and 30th of each month), and the system calculates the annual total automatically."));

  items.push(h3("When to Use This Module"));
  items.push(bullet("After each pay run (twice per month), enter the payroll amount disbursed for each project."));
  items.push(bullet("Use this module for all regular employee compensation that can be attributed to a specific project."));

  items.push(h3("Steps to Enter Payroll"));
  items.push(numbered("In the sidebar, navigate to Forms > Payroll."));
  items.push(numbered("The Payroll Entry Form will open."));
  items.push(screenshotPlaceholder("Payroll Entry Form"));
  items.push(numbered("Complete the following fields:"));
  items.push(space());

  items.push(twoColTable([
    ["Project ID", "Select the project this payroll entry belongs to."],
    ["Year", "The calendar year for this payroll record."],
    ["Pay Period Amounts", "Enter the payroll amount for each applicable bi-monthly period. Pay periods are labeled by month and day (e.g., January 15, January 30, February 15, etc.)."],
  ], 2800, 6560, ["Field", "Description"]));

  items.push(numbered("Enter amounts only for the pay periods that apply. Leave other periods blank (or at zero) if no payroll was disbursed for that project during that period."));
  items.push(numbered("Click Submit or Save."));
  items.push(numbered("The system will automatically calculate the Total Payroll as the sum of all 24 bi-monthly entries."));
  items.push(space());

  items.push(h3("Expected Outcome"));
  items.push(body("The payroll record is saved and displayed in the Payroll Summary report. Total Payroll for the project and year is updated automatically. Review the Payroll Summary report to verify the figures are correct."));
  items.push(space());
  items.push(note("Payroll totals do not automatically roll into the Project Monitoring Report expense columns. Finance managers should cross-reference the Payroll Summary with the Labor Cost column on the monitoring report and make any necessary manual adjustments.", "WARNING"));

  // ── 5.4 Project Expenses ──
  items.push(h2("5.4 Entering Project Expenses"));

  items.push(h3("Purpose"));
  items.push(body("The Project Expenses module records expenses that are specific to a single project. Unlike daily expenses, project expenses are stored in a project-named table and provide an additional layer of project-level expense tracking."));

  items.push(h3("When to Use This Module"));
  items.push(bullet("Use for project-specific purchases or payments that you want tracked separately from the general daily expense log."));
  items.push(bullet("Useful for project coordinators who maintain per-project expense registers."));

  items.push(h3("Steps to Enter a Project Expense"));
  items.push(numbered("In the sidebar, navigate to Forms > Project Expenses."));
  items.push(numbered("The Project Expense Entry Form will open."));
  items.push(screenshotPlaceholder("Project Expenses Entry Form"));
  items.push(numbered("Complete the following fields:"));
  items.push(space());

  items.push(twoColTable([
    ["Project Name", "Select the project from the available list. Each project has its own expense register."],
    ["Project Date", "The date of the expense."],
    ["Item Description", "A description of what was purchased or paid for."],
    ["Supplier", "Select or enter the supplier for this expense."],
    ["Amount", "The expense amount in Philippine Peso (\u20B1)."],
    ["VAT", "VAT applicable to this expense."],
  ], 2800, 6560, ["Field", "Description"]));

  items.push(numbered("Click Submit or Save to record the expense."));
  items.push(space());

  items.push(note("If the project does not yet have a project expenses table in the system, submitting the first expense for that project will create one automatically.", "NOTE"));

  // ── 5.5 Supplier Management ──
  items.push(h2("5.5 Managing Suppliers"));

  items.push(h3("Purpose"));
  items.push(body("The Supplier Management module maintains a directory of all vendors and service providers that the company does business with. Having a central supplier record ensures consistent names and tax information across all expense entries."));

  items.push(h3("When to Use This Module"));
  items.push(bullet("When a new vendor or service provider is engaged for the first time."));
  items.push(bullet("When supplier information needs to be updated (e.g., a change of address or TIN correction)."));
  items.push(bullet("To verify supplier details before creating an expense entry."));

  items.push(h3("Steps to Add a New Supplier"));
  items.push(numbered("In the sidebar, navigate to Forms > Supplier."));
  items.push(numbered("The Supplier Entry Form will open."));
  items.push(screenshotPlaceholder("Supplier Entry Form"));
  items.push(numbered("Complete the following fields:"));
  items.push(space());

  items.push(twoColTable([
    ["Supplier Name", "The full legal business name of the supplier."],
    ["Supplier TIN", "The supplier's Tax Identification Number in the format XXX-XXX-XXX-XXX."],
    ["Supplier Address", "The supplier's full registered business address."],
  ], 2800, 6560, ["Field", "Description"]));

  items.push(numbered("Click Submit or Save. The system will assign a unique Supplier ID (format: SUP- followed by 6 digits)."));
  items.push(space());

  items.push(h3("Editing an Existing Supplier"));
  items.push(numbered("Navigate to the Supplier Details report (Reports > Supplier)."));
  items.push(numbered("Locate the supplier using the search or filter options."));
  items.push(numbered("Click the Edit button next to the supplier record."));
  items.push(numbered("Update the necessary fields and save."));
  items.push(space());

  items.push(note("Always verify supplier TIN numbers carefully before saving. An incorrect TIN on a supplier record will appear on all expense entries linked to that supplier.", "WARNING"));
  items.push(note("When entering a daily expense, if the supplier you need is not in the list, you can enter the supplier name directly in the expense form. The system will prompt for TIN and address and create the supplier record at the same time as the expense.", "TIP"));

  // ── 5.6 Understanding Automatic VAT Calculation ──
  items.push(h2("5.6 Understanding Automatic VAT Calculation"));
  items.push(body("The system automatically calculates VAT on every Daily Expense entry. You do not need to calculate this manually."));
  items.push(space());
  items.push(twoColTable([
    ["VAT Rate", "14% (fixed system rate)"],
    ["Calculation Formula", "VAT Amount = Cash Out \u00D7 0.14"],
    ["Example", "Cash Out of \u20B110,000.00 results in VAT of \u20B11,400.00"],
    ["Where it appears", "The VAT field on the Daily Expenses form is automatically populated after you enter the Cash Out amount."],
    ["Storage", "The VAT amount is stored separately from Cash Out in the database for detailed reporting."],
  ], 2800, 6560, ["Detail", "Information"]));

  // ──────────────────────────────────────────────────
  // SECTION 6: Reports & Monitoring
  // ──────────────────────────────────────────────────
  items.push(h1("6. Reports and Monitoring"));
  items.push(body("The Reports section provides read access to all financial data stored in the system. Both Admin and Guest users can view reports. Admin users can additionally edit records and trigger expense calculations from the report views."));
  items.push(space());
  items.push(screenshotPlaceholder("Reports Navigation Menu"));

  // ── 6.1 Project Monitoring Report ──
  items.push(h2("6.1 Project Monitoring Report"));

  items.push(h3("Purpose"));
  items.push(body("The Project Monitoring Report is the primary financial summary for each project. It shows the contracted amount, amount collected, outstanding balance, all 17 expense categories, total expenses, and the calculated profit. This report is used by finance managers and leadership to assess project financial health."));

  items.push(h3("How to Open the Report"));
  items.push(numbered("In the sidebar, navigate to Reports > Project Monitoring."));
  items.push(numbered("The report will load, showing all project reports for the current year."));
  items.push(screenshotPlaceholder("Project Monitoring Report"));

  items.push(h3("Filtering and Searching"));
  items.push(bullet("Use the Year filter to display reports for a specific calendar year. Each year's reports are stored separately."));
  items.push(bullet("Use the search function to find a specific project by name, project ID, or report ID."));
  items.push(bullet("Sort by any column header to reorder the report list."));

  items.push(h3("Interpreting the Report Columns"));
  items.push(twoColTable([
    ["Report Description", "The project or report name."],
    ["Project ID", "The unique project identifier."],
    ["Date Start / Date Finish", "Project timeline."],
    ["Accomplishment", "Percentage of project completion."],
    ["Contracted Amount", "Total contract value."],
    ["Tax Amount", "Tax on the contract."],
    ["Amount Collected", "Revenue received from the client to date."],
    ["Balance to Be Collected", "Contracted Amount minus Amount Collected."],
    ["Expense Category Columns", "Seventeen columns showing the rolled-up expense totals per category (Material Cost, Labor Cost, Diesel, etc.)."],
    ["Total Expenses", "Sum of all 17 expense category columns."],
    ["Profit", "Amount Collected minus Total Expenses."],
  ], 3000, 6360, ["Column", "What It Shows"]));

  items.push(h3("Updating Expense Totals (Admin Only)"));
  items.push(body("Expense category columns are not updated in real time as daily expenses are entered. Finance managers must trigger an update manually."));
  items.push(numbered("Open the Project Monitoring Report."));
  items.push(numbered("Click the Update Expenses button."));
  items.push(numbered("The system will scan all approved daily expenses for the current year, group them by expense category and project, and write the totals into the corresponding expense columns on each monitoring report."));
  items.push(numbered("After the update completes, verify the figures in the report."));
  items.push(space());
  items.push(note("Run Update Expenses before presenting the monitoring report to management or before month-end close. This ensures all recently entered daily expenses are included in the project totals.", "TIP"));
  items.push(note("The Update Expenses process resets all expense category columns to zero before recalculating. This is normal behavior and ensures figures are not doubled.", "NOTE"));

  items.push(h3("Editing a Monitoring Report (Admin Only)"));
  items.push(numbered("Locate the report record in the list."));
  items.push(numbered("Click the Edit button for that record."));
  items.push(numbered("The edit form will open with existing values pre-filled."));
  items.push(numbered("Update the necessary fields (e.g., Amount Collected, Accomplishment percentage, Remarks)."));
  items.push(numbered("Save the changes. Financial totals that depend on the updated values (Balance to Be Collected, Profit) will be recalculated automatically."));

  items.push(h3("Exporting the Report (Admin and Guest)"));
  items.push(numbered("Click the Export to CSV button on the Project Monitoring Report page."));
  items.push(numbered("The browser will download a CSV file containing all report records for the selected year."));
  items.push(numbered("Open the CSV file in Microsoft Excel or any spreadsheet application for further analysis or distribution."));

  // ── 6.2 Daily Expenses Report ──
  items.push(h2("6.2 Daily Expenses Report"));

  items.push(h3("Purpose"));
  items.push(body("The Daily Expenses Report displays all daily cash-out entries recorded in the system. Finance staff use this report to verify expense entries, review supplier payments, and identify missing or incorrect records before running the expense update."));

  items.push(h3("How to Open the Report"));
  items.push(numbered("In the sidebar, navigate to Reports > Daily Expenses."));
  items.push(numbered("The report will load showing all daily expense entries."));
  items.push(screenshotPlaceholder("Daily Expenses Report"));

  items.push(h3("Filtering and Searching"));
  items.push(bullet("Filter by Year to show only entries from a specific calendar year."));
  items.push(bullet("Filter by Month to narrow results to a specific month."));
  items.push(bullet("Use the Search by Particulars field to find specific expense descriptions."));
  items.push(bullet("Filter by Project to see expenses for a single project."));

  items.push(h3("Report Columns"));
  items.push(twoColTable([
    ["Expenses Date", "The date the payment was made."],
    ["Particulars", "Description of the expense."],
    ["Supplier Name", "Name of the vendor paid."],
    ["Supplier TIN", "Vendor tax ID."],
    ["Cash Out", "Amount paid (\u20B1)."],
    ["VAT", "Calculated VAT amount (14% of Cash Out)."],
    ["Expense Type", "Category of the expense."],
    ["Project", "Project this expense is linked to."],
  ], 2800, 6560, ["Column", "Description"]));

  items.push(h3("When Finance Staff Use This Report"));
  items.push(bullet("Monthly review to confirm all payments are recorded before running Update Expenses on the monitoring report."));
  items.push(bullet("Supplier payment verification — confirm a specific supplier's invoices are in the system."));
  items.push(bullet("Category audit — check that expenses are assigned to the correct expense type before rolling up to the monitoring report."));

  // ── 6.3 Payroll Summary ──
  items.push(h2("6.3 Payroll Summary Report"));

  items.push(h3("Purpose"));
  items.push(body("The Payroll Summary displays all bi-monthly payroll amounts recorded per project for a given year, with the automatically calculated annual total for each project."));

  items.push(h3("How to Open the Report"));
  items.push(numbered("In the sidebar, navigate to Reports > Payroll."));
  items.push(numbered("Select the Year to view using the year filter."));
  items.push(screenshotPlaceholder("Payroll Summary Report"));

  items.push(h3("Report Structure"));
  items.push(body("Each row in the Payroll Summary represents a project. The columns display the payroll amount for each of the 24 bi-monthly pay periods (January 15, January 30, through December 15, December 30). The final column shows the Total Payroll for the year."));
  items.push(space());
  items.push(note("Use the Payroll Summary when cross-referencing Labor Cost on the Project Monitoring Report. Confirm that project labor costs are consistent between both reports.", "TIP"));

  // ── 6.4 Project Expenses Report ──
  items.push(h2("6.4 Project Expenses Report"));

  items.push(h3("Purpose"));
  items.push(body("The Project Expenses Report shows all expenses recorded in the project-specific registers. Each project that has project expense entries will appear as a section or tab in this report."));

  items.push(h3("How to Open the Report"));
  items.push(numbered("In the sidebar, navigate to Reports > Project Expenses."));
  items.push(numbered("Select the project you want to view from the available list or tab."));
  items.push(screenshotPlaceholder("Project Expenses Report"));

  items.push(h3("Report Columns"));
  items.push(twoColTable([
    ["Project Date", "Date of the expense."],
    ["Item Description", "Description of the item or service purchased."],
    ["Supplier", "Supplier name."],
    ["Amount", "Expense amount (\u20B1)."],
    ["VAT", "Applicable VAT."],
  ], 2800, 6560, ["Column", "Description"]));

  // ── 6.5 Supplier Details ──
  items.push(h2("6.5 Supplier Details Report"));

  items.push(h3("Purpose"));
  items.push(body("The Supplier Details report displays all registered suppliers in the system. Use it to verify supplier information, look up TIN numbers, and confirm which suppliers are in the system before entering expenses."));

  items.push(h3("How to Open the Report"));
  items.push(numbered("In the sidebar, navigate to Reports > Supplier."));
  items.push(numbered("The full supplier list will be displayed."));
  items.push(screenshotPlaceholder("Supplier Details Report"));

  items.push(h3("Report Columns"));
  items.push(twoColTable([
    ["Supplier ID", "Unique identifier assigned by the system (format: SUP-XXXXXX)."],
    ["Supplier Name", "Full legal name of the vendor."],
    ["Supplier TIN", "Tax Identification Number (format: XXX-XXX-XXX-XXX)."],
    ["Supplier Address", "Registered business address."],
  ], 2800, 6560, ["Column", "Description"]));

  // ── 6.6 Expense Detail Report ──
  items.push(h2("6.6 Expense Detail Report"));

  items.push(h3("Purpose"));
  items.push(body("The Expense Detail Report shows the aggregated expense breakdown per project across all 17 expense categories. This report represents the intermediate aggregation layer between daily expenses and the project monitoring report."));

  items.push(h3("How to Use This Report"));
  items.push(body("Finance staff use this report to verify that the Update Expenses process correctly assigned daily expense amounts to the right categories. If a category total appears incorrect, trace back to the Daily Expenses Report and check that individual expense entries are assigned the correct Expense Type."));

  // ──────────────────────────────────────────────────
  // SECTION 7: Guest User Access
  // ──────────────────────────────────────────────────
  items.push(h1("7. Guest User Access"));

  items.push(h2("7.1 What Guests Can Do"));
  items.push(body("Guest users have view-only access to the Company Budget Tracker. Guests can review all financial reports and export data to CSV, but cannot make any changes to the data."));
  items.push(space());

  items.push(twoColTable([
    ["Dashboard", "View all project financial summaries and KPIs."],
    ["Project Monitoring Report", "View all project reports including contracted amounts, expense categories, and profit."],
    ["Daily Expenses Report", "View all daily expense entries with filtering by year, month, project, and category."],
    ["Payroll Summary", "View payroll totals by project and pay period."],
    ["Project Expenses Report", "View project-level expense registers."],
    ["Supplier Details", "View supplier names, TIN numbers, and addresses."],
    ["CSV Export", "Download any report as a CSV file for further analysis."],
  ], 2800, 6560, ["What Guests Can Access", "Details"]));

  items.push(h2("7.2 What Guests Cannot Do"));
  items.push(bullet("Create new records (expenses, payroll, projects, suppliers, reports)."));
  items.push(bullet("Edit or update any existing financial record."));
  items.push(bullet("Delete any record."));
  items.push(bullet("Trigger the Update Expenses calculation."));
  items.push(bullet("Access data entry forms."));
  items.push(space());
  items.push(note("If you require editing access, contact your Finance System Administrator. Your account role can be upgraded from Guest to Admin if your responsibilities require it."));

  items.push(h2("7.3 Guest Registration"));
  items.push(body("New guest accounts can be self-registered from the login page."));
  items.push(numbered("On the login page, select the Guest tab."));
  items.push(numbered("Click the Register link or button."));
  items.push(numbered("Enter a username and password."));
  items.push(numbered("Submit the registration form. You will be returned to the login page."));
  items.push(numbered("Sign in using your new credentials."));
  items.push(space());
  items.push(note("Guest accounts are created with standard read-only access. Only an Administrator can upgrade a guest account to Admin level.", "NOTE"));

  // ──────────────────────────────────────────────────
  // SECTION 8: Common Workflows
  // ──────────────────────────────────────────────────
  items.push(h1("8. Common Workflows"));
  items.push(body("This section provides end-to-end procedural guides for the most common financial tasks performed in Company Budget Tracker. Use these workflows as a reference for your regular operating rhythm."));

  items.push(h2("Workflow 1 — Set Up a New Project Budget"));
  items.push(body("Use this workflow when a new project is awarded and financial tracking needs to begin."));
  items.push(space());
  items.push(numbered("Navigate to Forms > Supplier. Add the primary supplier or subcontractor for the project if they are not already in the system."));
  items.push(numbered("Navigate to Forms > Report. Create a new Project Monitoring Report with the project name, contract amount, and start date."));
  items.push(numbered("Note the Report ID and Expenses ID generated by the system."));
  items.push(numbered("Navigate to Reports > Project Monitoring to confirm the new report appears with correct values."));
  items.push(numbered("Inform the relevant project team of the Project ID so they can reference it when submitting expenses."));
  items.push(space());
  items.push(note("Creating the monitoring report first is essential. Daily expenses and payroll must reference an existing project report to be correctly linked and aggregated.", "WARNING"));

  items.push(h2("Workflow 2 — Enter a Daily Expense"));
  items.push(body("Use this workflow every time a payment is made for a project."));
  items.push(space());
  items.push(numbered("Collect the receipt or invoice for the payment."));
  items.push(numbered("Navigate to Forms > Daily Expenses."));
  items.push(numbered("Enter the date from the receipt."));
  items.push(numbered("Enter the Particulars describing the purchase."));
  items.push(numbered("Select the linked Report/Project from the dropdown."));
  items.push(numbered("Enter the Supplier. If the supplier is new, enter their TIN and address."));
  items.push(numbered("Enter the Cash Out amount. Verify the auto-calculated VAT (should be 14% of Cash Out)."));
  items.push(numbered("Select the correct Expense Type / Category."));
  items.push(numbered("Click Submit."));
  items.push(numbered("File or scan the receipt for your records."));

  items.push(h2("Workflow 3 — Process Monthly Payroll"));
  items.push(body("Use this workflow after each pay run."));
  items.push(space());
  items.push(numbered("Confirm payroll amounts per project with the HR or operations team."));
  items.push(numbered("Navigate to Forms > Payroll."));
  items.push(numbered("Select the Project ID."));
  items.push(numbered("Select the Year."));
  items.push(numbered("Enter the payroll amount in the correct pay period column (e.g., January 15 or January 30)."));
  items.push(numbered("Click Submit."));
  items.push(numbered("Navigate to Reports > Payroll to verify the entered amounts and confirm the Total Payroll is updated correctly."));
  items.push(numbered("Cross-reference the Labor Cost column on the corresponding Project Monitoring Report and note any variance for manual review."));

  items.push(h2("Workflow 4 — Monthly Financial Review and Update"));
  items.push(body("Use this workflow at the end of each month before presenting financial data to management."));
  items.push(space());
  items.push(numbered("Review the Daily Expenses Report. Verify all expenses for the month are entered and correctly categorized."));
  items.push(numbered("Review the Payroll Summary. Confirm all pay periods for the month are recorded per project."));
  items.push(numbered("Navigate to Reports > Project Monitoring."));
  items.push(numbered("Click Update Expenses. Wait for the system to complete the recalculation."));
  items.push(numbered("Review each project's monitoring report. Verify Total Expenses, Balance to Be Collected, and Profit figures."));
  items.push(numbered("If any figures appear incorrect, return to the Daily Expenses Report, correct the affected entries, and re-run Update Expenses."));
  items.push(numbered("Export reports to CSV as required for management presentation or filing."));

  items.push(h2("Workflow 5 — Verify and Audit Supplier Expenses"));
  items.push(body("Use this workflow when auditing payments to a specific supplier."));
  items.push(space());
  items.push(numbered("Navigate to Reports > Supplier. Search for the supplier by name and note their Supplier ID and TIN."));
  items.push(numbered("Navigate to Reports > Daily Expenses."));
  items.push(numbered("Use the search or filter to find entries linked to that supplier."));
  items.push(numbered("Review the dates, amounts, and categories of all expenses recorded for the supplier."));
  items.push(numbered("Cross-reference with physical receipts or invoices."));
  items.push(numbered("If any discrepancies are found, use the Edit function on the affected expense record (Admin only) to correct the entry."));

  items.push(h2("Workflow 6 — Add a New Supplier"));
  items.push(body("Use this workflow when engaging a new vendor."));
  items.push(space());
  items.push(numbered("Request the supplier's full legal name, TIN number, and registered address before processing any payment."));
  items.push(numbered("Navigate to Forms > Supplier."));
  items.push(numbered("Enter the supplier details and save."));
  items.push(numbered("Note the Supplier ID for reference."));
  items.push(numbered("All future expense entries for this supplier can now use the stored record, ensuring consistent data."));

  // ──────────────────────────────────────────────────
  // SECTION 9: Validation Messages and Common Errors
  // ──────────────────────────────────────────────────
  items.push(h1("9. Validation Messages and Common Errors"));
  items.push(body("The system performs validation checks when you submit forms. This section describes common messages and what action to take."));
  items.push(space());

  items.push(threeColTable([
    ["A required field is left blank", "The form will not submit; the blank field will be highlighted.", "Fill in the required field with the correct information and try submitting again."],
    ["Duplicate Record ID", "The system may display a message indicating the Report ID or Supplier ID already exists.", "Use a unique identifier. Check existing records before creating new ones."],
    ["Supplier not found in dropdown", "The autocomplete list does not show the supplier you are looking for.", "Type the supplier name in full. If it is a new supplier, complete the TIN and address fields that appear."],
    ["VAT shows as zero or empty", "If Cash Out is not entered before tabbing to VAT, the auto-calculation may not trigger.", "Enter Cash Out first, then click into another field. The VAT value should update automatically."],
    ["No data found on report", "A report page shows no records or an empty table.", "Check that your year and filter selections match the data you expect. Confirm that expense entries exist for the selected period."],
    ["Report ID not available in expense form", "The project or report you need is not in the dropdown when entering an expense.", "First create a Project Monitoring Report for that project. Then return to the expense form."],
    ["Access denied or page not found", "You attempt to access a page that is not available for your user role.", "Guest users cannot access data entry forms. Contact your administrator if you believe you should have Admin access."],
    ["Update Expenses shows no change", "After clicking Update Expenses, certain columns remain at zero.", "Verify that daily expenses are correctly linked to the project by checking the Daily Expenses Report and confirming the Report/Project field is filled in for each entry."],
    ["CSV download does not start", "Clicking Export to CSV does not result in a file download.", "Check your browser's pop-up or download settings. Try a different browser. Ensure you have permission to export."],
  ], [3000, 3000, 3360], ["Situation", "What Happens", "What to Do"]));

  // ──────────────────────────────────────────────────
  // SECTION 10: Best Practices
  // ──────────────────────────────────────────────────
  items.push(h1("10. Best Practices"));
  items.push(body("Following these guidelines will help ensure data accuracy, system performance, and consistent financial reporting across the organization."));
  items.push(space());

  items.push(h2("10.1 Data Entry Best Practices"));
  items.push(bullet("Enter expenses on the day they occur or as soon as the receipt is received. Delayed entry increases the risk of errors and omissions."));
  items.push(bullet("Always select the correct Expense Type when entering daily expenses. Incorrect categories will cause errors in the Project Monitoring Report when Update Expenses is run."));
  items.push(bullet("Verify the supplier name, TIN, and address before saving a new supplier record. Errors in supplier data are difficult to trace later and may affect tax compliance."));
  items.push(bullet("Use consistent naming conventions for Project IDs and Report IDs. For example, prefix all report IDs with a year indicator (RPT-2025-001) to make them easily sortable and searchable."));
  items.push(bullet("Review payroll entries for accuracy before saving. Once payroll is entered for a pay period, verify with HR or operations before making corrections."));
  items.push(bullet("Avoid duplicating expenses across Daily Expenses and Project Expenses for the same payment. Enter each payment once in the most appropriate module."));

  items.push(h2("10.2 Reporting Best Practices"));
  items.push(bullet("Run Update Expenses at least once per month before any management review or presentation. This ensures the Project Monitoring Report reflects the latest daily expense data."));
  items.push(bullet("Review the Daily Expenses Report at the end of each month to catch any missing entries before running Update Expenses."));
  items.push(bullet("After running Update Expenses, spot-check two or three expense categories in the Project Monitoring Report against the Daily Expenses Report to confirm figures are correct."));
  items.push(bullet("Use the year filter on all report pages to ensure you are reviewing data for the correct period."));
  items.push(bullet("Cross-reference Payroll Summary totals with the Labor Cost column on each project's monitoring report as part of the monthly close process."));

  items.push(h2("10.3 Security Best Practices"));
  items.push(bullet("Always sign out when you have finished working, especially on shared computers."));
  items.push(bullet("Do not share your username or password with colleagues. Each person with system access should have their own account."));
  items.push(bullet("If you suspect your password has been compromised, contact the Finance System Administrator immediately to have it reset."));
  items.push(bullet("Guest accounts should be used for read-only review purposes only. Do not provide guest credentials to anyone who needs to enter or edit data."));

  items.push(h2("10.4 Periodic Audit Recommendations"));
  items.push(bullet("Monthly: Review all expense entries for the prior month to confirm correct categories, supplier linkages, and amounts."));
  items.push(bullet("Monthly: Run Update Expenses and verify monitoring report totals for all active projects."));
  items.push(bullet("Quarterly: Review the Supplier Details report for duplicate or outdated entries and request corrections through your administrator."));
  items.push(bullet("Annually: Export all module data at year-end for archival. Confirm all pay periods in the Payroll Summary are complete. Review project statuses and update Accomplishment percentages."));

  // ──────────────────────────────────────────────────
  // SECTION 11: Troubleshooting
  // ──────────────────────────────────────────────────
  items.push(h1("11. Troubleshooting"));
  items.push(body("Use the table below to diagnose and resolve common issues. If a problem is not listed here or persists after following the suggested steps, contact your Finance System Administrator."));
  items.push(space());

  items.push(threeColTable([
    ["Cannot sign in", "Incorrect username or password; account may not exist.", "Double-check spelling. Use the Guest Register option if you are new. Contact your administrator for a password reset."],
    ["The login page will not load", "The application server may be offline or unreachable.", "Confirm your network connection. Contact IT support to verify the server is running."],
    ["Dashboard shows no data", "No records exist for the selected year, or the year filter is set incorrectly.", "Check the year displayed on the dashboard. Confirm that project monitoring reports exist for the year in question."],
    ["Update Expenses button is not visible", "You are signed in as a Guest user.", "Update Expenses requires Admin access. Contact your administrator."],
    ["Expense does not appear in monitoring report after Update Expenses", "The expense may not be linked to the correct Report/Project, or it was entered after the last update was run.", "Check the expense record in the Daily Expenses Report; verify the Project field is correctly set. Run Update Expenses again."],
    ["Project not appearing in expense form dropdown", "No monitoring report exists for that project in the current year.", "Create a Project Monitoring Report for the project first, then return to the expense form."],
    ["Profit figure shows as negative on monitoring report", "Total Expenses exceed the Amount Collected recorded for the project.", "Review the Amount Collected field on the monitoring report and confirm it reflects actual collections. Also verify that no expenses are incorrectly linked to this project."],
    ["Cannot edit a record", "You are signed in as a Guest, or you are trying to edit a record in a module where editing is restricted.", "Confirm your role is Admin. If you are an Admin and still cannot edit, contact your system administrator."],
    ["CSV export file is empty or contains no data", "No records match the current filters, or the selected year has no data.", "Reset filters to show all records. Check the year selection. Verify data exists for the period."],
    ["Supplier TIN field shows an error", "TIN format does not match the required format XXX-XXX-XXX-XXX.", "Re-enter the TIN using the correct format with hyphens separating each group of digits."],
    ["Page loads very slowly", "The report may contain a large number of records.", "Use the year and month filters to narrow the result set. Contact your administrator if slowness persists consistently."],
    ["Report ID already exists", "You entered a Report ID that is already in use by another report.", "Use a unique Report ID. Review existing reports to identify what IDs have been used."],
  ], [2600, 3400, 3360], ["Problem", "Possible Cause", "Suggested Solution"]));

  // ──────────────────────────────────────────────────
  // SECTION 12: Frequently Asked Questions
  // ──────────────────────────────────────────────────
  items.push(h1("12. Frequently Asked Questions"));

  const faqs = [
    ["Can a Guest user edit or delete data?", "No. Guest accounts are strictly read-only. Guests can view all reports and export data to CSV, but cannot create, modify, or delete any records. To gain editing access, your account must be set to Administrator by the system administrator."],
    ["How do I find a specific project?", "Use the search or filter function on any report page. You can search by project name, project ID, or report ID. On the Project Monitoring Report, the year filter will narrow results to reports for a specific year."],
    ["Where do payroll summaries appear?", "Payroll figures appear in the Payroll Summary Report under Reports > Payroll. They do not automatically appear in the Project Monitoring Report's expense columns. Finance managers must manually cross-reference payroll totals with the Labor Cost column on the monitoring report."],
    ["How do I correct an expense entry?", "Navigate to Reports > Daily Expenses, locate the incorrect entry using the filters, and click the Edit button (visible to Admins). Update the necessary fields and save. After correcting entries, run Update Expenses on the Project Monitoring Report to refresh the affected project's totals."],
    ["Why is the VAT calculated at 14% and not 12%?", "The system uses a fixed VAT rate of 14% as configured for this company's financial operations. If you believe the rate needs to be adjusted, contact your Finance System Administrator."],
    ["Can I enter historical data for previous years?", "Yes. The system stores data by year (and by year-month for daily expenses). You can select any year when entering records. Use the year and month fields in the expense forms to enter historical data for the correct period."],
    ["What happens to my data if I accidentally submit a form twice?", "Each form submission creates a new record. If you have entered a duplicate expense or report, an Admin user can locate and delete the duplicate record through the report view. Always review form data before submitting to avoid duplicates."],
    ["Can I export all reports at once?", "Currently, exports are done per report page. Navigate to each report section and click Export to CSV. Repeat for each report module as needed."],
    ["How do I add a new supplier when entering an expense?", "If the supplier is not in the dropdown list, type the supplier name in the Supplier field. The form will display additional fields for Supplier TIN and Address. Complete these fields and the supplier record will be created automatically when the expense is saved."],
    ["What does 'Balance to Be Collected' mean?", "Balance to Be Collected is the amount still owed by the client for a specific project. It is calculated automatically as the Contracted Amount minus the Amount Collected. Review and update the Amount Collected field on the monitoring report whenever a payment is received."],
    ["How often should Update Expenses be run?", "Update Expenses should be run at least once per month, before any management review or financial presentation. It is safe to run it more frequently — the process recalculates from all stored daily expenses, so running it multiple times does not cause duplicate counting."],
    ["Why does my project show zero expenses even though I entered daily costs?", "There are two common reasons. First, the daily expenses may not be correctly linked to the project's monitoring report. Check the Project/Report field on each expense entry. Second, Update Expenses may not have been run yet. Navigate to the Project Monitoring Report and click Update Expenses."],
  ];

  faqs.forEach(([q, a]) => {
    items.push(new Paragraph({
      spacing: { before: 160, after: 40 },
      children: [new TextRun({ text: "Q: " + q, bold: true, font: "Arial", size: 22 })]
    }));
    items.push(new Paragraph({
      spacing: { before: 40, after: 120 },
      indent: { left: 360 },
      children: [new TextRun({ text: "A: " + a, font: "Arial", size: 22 })]
    }));
  });

  // ──────────────────────────────────────────────────
  // SECTION 13: Support and Contact
  // ──────────────────────────────────────────────────
  items.push(h1("13. Support and Contact"));
  items.push(body("If you encounter an issue that is not resolved by this manual, contact the appropriate support point based on the nature of your inquiry."));
  items.push(space());

  items.push(twoColTable([
    ["Finance System Administrator", "User account management (creating, resetting, or upgrading accounts), access permissions, general system configuration, and data corrections requiring administrator intervention.\n\n[Insert Administrator Name and Contact Details]"],
    ["Accounting Department", "Questions about financial data accuracy, expense categorization policy, reporting requirements, and payroll cross-referencing.\n\n[Insert Accounting Department Contact Details]"],
    ["Technical Support / IT Department", "Server availability, application errors, browser compatibility issues, and network connectivity problems.\n\n[Insert IT Support Contact Details]"],
    ["Finance Manager (Senior)", "Escalated issues regarding incorrect financial totals, unauthorized data changes, or suspected data integrity problems.\n\n[Insert Finance Manager Contact Details]"],
  ], 2800, 6560, ["Support Contact", "When to Use and Contact Information"]));

  items.push(space());
  items.push(note("For urgent issues affecting financial data accuracy or system availability, contact the Finance System Administrator and Technical Support simultaneously."));
  items.push(space());

  items.push(h2("13.1 Reporting System Issues"));
  items.push(body("When reporting a system issue, provide the following information to help support staff resolve the problem quickly:"));
  items.push(space());
  items.push(bullet("Your name and user account role (Admin or Guest)."));
  items.push(bullet("The module you were using when the issue occurred (e.g., Daily Expenses form, Project Monitoring Report)."));
  items.push(bullet("A description of what you were trying to do."));
  items.push(bullet("The exact message or behavior you observed."));
  items.push(bullet("The date and time the issue occurred."));
  items.push(bullet("Any steps you have already tried to resolve the issue."));

  // ──────────────────────────────────────────────────
  // APPENDIX A — Expense Category Quick Reference
  // ──────────────────────────────────────────────────
  items.push(h1("Appendix A — Expense Category Quick Reference"));
  items.push(body("Use this table when selecting the Expense Type on the Daily Expenses form. The Category column shows what to select; the Monitoring Column shows where the total will appear on the Project Monitoring Report after Update Expenses is run."));
  items.push(space());

  items.push(threeColTable([
    ["Material Cost", "Materials, scaffolding rental, tools and equipment supplies", "Material Cost / Rental / Tools & Equips"],
    ["Coil Breakdown", "Coil-related materials or breakdown work", "Coil Breakdown"],
    ["Labor Cost", "On-site labor payments", "Labor Cost"],
    ["Company Outing", "13th month pay, Christmas expenses, company events", "Company Outing / 13th Month / Christmas"],
    ["Mandatories", "Government-mandated contributions and fees", "Mandatories"],
    ["Equipment / Power Tools", "Heavy equipment and power tool purchase or rental", "Equipment / Heavy Equip / Power Tools"],
    ["1601 C", "Compensation-related tax payments", "1601 C (Compensation)"],
    ["Vehicle / Diesel / Tollgate", "Fuel, maintenance, vehicle registration, tolls", "Diesel / Maintenance / Tollgate / Vehicles"],
    ["Equipment Maintenance", "Calibration and maintenance of equipment and vehicles", "Equipment / Vehicle Maintenance / Calibration"],
    ["SubCon", "Subcontractor payments and supplier fees", "SubCon Project Payment / Supplier"],
    ["House Rentals / Utilities", "Site rentals, utilities, maintenance", "House Rentals / Utilities / Maintenance"],
    ["Surety / Commission", "Surety bond and commission payments", "Surety Bond / Commission"],
    ["5% Commission", "Five-percent commission charges", "5% Commission"],
    ["VAT", "VAT payments (separate from auto-calculated VAT on expense line)", "12% VAT"],
    ["Medical / Insurance", "PPE, uniforms, medical expenses, medicines", "Uniforms / PPE / Medical / Medicines"],
    ["ISO Certification", "ISO certification-related expenses", "ISO Certification"],
    ["Others", "Meals, permits, professional fees, drawings, seminars, miscellaneous", "Others (Meals, PF, Permits, etc.)"],
  ], [2200, 4000, 3160], ["Select This Category", "Typical Expenses Included", "Appears in Monitoring Column"]));

  // ──────────────────────────────────────────────────
  // APPENDIX B — Glossary
  // ──────────────────────────────────────────────────
  items.push(h1("Appendix B — Glossary"));
  items.push(body("Definitions for terms used throughout this manual."));
  items.push(space());

  items.push(twoColTable([
    ["Admin / Administrator", "A user role with full access to all data entry, editing, deletion, and reporting functions."],
    ["Accomplishment", "A percentage value (0 to 100) recorded on a project monitoring report indicating how much of the project has been completed."],
    ["Amount Collected", "The total cash payments received from the client for a specific project, recorded on the monitoring report."],
    ["Balance to Be Collected", "The outstanding amount owed by the client. Calculated as Contracted Amount minus Amount Collected."],
    ["Cash Out", "The amount of money paid in a single daily expense transaction, before VAT."],
    ["Contracted Amount", "The total agreed value of the project contract."],
    ["CSV Export", "A function that downloads report data as a Comma-Separated Values file, suitable for opening in Microsoft Excel."],
    ["Daily Expenses", "Individual payment records entered for each project-related cash disbursement."],
    ["Expenses ID", "A system-generated identifier (format: EXP-XXXXXX) that links a project monitoring report to its aggregated expense detail record."],
    ["Expense Type / Category", "A classification applied to each daily expense that determines which column in the project monitoring report it is counted toward."],
    ["Guest", "A user role with read-only access to all reports. Cannot create, edit, or delete records."],
    ["Payroll", "Bi-monthly compensation payments recorded per project. Tracked in 24 pay periods per year."],
    ["Profit", "Calculated financial result per project. Formula: Amount Collected minus Total Expenses."],
    ["Project ID", "A short unique code identifying a project. Used to link expenses and payroll entries to the correct project report."],
    ["Project Monitoring Report", "The main financial summary record for a single project, including billing, expense categories, and profit."],
    ["Report ID", "A unique identifier assigned to each project monitoring report record."],
    ["Supplier ID", "A system-generated identifier for a vendor record (format: SUP-XXXXXX)."],
    ["Supplier TIN", "Supplier Tax Identification Number in the format XXX-XXX-XXX-XXX."],
    ["Total Expenses", "The sum of all 17 expense categories on a project monitoring report, updated when Update Expenses is run."],
    ["Update Expenses", "A function on the Project Monitoring Report that recalculates all expense category columns from the linked daily expense entries."],
    ["VAT", "Value Added Tax. Automatically calculated at 14% of the Cash Out amount on each daily expense entry."],
    ["\u20B1 (Philippine Peso)", "The currency used throughout the system for all monetary values."],
  ], 2800, 6560, ["Term", "Definition"]));

  // ──────────────────────────────────────────────────
  // APPENDIX C — Document History
  // ──────────────────────────────────────────────────
  items.push(h1("Appendix C — Document History"));
  items.push(twoColTable([
    ["1.0", "May 2026 — Initial release of the Company Budget Tracker User Manual. Covers all modules documented in the system as of Version 1.0."],
  ], 1200, 8160, ["Version", "Change Description"]));

  items.push(space(2));
  items.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "End of Document", italics: true, font: "Arial", size: 20, color: "888888" })]
  }));

  return items;
}

// ─── BUILD DOCUMENT ──────────────────────────────────────────────────────────
const doc = new Document({
  styles: {
    default: {
      document: { run: { font: "Arial", size: 22 } }
    },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: "1F4E79" },
        paragraph: { spacing: { before: 360, after: 180 }, outlineLevel: 0 }
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: "2E75B6" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 }
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: "2E4A7A" },
        paragraph: { spacing: { before: 180, after: 80 }, outlineLevel: 2 }
      },
    ]
  },
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }, {
          level: 1, format: LevelFormat.BULLET, text: "\u25CB", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1080, hanging: 360 } } }
        }]
      },
      {
        reference: "numbers",
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }, {
          level: 1, format: LevelFormat.LOWER_LETTER, text: "%2.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1080, hanging: 360 } } }
        }]
      },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    headers: {
      default: new Header({
        children: [new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "2E75B6", space: 1 } },
          children: [
            new TextRun({ text: "Company Budget Tracker  |  User Manual  |  Version 1.0", font: "Arial", size: 18, color: "555555" }),
          ]
        })]
      })
    },
    footers: {
      default: new Footer({
        children: [new Paragraph({
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: "2E75B6", space: 1 } },
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({ text: "Page ", font: "Arial", size: 18, color: "555555" }),
            new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 18, color: "555555" }),
            new TextRun({ text: " of ", font: "Arial", size: 18, color: "555555" }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], font: "Arial", size: 18, color: "555555" }),
          ]
        })]
      })
    },
    children: buildContent()
  }]
});

const path = require('path');
const outDir = path.join(__dirname);
const outFile = path.join(outDir, 'Expensio_Business_User_Manual.docx');

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outFile, buffer);
  console.log('Wrote:', outFile);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
