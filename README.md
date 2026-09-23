# CARNIX — Creation Lab Dashboard

A dental lab management dashboard replacing a shared Excel/notebook workflow with a
multi-user, mobile-friendly web app. Handles case tracking, billing with PDF invoices,
expense logging, P&L reporting, inventory, and a full admin control panel.

**Live:** https://carnix.pages.dev
**Repo:** https://github.com/YugalDoddamani/CARNIX

---

## Stack

| Layer | Choice |
|---|---|
| Frontend | HTML5 + CSS3 + Vanilla JS (ES modules, no build step) |
| Backend / Auth / DB | Supabase (PostgreSQL + GoTrue + Storage) |
| Hosting | Cloudflare Pages (auto-deploy from `main`) |
| Charts | Chart.js 4 (CDN) |
| PDF | jsPDF 2.5 + jspdf-autotable 3.8 (CDN) |

No bundler. No framework. Cloudflare Pages serves files directly from the repo.

---

## Features

### Authentication
- Supabase email/password auth
- Session guard on `/app.html`
- Auto-logout on token expiry
- Glassmorphism login with WebGL smokey background

### Roles
- **admin** — full access
- **tech** — case entry and work queue only
- Role gating via `body.is-admin` + `.admin-only` CSS

### Dashboard (`#/`)
- 4 KPI cards (active cases, overdue, unpaid, delivered this month)
- 14-day case volume chart (Chart.js)
- Snapshot panel (due today / tomorrow / delivered / all-time)
- Recent cases table
- Due next 7 days + Overdue side-by-side lists

### Cases (`#/cases`)
- Stats row + filter chips (All / In Queue / Overdue / Delivered / Unpaid)
- Search by doctor, case type, patient ID
- Desktop table + mobile flat list
- Detail modal with stages, notes, deliver/reopen
- Edit modal with stage add/remove
- Two-step delete confirmation
- Kebab menu per row

### Case stages
- One case → N stages (each with own case_type, qty, unit_price)
- Price snapshotted at entry (uses `price_list` at insert time)
- Total = sum of stage amounts (Postgres generated column)

### Billing (`#/billing`)
- Doctor + date range filter, "Uninvoiced only" toggle
- Live preview with line items and grand total
- Sequential invoice numbering (`CARNIX-YYYY-NNNN`)
- PDF export with logo, line items table, payment details, UPI QR
- Payment reconciliation (mark paid/unpaid)
- Delete invoice → cases unlocked for re-invoicing

### Expenses (`#/expenses`)
- Stats row (this month, entries, total, assets)
- Category chips + month filter + search
- Add/edit modal with vendor, category, payment type, paid from, asset flag

### P&L (`#/pl`)
- Year selector
- Income / expenses / net profit KPIs
- Income vs expenses bar chart per month
- Monthly breakdown table with margins
- Expense categories bar breakdown

### Inventory (`#/inventory`)
- Stats (total, low stock, out of stock, categories)
- Inline +/- quantity adjust with optimistic UI
- Filter chips for low/out
- Add/edit form with min thresholds

### Price List (`#/price-list`)
- Master case type catalog
- Add/edit/delete
- Active/inactive toggle

### Control Panel (`#/control-panel`) — admin only
- **Overview**: storage used, database size, table row counts, business snapshot
- **Settings**: bank details, UPI ID, contact info, invoice prefix, storage quota, QR upload
- **Users**: change roles

All settings flow into invoice PDFs via the `settings` table.

---

## File structure
