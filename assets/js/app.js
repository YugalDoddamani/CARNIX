import { renderPriceList, wirePriceList } from './pages/price-list.js';

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
document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = user.name);
document.querySelectorAll('[data-user-role]').forEach(el => el.textContent = user.role);

// ---------- Simple hash router ----------
const routes = {
  '':        { title: 'Dashboard', render: renderDashboard },
  'cases':   { title: 'Cases',     render: renderCases },
  'billing': { title: 'Billing',   render: renderBilling, adminOnly: true },
  'expenses':{ title: 'Expenses',  render: renderExpenses, adminOnly: true },
  'pl':      { title: 'P&L',       render: renderPL, adminOnly: true },
  'price-list': { title: 'Price List', render: renderPriceList, adminOnly: true },
};

function currentRoute() {
  const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0];
  return hash;
}

async function navigate() {
  const key = currentRoute();
  const route = routes[key] ?? routes[''];

  if (route.adminOnly && user.role !== 'admin') {
    window.location.hash = '';
    return;
  }

  // Update nav active state
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.route === key);
  });
  document.querySelectorAll('[data-page-title]').forEach(el => el.textContent = route.title);

  // Render
  const main = document.getElementById('page');
  main.innerHTML = '<p style="color:var(--text-muted)">Loading…</p>';
 try {
  const html = await route.render();
  main.innerHTML = html;
  // Run any page-specific wiring after DOM is in place
  if (key === 'price-list') wirePriceList();
} catch (err) {
  console.error(err);
  main.innerHTML = `<p style="color:var(--danger)">Error: ${err.message}</p>`;
}
}

window.addEventListener('hashchange', navigate);
navigate();

// ---------- Page renderers (placeholders for now) ----------
async function renderDashboard() {
  return `
    <div class="neu-card">
      <h3>Welcome, ${user.name}</h3>
      <p style="color:var(--text-muted);margin-top:8px">
        This is the dashboard. Case counts, deadlines, and unpaid balances will appear here.
      </p>
    </div>
  `;
}

async function renderCases() {
  return `
    <div class="neu-card">
      <h3>Work Queue</h3>
      <p style="color:var(--text-muted);margin-top:8px">Case list coming next.</p>
    </div>
  `;
}

async function renderBilling() {
  return `<div class="neu-card"><h3>Billing</h3><p style="color:var(--text-muted)">Coming soon.</p></div>`;
}
async function renderExpenses() {
  return `<div class="neu-card"><h3>Expenses</h3><p style="color:var(--text-muted)">Coming soon.</p></div>`;
}
async function renderPL() {
  return `<div class="neu-card"><h3>P&amp;L</h3><p style="color:var(--text-muted)">Coming soon.</p></div>`;
}


// ---------- Logout ----------
document.getElementById('logout-btn')?.addEventListener('click', async () => {
  await supabase.auth.signOut();
  window.location.replace('/');
});
