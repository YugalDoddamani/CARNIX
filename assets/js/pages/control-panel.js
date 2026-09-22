import { supabase } from '../supabase.js';

let settings = null;
let storageStats = null;
let dbStats = null;
let activityStats = null;
let users = [];

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
const escapeAttr = escapeHtml;

function fmtBytes(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  if (n < 1024 * 1024 * 1024) return (n / (1024 * 1024)).toFixed(2) + ' MB';
  return (n / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
}
function inr(n) {
  return '₹' + Math.round(Number(n) || 0).toLocaleString('en-IN');
}
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ---------- Loaders ----------
async function loadAll() {
  const [s, st, db, act, us] = await Promise.all([
    supabase.from('settings').select('*').eq('id', 1).single(),
    supabase.rpc('get_storage_stats'),
    supabase.rpc('get_database_stats'),
    supabase.rpc('get_activity_stats'),
    supabase.from('users').select('id, name, email, role, created_at').order('created_at', { ascending: true }),
  ]);

  if (s.error) throw s.error;
  settings = s.data;
  storageStats = st.data;
  dbStats = db.data;
  activityStats = act.data;
  users = us.data ?? [];
}

function statCard(label, value, sub, tone = '') {
  return `
    <div class="kpi ${tone ? 'kpi-' + tone : ''}">
      <div class="kpi-head"><span class="kpi-label">${label}</span></div>
      <div class="kpi-value">${value}</div>
      ${sub ? `<div class="kpi-sub">${sub}</div>` : ''}
    </div>
  `;
}

// ---------- Render ----------
export async function renderControlPanel() {
  await loadAll();

  const s = settings;
  const st = storageStats || { totalBytes: 0, totalFiles: 0, buckets: [] };
  const db = dbStats || { databaseBytes: 0, tables: [], connections: 0 };
  const act = activityStats || {};

  const totalStorageGB = (st.totalBytes / (1024 ** 3)).toFixed(3);
  const dbMB = (db.databaseBytes / (1024 ** 2)).toFixed(1);

  return `
    <div class="cp-tabs">
      <button class="cp-tab active" data-tab="overview">Overview</button>
      <button class="cp-tab" data-tab="settings">Settings</button>
      <button class="cp-tab" data-tab="users">Users</button>
    </div>

    <!-- ============ OVERVIEW ============ -->
    <div class="cp-pane" data-pane="overview">
      <div class="kpi-row">
        ${statCard('Storage used', totalStorageGB + ' GB', `${st.totalFiles} files across ${st.buckets.length} buckets`)}
        ${statCard('Database', dbMB + ' MB', `${db.connections} connections`, 'primary')}
        ${statCard('Total cases', act.cases ?? 0, `${act.delivered ?? 0} delivered`)}
        ${statCard('Doctors', act.doctors ?? 0, `${act.users ?? 0} users`)}
      </div>

      <div class="cp-grid">
        <div class="cp-section">
          <div class="dash-card-head">
            <div><h4>Storage by bucket</h4><span class="dash-card-sub">File count and size</span></div>
          </div>
          ${st.buckets.length ? `
            <div class="cp-list">
              ${st.buckets.map(b => `
                <div class="cp-list-row">
                  <div>
                    <b>${escapeHtml(b.bucket)}</b>
                    <span>${b.files} file${b.files === 1 ? '' : 's'}</span>
                  </div>
                  <b>${fmtBytes(b.bytes)}</b>
                </div>
              `).join('')}
            </div>
          ` : '<div class="empty-row">No files uploaded yet</div>'}
        </div>

        <div class="cp-section">
          <div class="dash-card-head">
            <div><h4>Database tables</h4><span class="dash-card-sub">Size and row count</span></div>
          </div>
          ${db.tables.length ? `
            <div class="cp-list">
              ${db.tables.map(t => `
                <div class="cp-list-row">
                  <div>
                    <b>${escapeHtml(t.name)}</b>
                    <span>${t.rows} row${t.rows === 1 ? '' : 's'}</span>
                  </div>
                  <b>${fmtBytes(t.bytes)}</b>
                </div>
              `).join('')}
            </div>
          ` : '<div class="empty-row">No tables yet</div>'}
        </div>
      </div>

      <div class="cp-section">
        <div class="dash-card-head">
          <div><h4>Business snapshot</h4><span class="dash-card-sub">All-time totals</span></div>
        </div>
        <div class="cp-snapshot">
          <div><span>Cases</span><b>${act.cases ?? 0}</b></div>
          <div><span>Delivered</span><b>${act.delivered ?? 0}</b></div>
          <div><span>Invoices</span><b>${act.invoices ?? 0}</b></div>
          <div><span>Expenses</span><b>${act.expenses ?? 0}</b></div>
          <div><span>Inventory items</span><b>${act.inventory ?? 0}</b></div>
          <div><span>Doctors</span><b>${act.doctors ?? 0}</b></div>
          <div><span>Income (paid)</span><b>${inr(act.income)}</b></div>
          <div><span>Expenses (paid)</span><b>${inr(act.expenseTotal)}</b></div>
        </div>
      </div>
    </div>

    <!-- ============ SETTINGS ============ -->
    <div class="cp-pane" data-pane="settings" hidden>
      <form id="cp-settings-form">
        <div class="cp-section">
          <div class="dash-card-head"><div><h4>Bank details</h4><span class="dash-card-sub">Shown on invoice PDFs</span></div></div>
          <div class="form-grid">
            <label class="field"><span>Bank name</span>
              <input type="text" id="s-bank-name" value="${escapeAttr(s.bank?.name ?? '')}" /></label>
            <label class="field"><span>Account name</span>
              <input type="text" id="s-bank-acct-name" value="${escapeAttr(s.bank?.accountName ?? '')}" /></label>
            <label class="field"><span>Account number</span>
              <input type="text" id="s-bank-acct-no" value="${escapeAttr(s.bank?.accountNumber ?? '')}" /></label>
            <label class="field"><span>IFSC</span>
              <input type="text" id="s-bank-ifsc" value="${escapeAttr(s.bank?.ifsc ?? '')}" /></label>
            <label class="field field-wide"><span>Branch</span>
              <input type="text" id="s-bank-branch" value="${escapeAttr(s.bank?.branch ?? '')}" /></label>
          </div>
        </div>

        <div class="cp-section">
          <div class="dash-card-head"><div><h4>UPI</h4><span class="dash-card-sub">Shown on invoice PDFs</span></div></div>
          <div class="form-grid">
            <label class="field"><span>UPI ID</span>
              <input type="text" id="s-upi-id" value="${escapeAttr(s.upi?.id ?? '')}" /></label>
            <label class="field"><span>QR image path</span>
              <input type="text" id="s-upi-qr" value="${escapeAttr(s.upi?.qrUrl ?? '')}" /></label>
          </div>
        </div>

        <div class="cp-section">
          <div class="dash-card-head"><div><h4>Contact</h4><span class="dash-card-sub">Appears on invoices and receipts</span></div></div>
          <div class="form-grid">
            <label class="field"><span>Phone</span>
              <input type="text" id="s-phone" value="${escapeAttr(s.contact?.phone ?? '')}" /></label>
            <label class="field"><span>Email</span>
              <input type="text" id="s-email" value="${escapeAttr(s.contact?.email ?? '')}" /></label>
            <label class="field field-wide"><span>Address</span>
              <input type="text" id="s-address" value="${escapeAttr(s.contact?.address ?? '')}" /></label>
          </div>
        </div>

        <div class="cp-section">
          <div class="dash-card-head"><div><h4>Invoice</h4><span class="dash-card-sub">Preferences</span></div></div>
          <div class="form-grid">
            <label class="field"><span>Prefix</span>
              <input type="text" id="s-inv-prefix" value="${escapeAttr(s.invoice?.prefix ?? 'CARNIX')}" /></label>
            <label class="field field-wide"><span>Terms / footer note</span>
              <input type="text" id="s-inv-terms" value="${escapeAttr(s.invoice?.terms ?? '')}" /></label>
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn-primary" id="cp-save">Save settings</button>
        </div>
        <p class="auth-msg" id="cp-msg"></p>
      </form>
    </div>

    <!-- ============ USERS ============ -->
    <div class="cp-pane" data-pane="users" hidden>
      <div class="cp-section">
        <div class="dash-card-head">
          <div><h4>Users</h4><span class="dash-card-sub">${users.length} account${users.length === 1 ? '' : 's'}</span></div>
        </div>
        <div class="table-wrap desktop-only">
          <table class="data-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th></th></tr>
            </thead>
            <tbody>
              ${users.map(u => `
                <tr data-id="${u.id}">
                  <td><b>${escapeHtml(u.name)}</b></td>
                  <td>${escapeHtml(u.email)}</td>
                  <td>
                    <select class="role-select" data-id="${u.id}">
                      <option value="tech" ${u.role === 'tech' ? 'selected' : ''}>Technician</option>
                      <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                    </select>
                  </td>
                  <td>${fmtDate(u.created_at)}</td>
                  <td class="row-actions">
                    <button class="btn-ghost" data-action="save-role" data-id="${u.id}">Save</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        <div class="mobile-only">
          ${users.map(u => `
            <div class="cp-user-row" data-id="${u.id}">
              <div class="cp-user-head">
                <b>${escapeHtml(u.name)}</b>
                <span class="badge badge-${u.role === 'admin' ? 'primary' : 'neutral'}">${u.role}</span>
              </div>
              <div class="cp-user-email">${escapeHtml(u.email)}</div>
              <div class="cp-user-controls">
                <select class="role-select" data-id="${u.id}">
                  <option value="tech" ${u.role === 'tech' ? 'selected' : ''}>Technician</option>
                  <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
                </select>
                <button class="btn-ghost" data-action="save-role" data-id="${u.id}">Save</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// ---------- Wire ----------
export function wireControlPanel() {
  // Tabs
  document.querySelectorAll('.cp-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      document.querySelectorAll('.cp-tab').forEach(t => t.classList.toggle('active', t === tab));
      document.querySelectorAll('.cp-pane').forEach(p => {
        p.hidden = p.dataset.pane !== target;
      });
    });
  });

  // Settings save
  const form = document.getElementById('cp-settings-form');
  const msg = document.getElementById('cp-msg');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('cp-save');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';
    msg.textContent = ''; msg.className = 'auth-msg';

    const payload = {
      bank: {
        name: document.getElementById('s-bank-name').value.trim(),
        accountName: document.getElementById('s-bank-acct-name').value.trim(),
        accountNumber: document.getElementById('s-bank-acct-no').value.trim(),
        ifsc: document.getElementById('s-bank-ifsc').value.trim(),
        branch: document.getElementById('s-bank-branch').value.trim(),
      },
      upi: {
        id: document.getElementById('s-upi-id').value.trim(),
        qrUrl: document.getElementById('s-upi-qr').value.trim(),
      },
      contact: {
        phone: document.getElementById('s-phone').value.trim(),
        email: document.getElementById('s-email').value.trim(),
        address: document.getElementById('s-address').value.trim(),
      },
      invoice: {
        prefix: document.getElementById('s-inv-prefix').value.trim() || 'CARNIX',
        terms: document.getElementById('s-inv-terms').value.trim(),
      },
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from('settings').update(payload).eq('id', 1);

    saveBtn.disabled = false;
    saveBtn.textContent = 'Save settings';

    if (error) {
      msg.textContent = error.message;
      msg.className = 'auth-msg error';
      return;
    }
    msg.textContent = 'Settings saved. Invoices will use these values.';
    msg.className = 'auth-msg ok';
  });

  // User role changes
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-action="save-role"]');
    if (!btn) return;
    const id = btn.dataset.id;
    const select = document.querySelector(`.role-select[data-id="${id}"]`);
    if (!select) return;
    const newRole = select.value;
    btn.disabled = true;
    btn.textContent = 'Saving…';
    const { error } = await supabase.from('users').update({ role: newRole }).eq('id', id);
    btn.disabled = false;
    btn.textContent = 'Save';
    if (error) return alert(error.message);
    btn.textContent = '✓';
    setTimeout(() => { btn.textContent = 'Save'; }, 1200);
  });
}