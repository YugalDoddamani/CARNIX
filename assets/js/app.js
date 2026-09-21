import { supabase } from './supabase.js';
import { renderPriceList, wirePriceList } from './pages/price-list.js';
import { renderCases, wireCases, renderNewCase, wireNewCase } from './pages/cases.js';
import { renderDashboard, wireDashboard } from './pages/dashboard.js';

// ---------- Auth guard ----------
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  window.location.replace('/');
}

// ---------- Profile ----------
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
  main.innerHTML = '<div class="page-loading"><span class="loader"></span></div>';

  try {
    const html = await route.render(user);
    main.innerHTML = html;

    if (key === 'price-list') wirePriceList();
    if (key === 'cases')      wireCases();
    if (key === 'cases/new')  wireNewCase();
    if (key === '')           wireDashboard();
  } catch (err) {
    console.error('Page render error:', err);
    main.innerHTML = `<p style="color:var(--danger)">Error loading page: ${escapeHtml(err.message)}</p>`;
  } finally {
    progressDone();
  }
}

window.addEventListener('hashchange', navigate);
navigate();

// ---------- Placeholders ----------
async function renderBilling() {
  return `<div class="neu-card"><h3>Billing</h3><p style="color:var(--text-muted);margin-top:8px;">Coming soon.</p></div>`;
}
async function renderExpenses() {
  return `<div class="neu-card"><h3>Expenses</h3><p style="color:var(--text-muted);margin-top:8px;">Coming soon.</p></div>`;
}
async function renderPL() {
  return `<div class="neu-card"><h3>P&amp;L</h3><p style="color:var(--text-muted);margin-top:8px;">Coming soon.</p></div>`;
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
