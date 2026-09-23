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
CARNIX/
├── index.html Login page
├── app.html App shell (sidebar + topbar + bottom nav)
├── README.md
├── SUMMARY.md
├── memory.md
├── .gitignore
├── .env.example
├── _headers Cloudflare security + caching
├── _redirects
├── functions/
│ └── _middleware.js Injects window.ENV from Cloudflare vars
├── assets/
│ ├── logo.png
│ ├── bill-logo.png Used in invoice PDFs
│ ├── upi-qr.png Optional
│ ├── css/
│ │ ├── variables.css Design tokens
│ │ ├── auth.css Login screen
│ │ ├── app.css Shell + components
│ │ └── skeleton.css Loading skeletons
│ └── js/
│ ├── supabase.js Client init
│ ├── app.js Auth guard + router + skeletons
│ ├── pdf-helpers.js Image loader + settings loader
│ └── pages/
│ ├── dashboard.js
│ ├── cases.js
│ ├── billing.js
│ ├── expenses.js
│ ├── pl.js
│ ├── inventory.js
│ ├── price-list.js
│ └── control-panel.js
└── sql/
├── 001_schema.sql Base schema
├── 002_seed_price_list.sql 65-item price list
├── 003_case_stages.sql Multi-stage model
├── 004_invoice_numbering.sql Sequence + function
├── 005_rls_fixes.sql
├── 006_expenses_extended.sql
├── 007_control_panel.sql Settings table + RPCs
├── 008_branding_bucket.sql Storage bucket + quota column
└── 009_harden_signup_trigger.sql

text

---

## Database

| Table | Purpose |
|---|---|
| `users` | Mirrors `auth.users`, adds `name` + `role` |
| `cases` | Case header (doctor, patient, dates, status, payment flag) |
| `case_stages` | Line items per case (case_type, qty, unit_price) |
| `price_list` | Master case type catalog |
| `expenses` | Expense log |
| `inventory` | Lab materials + min thresholds |
| `invoices` | Generated invoices with sequential numbers |
| `invoice_items` | Line items per invoice |
| `settings` | Single-row config for bank/UPI/contact/invoice |

Row Level Security is enabled on every table. Admin-only tables (`expenses`, `invoices`, `settings`) are gated by `public.is_admin()`. Cases and stages are readable/writable by any authenticated user; deletes are admin-only.

RPCs:
- `next_invoice_number(year)` — sequential numbering
- `get_storage_stats()` — storage bytes + file counts by bucket
- `get_database_stats()` — DB size, table sizes, row counts
- `get_activity_stats()` — business totals

---

## Environment setup

The app reads Supabase credentials from `window.__ENV__`, injected at runtime by
`functions/_middleware.js` from Cloudflare Pages environment variables.

### Cloudflare Pages env vars

Set in **Pages → carnix → Settings → Environment variables** for both Production and Preview:
SUPABASE_URL = https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY = sb_publishable_...

text

### Local development

Serve the repo root with any static server (`npx serve`, `python -m http.server`, etc.).
Set `window.__ENV__` manually in dev tools or add a local `functions/` override if you
want to avoid committing real credentials.

**Do not commit real Supabase keys.** `.env.example` contains placeholders only.

---

## Deploy

Push to `main` on GitHub. Cloudflare Pages builds and deploys automatically within ~30 seconds.

Check deployment: **Cloudflare → Pages → carnix → Deployments**.

Force a rebuild without code changes: **⋯ on the latest deployment → Retry deployment**.

---

## Setup from scratch

1. Create a Supabase project
2. Run `sql/001_schema.sql` and the subsequent migrations in order in the SQL Editor
3. Seed `price_list` with `sql/002_seed_price_list.sql`
4. Create your first admin user in **Authentication → Users**
5. Manually set `role = 'admin'` for that user in the `users` table
6. Create a Cloudflare Pages project connected to the repo (build command empty, output `/`)
7. Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` env vars
8. Deploy

---

## Roadmap

- [ ] Historical import from `BILL IO` (586 rows from the legacy Excel)
- [ ] Pagination for large datasets (currently `.limit(500)` on most queries)
- [ ] Server-side search
- [ ] Offline support via service worker
- [ ] Design polish pass on mobile
- [ ] CSS cleanup — consolidate the accumulated patches into a single maintainable file

---

## Notes

- **Price snapshots**: `case_stages.unit_price` is copied at case creation. Changing the price list later never modifies existing cases or invoices.
- **Invoice numbering**: sequential per year via Postgres sequence. `CARNIX-2026-0001`, `0002`, etc.
- **PDF output**: uses `html2pdf`-style rendering with jsPDF + autotable. Bank details and UPI QR come from the `settings` table via the Control Panel.
- **No build step**: files are served as-is from Cloudflare Pages. Vanilla JS modules load from CDN for Supabase, Chart.js, and jsPDF.

---

## License

Private. Not for redistribution.
