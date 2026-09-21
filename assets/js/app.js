import { supabase } from './supabase.js';
import { renderPriceList, wirePriceList } from './pages/price-list.js';
import { renderCases, wireCases } from './pages/cases.js';

// ---------- Auth guard ----------
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  window.location.replace('/');
}

// ---------- Load user profile (name + role) ----------
const { data: profile } = await supabase
  .from('users')
  .select('name, role, email')
  .eq('id', session.user.id)
  .single();

const user = profile ?? {
  name: session.user.email,
  role: 'tech',
  email: session.user.email,
};

document.body.classList.toggle('is-admin', user.role === 'admin');

// Render user details safely
const userInfoEl = document.getElementById('user-info');
if (userInfoEl) {
  userInfoEl.innerHTML = `
    <div>Signed in as</div>
    <strong style="color:var(--text);">${escapeHtml(user.name)}</strong>
    <div>Role: ${escapeHtml(user.role)}</div>
  `;
}

// ---------- Hash router ----------
const routes = {
  '':           { title: 'Dashboard',  render: renderDashboard },
  'cases':      { title: 'Cases',      render: renderCases },
  'billing':    { title: 'Billing',    render: renderBilling,    adminOnly: true },
  'expenses':   { title: 'Expenses',   render: renderExpenses,   adminOnly: true },
  'pl':         { title: 'P&L',        render: renderPL,         adminOnly: true },
  'price-list': { title: 'Price List', render: renderPriceList,  adminOnly: true },
};

function currentRoute() {
  return window.location.hash.replace(/^#\/?/, '').split('?')[0];
}

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
  if (!main) {
    console.error('Routing failed: Target container #app not found in DOM.');
    return;
  }

  // Sync active states for navigation items
  document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(el => {
    const routeAttr = el.getAttribute('href')?.replace(/^#\/?/, '');
    el.classList.toggle('active', routeAttr === key);
  });

  main.innerHTML = '<p style="color:var(--text-muted)">Loading…</p>';

  try {
    const html = await route.render();
    main.innerHTML = html;

    if (key === 'price-list') wirePriceList();
    if (key === 'cases')      wireCases();
  } catch (err) {
    console.error('Page render error:', err);
    main.innerHTML = `<p style="color:var(--danger)">Error loading page: ${escapeHtml(err.message)}</p>`;
  }
}

window.addEventListener('hashchange', navigate);
navigate();

// ---------- Page renderers ----------
async function renderDashboard() {
  return `
    <div class="card">
      <h3 style="margin-bottom:8px;">Welcome, ${escapeHtml(user.name)}</h3>
      <p style="color:var(--text-muted)">
        Case counts, upcoming deadlines, and unpaid balances will appear here.
      </p>
    </div>
  `;
}

async function renderBilling() {
  return `<div class="card"><h3>Billing</h3><p style="color:var(--text-muted);margin-top:8px;">Coming soon.</p></div>`;
}
async function renderExpenses() {
  return `<div class="card"><h3>Expenses</h3><p style="color:var(--text-muted);margin-top:8px;">Coming soon.</p></div>`;
}
async function renderPL() {
  return `<div class="card"><h3>P&amp;L</h3><p style="color:var(--text-muted);margin-top:8px;">Coming soon.</p></div>`;
}

// ---------- Logout ----------
document.getElementById('logout-btn')?.addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.replace('/');
});

// ---------- Utilities ----------
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
