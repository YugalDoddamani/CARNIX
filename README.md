# CARNIX

Practice dashboard for Creation Lab, a dental lab. This replaced a shared Excel
file and a paper notebook: case tracking, billing with PDF invoices, expenses,
P&L, inventory, and an admin panel. Built for a handful of lab users, not the
public internet.

**Live:** https://carnix.pages.dev

## Stack

- Plain HTML/CSS/JS, ES modules. No framework, no bundler, no build step.
- Supabase — Postgres, auth, storage, row-level security.
- Cloudflare Pages — serves the repo as-is; `functions/_middleware.js` injects
  the Supabase URL/key into HTML at runtime so nothing secret is committed.
- Chart.js 4 and jsPDF + autotable from CDN.

## The eight screens

| Route | What it is | Who |
|---|---|---|
| `#/` | Dashboard — KPIs, 14-day volume chart, due-soon/overdue lists | all |
| `#/cases`, `#/cases/new` | Case entry with multiple priced stages per case | all |
| `#/billing` | Per-doctor invoices for a date range, PDF export, mark paid | admin |
| `#/expenses` | Expense log with categories, vendors, paid-from accounts | admin |
| `#/pl` | Yearly P&L: monthly income vs expenses, category breakdown | admin |
| `#/inventory` | Stock levels with min thresholds, inline +/- adjust | all |
| `#/price-list` | Master price catalog; stages snap the price at entry time | admin |
| `#/control-panel` | Lab settings, UPI QR upload, storage/DB stats, user roles | admin |

Two roles: `admin` (everything) and `tech` (cases + inventory only), enforced
by CSS gating in the UI and RLS policies in the database.

## How billing works

A case has one or more stages (e.g. Cast pour × 2, Relining × 1). Each stage
copies its unit price from the price list at entry time, so later price changes
never rewrite history. Billing collects a doctor's uninvoiced cases in a date
range, snapshots the line items into an invoice, numbers it sequentially per
year (`next_invoice_number` RPC), and marks the cases as invoiced. Deleting an
invoice unlocks its cases for re-invoicing. Invoices render as a PDF with the
lab logo, bank details and UPI QR from the `settings` table.

## Setup

1. Supabase project → run `sql/001_schema.sql`, then `sql/002_seed_price_list.sql`.
2. Cloudflare Pages → connect the repo, build command empty, output dir `/`.
3. Set env vars for Production *and* Preview:
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY` (legacy `eyJ...` or `sb_publishable_...`;
     the client is `supabase-js@2.58.0`, which accepts both)
4. Create the first user in Supabase Auth, then set `role = 'admin'` in the
   `users` table (new signups are forced to `tech` by trigger).

Pushes to `main` auto-deploy in ~30s. To check env injection, run
`window.__ENV__` in the console on `/app` — it should print both values.

## Repo layout

```
index.html            login page (WebGL smoke background, vanilla JS)
app.html              app shell: sidebar, topbar, mobile bottom nav
functions/
  _middleware.js      injects window.__ENV__ into HTML responses
assets/
  logo.webp           sidebar/login logo
  BILL LOGO.webp      invoice PDF logo
  PAYQR.webp          UPI QR
  css/                variables (tokens), auth, app, skeleton
  js/
    supabase.js       client init — env-only, no fallback key
    app.js            auth guard, hash router, per-route skeletons
    pdf-helpers.js    image + settings loaders for PDFs
    pages/            one module per screen
sql/
  001_schema.sql      tables + RLS + triggers
  002_seed_price_list.sql
```

## Known issues / TODO

Honest list, roughly in the order I plan to fix them:

- Migrations 003–009 (case_stages, invoice numbering, RLS fixes, control
  panel, branding bucket, hardened signup trigger) are applied on the live
  Supabase project but not yet committed to `sql/` here.
- `billing.js` references `/assets/bill-logo.webp`, but the file on disk is
  `BILL LOGO.webp` (spaces) — invoices currently fall back to a text logo.
  Same story for the QR (`PAYQR.webp` vs the `upi-qr.webp` fallback path).
- `app.css` has three generations of layout code and duplicate rules from
  iterative mobile fixes — needs a dedupe pass with a single breakpoint.
- Mobile polish: iOS zooms on sub-16px inputs, stock ±/kebab buttons are
  under 44px touch targets, `showPicker()` fires on touch.
- The WebGL login loop never pauses on hidden tabs; no reduced-motion opt-out.
- Lists are capped (500 cases / 1000 expenses) with no pagination yet.
- Historical import of the old `BILL IO` sheet (586 rows) not started.

Private project.
