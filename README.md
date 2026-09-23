# CARNIX — Creation Lab Dashboard

A dental lab management dashboard replacing a shared Excel/notebook workflow with a
multi-user, mobile-friendly web app. Handles case tracking, billing with PDF invoices,
expense logging, P&L reporting, inventory, and a full admin control panel.

**Live:** https://carnix.pages.dev
**Repo:** https://github.com/YugalDoddamani/CARNIX (private)

---

## Stack

| Layer | Choice |
|---|---|
| Frontend | HTML5 + CSS3 + Vanilla JS (ES modules, no build step) |
| Backend / Auth / DB | Supabase (PostgreSQL + GoTrue + Storage) |
| Hosting | Cloudflare Pages (auto-deploy from `main`) |
| Charts | Chart.js 4 (CDN) |
| PDF | jsPDF 2.5 + jspdf-autotable 3.8 (CDN) |
| Auth key | Legacy anon JWT (`eyJ...`) for client compatibility |

No bundler. No framework. Cloudflare Pages serves files directly from the repo.

---

## Features

### Authentication
- Supabase email/password auth
- Session guard on `/app.html`
- Auto-logout on token expiry
- Login page: WebGL smokey background, glass card, floating-label inputs

### Roles
- **admin** — full access
- **tech** — case entry and work queue only
- Role gating via `body.is-admin` + `.admin-only` CSS
- Signup trigger forces `role = 'tech'` (privilege-escalation fix)

### Dashboard (`#/`)
- 4 KPI cards
- 14-day case volume chart
- Snapshot panel (due today / tomorrow / delivered / all-time)
- Recent cases table (flat list on mobile)
- Due next 7 days + Overdue lists

### Cases (`#/cases`)
- Stats row + filter chips (All / In Queue / Overdue / Delivered / Unpaid)
- Search by doctor, case type, patient ID
- Desktop table + mobile flat list
- Detail modal with stages, notes, deliver/reopen
- Edit modal with stage add/remove
- Two-step delete confirmation
- Kebab menu per row

### Case stages
- One case → N stages (case_type, qty, unit_price per stage)
- Price snapshotted at entry
- Total = sum of stage amounts (Postgres generated column)

### Billing (`#/billing`)
- Doctor + date range filter, "Uninvoiced only" toggle
- Live preview with line items and grand total
- Sequential invoice numbering (`CARNIX-YYYY-NNNN`)
- PDF export with logo, line items, payment details, UPI QR
- Payment reconciliation (mark paid/unpaid)
- Delete invoice → cases unlocked for re-invoicing

### Expenses (`#/expenses`)
- Stats row, category chips, month filter, search
- Add/edit modal with vendor, category, payment type, paid from, asset flag

### P&L (`#/pl`)
- Year selector
- Income / expenses / net profit KPIs
- Income vs expenses chart
- Monthly breakdown table with margins
- Expense category bar breakdown

### Inventory (`#/inventory`)
- Stats (total, low, out, categories)
- Inline +/- quantity adjust
- Add/edit form with min thresholds

### Price List (`#/price-list`)
- Master case type catalog
- Add/edit/delete with active toggle

### Control Panel (`#/control-panel`) — admin only
- **Overview**: storage used, DB size, table rows, business snapshot
- **Settings**: bank details, UPI ID, contact, invoice prefix, storage quota, QR upload
- **Users**: change roles

All settings flow into invoice PDFs via the `settings` table.

---

## File structure
CARNIX/
├── index.html Login page
├── app.html App shell
├── README.md
├── SUMMARY.md
├── memory.md
├── .gitignore
├── .env.example
├── _headers Cloudflare security + caching
├── _redirects
├── functions/
│ └── _middleware.js Injects window.ENV at runtime
├── assets/
│ ├── logo.webp
│ ├── bill-logo.webp Used in invoice PDFs
│ ├── upi-qr.webp UPI QR (optional)
│ ├── css/
│ │ ├── variables.css Design tokens
│ │ ├── auth.css Login screen
│ │ ├── app.css Shell + components
│ │ └── skeleton.css Loading skeletons
│ └── js/
│ ├── supabase.js Client init (env-only, no fallback)
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
├── 001_schema.sql
├── 002_seed_price_list.sql
├── 003_case_stages.sql
├── 004_invoice_numbering.sql
├── 005_rls_fixes.sql
├── 006_expenses_extended.sql
├── 007_control_panel.sql
├── 008_branding_bucket.sql
└── 009_harden_signup_trigger.sql

text

---

## Database

| Table | Purpose |
|---|---|
| `users` | Mirrors `auth.users`, adds `name` + `role` |
| `cases` | Case header |
| `case_stages` | Line items per case |
| `price_list` | Master case type catalog |
| `expenses` | Expense log |
| `inventory` | Materials + thresholds |
| `invoices` | Sequential invoices |
| `invoice_items` | Line items per invoice |
| `settings` | Single-row config |

RLS enabled everywhere. Admin-only tables (`expenses`, `invoices`, `settings`) gated by `public.is_admin()`. Cases and stages readable/writable by any authenticated user; deletes admin-only.

**RPCs:**
- `next_invoice_number(year)`
- `get_storage_stats()`
- `get_database_stats()`
- `get_activity_stats()`

**Storage:** `branding` bucket (public) for logo + QR uploads.

---

## Environment setup

Runtime env is injected by `functions/_middleware.js` from Cloudflare Pages
environment variables into `window.__ENV__` on every HTML response.

### Cloudflare Pages env vars

Set in **Pages → carnix → Settings → Environment variables** for
**Production** and **Preview**:
SUPABASE_URL = https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY = eyJ... (legacy anon key) OR sb_publishable_...

text

> **Note:** `sb_publishable_...` requires `@supabase/supabase-js@2.58.0` or later.
> The current client is pinned at `2.39.7` for stability, so the legacy `eyJ...`
> anon JWT is used in production. Both formats work with all client versions for
> the legacy key; only the newer client accepts the new key format.

### Verifying env is set correctly

Open DevTools Console on `carnix.pages.dev/app`:

```js
window.__ENV__
Should print { SUPABASE_URL: "...", SUPABASE_PUBLISHABLE_KEY: "..." }.

If it prints undefined, the middleware isn't running or the Cloudflare env
vars are missing.

Deploy
Push to main. Cloudflare Pages auto-deploys in ~30 seconds.

Force rebuild without code changes: ⋯ on the latest deployment → Retry deployment.

Cache-bust a specific asset: add ?v=2 query string in HTML.

Setup from scratch
Create Supabase project

Run sql/001_schema.sql then migrations 002–009 in order in SQL Editor

Seed price_list with sql/002_seed_price_list.sql

Create admin user in Authentication → Users

Set role = 'admin' for that user in users table

Create Cloudflare Pages project connected to repo (build empty, output /)

Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY env vars

Deploy

Design tokens
Token	Value	Usage
--bg	#0D0E11	Page background
--surface	#16181D	Cards
--primary	#1F3A93	Brand navy (buttons, links)
--primary-soft	#E8EDFF	Soft backgrounds
--danger	#8B1E3F	Overdue, unpaid, low stock
--success	#1E7A4C	Delivered, in-stock
--warning	#B7791F	Pending, low stock warning
--sidebar-w	240px	Desktop sidebar width
--bottom-nav-h	60px	Mobile bottom nav height
Known issues / TODO
□ Historical BILL IO import (586 rows)
□ Pagination on all lists (currently .limit(500))
□ Server-side search
□ Service worker for offline support
□ CSS cleanup pass — app.css has accumulated duplicate rules
□ Some color-scheme and cascade issues remain
□ WebGL login loop doesn't pause on hidden tab
□ No prefers-reduced-motion opt-out on login animations
□ Touch targets below 44px on some controls (stock ±26px, kebab 32px)
□ iOS auto-zoom on sub-16px input fonts
Notes
Price snapshots: case_stages.unit_price copied at case creation. Changing
the price list later never modifies existing cases.

Invoice numbering: sequential per year via Postgres sequence.

PDF output: jsPDF + autotable. Bank details and QR come from settings.

No build step: files served as-is.

Login background: WebGL shader in index.html, no external dependency.

License
Private. Not for redistribution.

text

---

## File 2: `SUMMARY.md`

```md
# CARNIX — Project Summary

_Last updated: 23 September 2026_

Dental lab management dashboard for Creation Lab. Replaces the single-user Excel
workflow (`Carnix.xlsx`) with a multi-user, mobile-friendly web app.

**Live:** https://carnix.pages.dev
**Repo:** https://github.com/YugalDoddamani/CARNIX
**Supabase:** `istkdonjcfzrzpsqxmqb` (Northeast Asia — Tokyo)

---

## Stack

| Layer | Choice |
|---|---|
| Frontend | HTML5 + CSS3 + Vanilla JS (ES modules, no build step) |
| Auth / DB | Supabase (PostgreSQL + GoTrue + RLS + Storage) |
| Hosting | Cloudflare Pages (auto-deploy from `main`) |
| Charts | Chart.js 4 (CDN) |
| PDF | jsPDF 2.5 + jspdf-autotable 3.8 (CDN) |

No bundler. No framework. No CI. Files served directly from the repo.

---

## Status at a glance

| Module | Status | Notes |
|---|---|---|
| Auth (login/logout) | ✅ Done | Supabase email/password, session guard |
| Login design | ✅ Done | WebGL smokey background, glass card, floating labels |
| Role-based access | ✅ Done | `admin` / `tech` via `users.role` |
| App shell | ✅ Done | Sidebar + topbar + bottom nav + hash router |
| Skeleton loaders | ✅ Done | Per-route skeleton shapes |
| Dashboard | ✅ Done | KPIs, chart, snapshot, lists |
| Cases list | ✅ Done | Desktop table + mobile flat list, filters, search |
| Case create | ✅ Done | Multi-stage, auto-price, date picker on click |
| Case detail | ✅ Done | Modal view, notes, deliver/reopen |
| Case edit | ✅ Done | Prefilled, stage add/remove |
| Case delete | ✅ Done | Two-step confirm |
| Billing | ✅ Done | Invoice generator + PDF + reconciliation |
| Expenses | ✅ Done | Form + list + categories |
| P&L | ✅ Done | Chart + monthly table + category breakdown |
| Inventory | ✅ Done | Inline +/- with optimistic UI |
| Price List | ✅ Done | CRUD with active toggle |
| Control Panel | ✅ Done | Settings + storage stats + user roles + QR upload |
| Mobile layout | 🟡 Partial | Nav safe-area, table flattening, input zoom pending |
| Historical import | ⬜ Not started | 586 rows from `BILL IO` |
| Offline support | ⬜ Not started | Service worker deferred |

---

## What's shipped

### Login page
- WebGL shader background (navy wave field), runs on canvas
- Glass card with backdrop blur, soft border
- Floating-label inputs (label floats on focus/fill)
- Arrow-slide button, matches brand navy

### Dashboard
- 4 KPI cards: Active / Overdue / Unpaid / Delivered this month
- 14-day case volume bar chart
- Snapshot panel: due today / tomorrow / delivered total / all-time
- Recent cases table (top 6)
- Due next 7 days + Overdue side-by-side lists

### Cases
- Desktop: full data table with columns
- Mobile: flat list with thin dividers
- Detail modal: doctor, patient, dates, stages, notes, actions
- Stage repeater on create + edit
- Price auto-fills from `price_list` on selection
- Two-step delete

### Billing
- Doctor + date range query
- "Uninvoiced only" toggle
- Live preview with line items + grand total
- Sequential invoice numbers: `CARNIX-2026-0001`
- PDF with logo, table, bank details, UPI QR
- Mark paid / unpaid (updates linked cases)
- Delete invoice (unlocks cases for re-invoicing)

### Money out
- Expenses: full CRUD with categories, vendors, payment types
- P&L: year selector, monthly income/expenses/net, category breakdown

### Admin
- Control Panel with three tabs
- Storage / DB stats via RPCs
- Settings editable → feed into invoice PDFs
- QR upload to Supabase Storage (`branding` bucket)
- User role management

---

## Recent fixes (23 September 2026)

### Security & correctness
- Removed hardcoded Supabase key from `supabase.js` — now env-only
- Restored `functions/_middleware.js` (was corrupted with supabase.js content)
- Verified `window.__ENV__` is populated by middleware
- Switched to legacy anon key for client compatibility

### Mobile
- Fixed body grid: `display: block` on mobile (was still desktop 2-column grid)
- Bottom nav safe-area padding on iPhone
- Dashboard + P&L summary tables flattened to lists
- Added `data-label` attributes so mobile cells have context

### Login
- Ported smokey WebGL background to vanilla
- Glass card design, floating-label inputs

### Loading
- Per-route skeleton screens (dashboard, cases, billing, expenses, pl, inventory, price-list, control-panel)

---

## Known issues

### Layout
- `.main-col` still has some cascade conflicts — needs a cleanup pass
- Some mobile spacing feels tight

### Mobile polish
- Bottom nav safe-area math only partially fixed
- iOS auto-zoom on sub-16px input fonts
- Touch targets below 44px on some controls (stock ±26px, kebab 32px)
- `showPicker()` fires on touch → double-picker on some browsers
- Full-screen modal headers not sticky
- No tap feedback on most interactive elements

### Assets
- `billing.js` references `/assets/bill-logo.webp` but file is `BILL LOGO.webp` (spaces)
- `pdf-helpers.js` fallback path `/assets/upi-qr.webp` but file is `PAYQR.webp`
- Old `logo.png` + `bill-logo.png` still shipped (dead weight)

### Data
- No historical `BILL IO` import
- `.limit(500)` truncates lists silently
- No pagination

### CSS
- `app.css` is ~2,200 lines with duplicate rules from iterative patches
- Recommended: single-breakpoint refactor at some point

---

## Roadmap

### Phase 1 — Finish mobile polish (current)
1. Fix asset paths (`bill-logo.webp`, `upi-qr.webp`)
2. Commit missing SQL migrations (003–009) to repo
3. Safe-area nav math (add safe area to height, not padding)
4. iOS 16px input minimum
5. Touch targets ≥44px
6. `showPicker()` guard for touch
7. Tap feedback (`:active` states, `touch-action: manipulation`)

### Phase 2 — Data
1. Historical `BILL IO` import
2. Pagination
3. Server-side search
4. Price-list caching

### Phase 3 — Polish
1. CSS cleanup pass (deduplicate, single breakpoint)
2. Accessibility pass (contrast, heading order)
3. Lighthouse improvements (lazy-load jsPDF, preconnect)

### Phase 4 — Optional
1. Service worker for offline
2. CSV export
3. Audit log
4. Multi-lab support

---

## Commit conventions

- `feat(scope): what` — new feature
- `fix(scope): what` — bug fix
- `chore(scope): what` — tooling
- `style(scope): what` — CSS only
- `docs(scope): what` — docs
