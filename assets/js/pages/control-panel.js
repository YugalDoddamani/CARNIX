import { supabase } from '../supabase.js';

let settings = null;
let storageStats = null;
let dbStats = null;
let activityStats = null;
let users = [];
import { invalidateSettings } from '../pdf-helpers.js';

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

  const quota = Number(settings.storage_quota_bytes) || 1073741824;
  const quotaUsagePct = quota > 0 ? (st.totalBytes / quota) * 100 : 0;

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
             <div class="kpi-row">
        ${statCard(
          'Storage used',
          totalStorageGB + ' GB',
          `of ${(quota / 1024**3).toFixed(2)} GB plan`,
          quotaUsagePct > 80 ? 'danger' : quotaUsagePct > 50 ? 'warning' : ''
        )}
        ${statCard('Database', dbMB + ' MB', `${db.connections} connections`, 'primary')}
        ${statCard('Total cases', act.cases ?? 0, `${act.delivered ?? 0} delivered`)}
        ${statCard('Doctors', act.doctors ?? 0, `${act.users ?? 0} users`)}
      </div>

      <div class="cp-section">
        <div class="dash-card-head">
          <div>
            <h4>Storage usage</h4>
            <span class="dash-card-sub">
              ${fmtBytes(st.totalBytes)} of ${fmtBytes(quota)} · ${quotaUsagePct.toFixed(1)}% used
            </span>
          </div>
        </div>
        <div class="cp-quota-bar">
          <div class="cp-quota-fill ${quotaUsagePct > 80 ? 'danger' : quotaUsagePct > 50 ? 'warning' : ''}"
               style="width:${Math.min(quotaUsagePct, 100).toFixed(1)}%"></div>
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
            <label class="field field-wide"><span>UPI ID</span>
              <input type="text" id="s-upi-id" value="${escapeAttr(s.upi?.id ?? '')}"
                     placeholder="yourlab@upi" /></label>
          </div>

          <div class="qr-uploader">
            <div class="qr-preview-wrap">
              <div class="qr-preview" id="qr-preview">
                ${s.upi?.qrUrl
                  ? `<img src="${escapeAttr(s.upi.qrUrl)}" alt="UPI QR" onerror="this.parentElement.innerHTML='<span>No QR</span>'" />`
                  : `<span>No QR</span>`}
              </div>
              <div class="qr-preview-info">
                <b>Payment QR code</b>
                <span id="qr-filename">${s.upi?.qrUrl ? escapeHtml(s.upi.qrUrl.split('/').pop()) : 'Nothing uploaded'}</span>
              </div>
            </div>
            <div class="qr-uploader-actions">
              <input type="file" accept="image/png,image/jpeg,image/webp"
                     id="qr-file" style="display:none" />
              <button type="button" class="btn-ghost" id="qr-upload-btn">Upload QR</button>
              ${s.upi?.qrUrl && s.upi.qrUrl.includes('/storage/v1/object/public/branding/')
                ? `<button type="button" class="btn-ghost danger" id="qr-remove-btn">Remove</button>`
                : ''}
            </div>
          </div>
          <p class="auth-msg" id="qr-msg"></p>
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

                <div class="cp-section">
          <div class="dash-card-head"><div><h4>Storage quota</h4><span class="dash-card-sub">Your Supabase plan limit</span></div></div>
          <div class="form-grid">
            <label class="field"><span>Quota (GB)</span>
              <input type="number" step="0.1" min="0" id="s-quota-gb"
                     value="${((Number(s.storage_quota_bytes) || 1073741824) / (1024**3)).toFixed(2)}" /></label>
            <div class="field" style="justify-content:flex-end">
              <span>&nbsp;</span>
              <div style="font-size:.8rem;color:var(--text-muted);padding:14px 0">
                Free tier = 1 GB · Pro = 100 GB
              </div>
            </div>
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

              storage_quota_bytes: Math.round(
        (Number(document.getElementById('s-quota-gb').value) || 1) * (1024 ** 3)
      ),

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

  // ---------- QR upload ----------
  const qrFile = document.getElementById('qr-file');
  const qrUploadBtn = document.getElementById('qr-upload-btn');
  const qrRemoveBtn = document.getElementById('qr-remove-btn');
  const qrMsg = document.getElementById('qr-msg');

  qrUploadBtn?.addEventListener('click', () => qrFile?.click());

  qrFile?.addEventListener('change', async () => {
    const file = qrFile.files?.[0];
    if (!file) return;

    qrMsg.textContent = '';
    qrMsg.className = 'auth-msg';

    if (file.size > 5 * 1024 * 1024) {
      qrMsg.textContent = 'File too large. Max 5 MB.';
      qrMsg.className = 'auth-msg error';
      return;
    }

    qrUploadBtn.disabled = true;
    qrUploadBtn.textContent = 'Uploading…';

    const path = 'upi-qr.' + (file.name.split('.').pop() || 'png').toLowerCase();

    const { error: upErr } = await supabase.storage
      .from('branding')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (upErr) {
      qrMsg.textContent = upErr.message;
      qrMsg.className = 'auth-msg error';
      qrUploadBtn.disabled = false;
      qrUploadBtn.textContent = 'Upload QR';
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('branding')
      .getPublicUrl(path);

    // Add a cache-buster so the preview refreshes immediately
    const urlWithBuster = publicUrl + '?v=' + Date.now();

    const { error: saveErr } = await supabase
      .from('settings')
      .update({ upi: { ...settings.upi, qrUrl: publicUrl }, updated_at: new Date().toISOString() })
      .eq('id', 1);

    if (saveErr) {
      qrMsg.textContent = saveErr.message;
      qrMsg.className = 'auth-msg error';
      qrUploadBtn.disabled = false;
      qrUploadBtn.textContent = 'Upload QR';
      return;
    }

    // Update local state + preview
    settings.upi.qrUrl = publicUrl;
    invalidateSettings();
    document.getElementById('qr-preview').innerHTML =
      `<img src="${urlWithBuster}" alt="UPI QR" />`;
    document.getElementById('qr-filename').textContent = path;

    qrMsg.textContent = 'QR uploaded. New invoices will use it.';
    qrMsg.className = 'auth-msg ok';
    qrUploadBtn.disabled = false;
    qrUploadBtn.textContent = 'Upload QR';

    // Reload so Remove button appears
    setTimeout(() => location.reload(), 900);
  });

  qrRemoveBtn?.addEventListener('click', async () => {
    if (!confirm('Remove the QR code? Invoices will show a placeholder box.')) return;
    qrRemoveBtn.disabled = true;
    qrRemoveBtn.textContent = 'Removing…';

    // List files in bucket to find the QR (handles .png, .jpg, .webp)
    const { data: files } = await supabase.storage.from('branding').list();
    const qrFiles = (files || []).filter(f => f.name.startsWith('upi-qr.'));
    if (qrFiles.length) {
      await supabase.storage.from('branding').remove(qrFiles.map(f => f.name));
    }

    await supabase.from('settings')
      .update({ upi: { ...settings.upi, qrUrl: '' }, updated_at: new Date().toISOString() })
      .eq('id', 1);

    settings.upi.qrUrl = '';
    invalidateSettings();
    location.reload();
  });