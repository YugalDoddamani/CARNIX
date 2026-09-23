import { supabase } from './supabase.js';
import { renderPriceList, wirePriceList } from './pages/price-list.js';
import { renderCases, wireCases, renderNewCase, wireNewCase } from './pages/cases.js';
import { renderDashboard, wireDashboard } from './pages/dashboard.js';
import { renderBilling, wireBilling } from './pages/billing.js';
import { renderExpenses, wireExpenses } from './pages/expenses.js';
import { renderPL, wirePL } from './pages/pl.js';
import { renderInventory, wireInventory } from './pages/inventory.js';
import { renderControlPanel, wireControlPanel } from './pages/control-panel.js';

// ============================================================
// Skeleton loaders — one per route
// ============================================================
function repeat(n, html) {
  return Array.from({ length: n }, () => html).join('');
}

function skeletonFor(key) {
  // Shared page header
  const header = `
    <div class="sk-page-header">
      <div class="sk sk-line-lg sk-w-25"></div>
      <div class="sk sk-pill"></div>
    </div>
  `;

  const kpiRow = `
    <div class="sk-kpi-row">
      ${repeat(4, `
        <div class="sk-kpi">
          <div class="sk sk-line-sm"></div>
          <div class="sk sk-line-lg"></div>
          <div class="sk sk-line-sm sk-w-40"></div>
        </div>
      `)}
    </div>
  `;

  const tableRows = (cols = 5, rows = 6) => `
    <div class="sk-table">
      <div class="sk-table-head">
        ${repeat(cols, '<div class="sk sk-line-sm"></div>')}
        <div></div>
      </div>
      ${repeat(rows, `
        <div class="sk-table-row">
          ${repeat(cols, '<div class="sk sk-line"></div>')}
          <div class="sk sk-circle" style="width:20px;height:20px"></div>
        </div>
      `)}
    </div>
  `;

  const listRows = (rows = 5) => `
    <div class="sk-list">
      ${repeat(rows, `
        <div class="sk-list-row">
          <div class="sk-list-left">
            <div class="sk sk-line-sm"></div>
            <div class="sk sk-line"></div>
          </div>
          <div class="sk sk-pill" style="width:80px"></div>
        </div>
      `)}
    </div>
  `;

  // ---- Per-route layout ----
  switch (key) {
    case '':
      return `
        <div class="sk-page">
          ${header}
          ${kpiRow}
          <div class="sk-dash-main">
            <div class="sk-chart-box">
              <div class="sk sk-line" style="width:120px"></div>
              <div class="sk sk-box sk-chart-area"></div>
            </div>
            <div class="sk-snapshot-col">
              ${repeat(4, `
                <div class="sk-snapshot-item">
                  <div class="sk sk-line-sm"></div>
                  <div class="sk sk-line-lg"></div>
                </div>
              `)}
            </div>
          </div>
          ${listRows(4)}
          <div class="sk-two-col">
            <div class="sk-card sk-stack">
              <div class="sk sk-line" style="width:140px"></div>
              ${repeat(3, '<div class="sk sk-line sk-w-75"></div>')}
            </div>
            <div class="sk-card sk-stack">
              <div class="sk sk-line" style="width:100px"></div>
              ${repeat(3, '<div class="sk sk-line sk-w-75"></div>')}
            </div>
          </div>
        </div>
      `;

    case 'cases':
      return `
        <div class="sk-page">
          ${header}
          ${kpiRow}
          <div class="sk-toolbar">
            ${repeat(5, '<div class="sk sk-pill"></div>')}
            <div class="sk sk-pill wide" style="margin-left:auto"></div>
          </div>
          ${tableRows(6, 8)}
        </div>
      `;

    case 'cases/new':
      return `
        <div class="sk-page">
          ${header}
          <div class="sk-card sk-stack">
            <div class="sk sk-line" style="width:120px"></div>
            <div class="sk sk-box" style="height:56px"></div>
            <div class="sk sk-box" style="height:56px"></div>
            <div class="sk sk-box" style="height:56px"></div>
          </div>
          <div class="sk-card sk-stack">
            <div class="sk sk-line" style="width:80px"></div>
            <div class="sk sk-box" style="height:120px"></div>
          </div>
        </div>
      `;

    case 'billing':
      return `
        <div class="sk-page">
          <div class="sk-card">
            <div class="sk-kpi-row">
              ${repeat(3, '<div class="sk sk-box" style="height:56px"></div>')}
              <div class="sk sk-box" style="height:56px"></div>
            </div>
          </div>
          <div class="sk-card sk-stack">
            <div class="sk sk-line" style="width:100px"></div>
            ${tableRows(5, 3)}
          </div>
          ${listRows(4)}
        </div>
      `;

    case 'expenses':
      return `
        <div class="sk-page">
          ${header}
          ${kpiRow}
          <div class="sk-toolbar">
            ${repeat(6, '<div class="sk sk-pill"></div>')}
            <div class="sk sk-pill wide" style="margin-left:auto"></div>
          </div>
          ${tableRows(6, 6)}
        </div>
      `;

    case 'pl':
      return `
        <div class="sk-page">
          ${header}
          ${kpiRow}
          <div class="sk-chart-box">
            <div class="sk sk-line" style="width:160px"></div>
            <div class="sk sk-box" style="height:260px"></div>
          </div>
          <div class="sk-two-col">
            <div class="sk-card sk-stack">
              <div class="sk sk-line" style="width:140px"></div>
              ${repeat(6, '<div class="sk sk-line"></div>')}
            </div>
            <div class="sk-card sk-stack">
              <div class="sk sk-line" style="width:120px"></div>
              ${repeat(4, '<div class="sk sk-line sk-w-75"></div>')}
            </div>
          </div>
        </div>
      `;

    case 'inventory':
      return `
        <div class="sk-page">
          ${header}
          ${kpiRow}
          <div class="sk-toolbar">
            ${repeat(3, '<div class="sk sk-pill"></div>')}
            <div class="sk sk-pill wide" style="margin-left:auto"></div>
          </div>
          ${tableRows(6, 7)}
        </div>
      `;

    case 'price-list':
      return `
        <div class="sk-page">
          ${header}
          ${tableRows(5, 9)}
        </div>
      `;

    case 'control-panel':
      return `
        <div class="sk-page">
          <div class="sk-toolbar">
            ${repeat(3, '<div class="sk sk-pill"></div>')}
          </div>
          ${kpiRow}
          <div class="sk-card sk-stack">
            <div class="sk sk-line" style="width:120px"></div>
            <div class="sk sk-line sk-w-50"></div>
          </div>
          <div class="sk-two-col">
            <div class="sk-card sk-stack">
              ${repeat(4, '<div class="sk sk-line sk-w-75"></div>')}
            </div>
            <div class="sk-card sk-stack">
              ${repeat(4, '<div class="sk sk-line sk-w-75"></div>')}
            </div>
          </div>
        </div>
      `;

    default:
      return `
        <div class="sk-page">
          ${header}
          ${kpiRow}
          ${tableRows(5, 5)}
        </div>
      `;
  }
}


// ---------- Auth guard ----------
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  window.location.replace('/');
  throw new Error('Not authenticated');
}

// ---------- Profile ----------
const { data: profile, error: profileError } = await supabase
  .from('users')
  .select('name, role, email')
  .eq('id', session.user.id)
  .maybeSingle();

if (profileError) console.error('Profile fetch error:', profileError);

const user = profile ?? {
  name: session.user.email,
  role: 'tech',
  email: session.user.email,
};

document.body.classList.toggle('is-admin', user.role === 'admin');

const userInfoEl = document.getElementById('user-info');
if (userInfoEl) {
  userInfoEl.innerHTML = `
    <div>Signed in as</div>
    <strong style="color:var(--text);">${escapeHtml(user.name)}</strong>
    <div>Role: ${escapeHtml(user.role)}</div>
  `;
}

// ---------- Routes ----------
const routes = {
  '':           { title: 'Dashboard',  render: renderDashboard },
  'cases':      { title: 'Cases',      render: renderCases },
  'cases/new':  { title: 'New Case',   render: renderNewCase },
  'billing':    { title: 'Billing',    render: renderBilling,    adminOnly: true },
  'expenses':   { title: 'Expenses',   render: renderExpenses,   adminOnly: true },
  'pl':         { title: 'P&L',        render: renderPL,         adminOnly: true },
  'price-list': { title: 'Price List', render: renderPriceList,  adminOnly: true },
  'inventory':  { title: 'Inventory',  render: renderInventory },
  'control-panel': { title: 'Control Panel', render: renderControlPanel, adminOnly: true },

};

function currentRoute() {
  return window.location.hash.replace(/^#\/?/, '').split('?')[0];
}

// ---------- Progress bar helpers ----------
function progressStart() {
  const bar = document.getElementById('route-progress');
  if (!bar) return;
  bar.classList.remove('done');
  bar.classList.remove('active');
  void bar.offsetWidth; // force reflow so transition restarts
  bar.classList.add('active');
}
function progressDone() {
  const bar = document.getElementById('route-progress');
  if (!bar) return;
  bar.classList.remove('active');
  bar.classList.add('done');
}

// ---------- Navigate ----------
async function navigate() {
  const key = currentRoute();
  const route = routes[key] ?? routes[''];

 

  if (route.adminOnly && user.role !== 'admin') {
    window.location.hash = '';
    return;
  }

  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = route.title;

  const main = document.getElementById('app');
  if (!main) { console.error('Routing failed: #app not found.'); return; }

  document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(el => {
    const routeAttr = el.getAttribute('href')?.replace(/^#\/?/, '');
    el.classList.toggle('active', routeAttr === key);
  });

  progressStart();
  main.innerHTML = skeletonFor(key);

  try {
    const html = await route.render(user);
    main.innerHTML = html;

    if (key === 'price-list') wirePriceList();
    if (key === 'cases')      wireCases();
    if (key === 'cases/new')  wireNewCase();
    if (key === '')           wireDashboard();
     if (key === 'billing')    wireBilling();  
     if (key === 'expenses')   wireExpenses();
     if (key === 'pl')         wirePL();
     if (key === 'inventory')  wireInventory();
     if (key === 'control-panel') wireControlPanel();
  } catch (err) {
    console.error('Page render error:', err);
    main.innerHTML = `<p style="color:var(--danger)">Error loading page: ${escapeHtml(err.message)}</p>`;
  } finally {
    progressDone();
  }
}

window.addEventListener('hashchange', navigate);
navigate();


// ---------- Logout ----------
document.getElementById('logout-btn')?.addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.replace('/');
});

// Auto-logout on session expiry
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT' || !session) {
    window.location.replace('/');
  }
});

// ---------- Utilities ----------
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
