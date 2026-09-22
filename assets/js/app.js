import { supabase } from './supabase.js';
import { renderPriceList, wirePriceList } from './pages/price-list.js';
import { renderCases, wireCases, renderNewCase, wireNewCase } from './pages/cases.js';
import { renderDashboard, wireDashboard } from './pages/dashboard.js';
import { renderBilling, wireBilling } from './pages/billing.js';
import { renderExpenses, wireExpenses } from './pages/expenses.js';
import { renderPL, wirePL } from './pages/pl.js';
import { renderInventory, wireInventory } from './pages/inventory.js';
import { renderControlPanel, wireControlPanel } from './pages/control-panel.js';

// ---------- Auth guard ----------
const { data: { session } } = await supabase.auth.getSession();
if (!session) {
  window.location.replace('/');
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
