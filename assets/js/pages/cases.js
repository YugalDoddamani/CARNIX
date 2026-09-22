import { supabase } from '../supabase.js';

let allCases = [];
let activeFilter = 'all';
let searchQuery = '';
let priceList = [];

// ---------- Data ----------
async function loadData() {
  const { data, error } = await supabase
    .from('cases')
    .select('*, case_stages(*)')
    .order('received_date', { ascending: false })
    .limit(500);
  if (error) throw error;
  allCases = data ?? [];

  const { data: prices } = await supabase
    .from('price_list')
    .select('id, case_type, label, price')
    .eq('active', true)
    .order('case_type');
  priceList = prices ?? [];
}

// ---------- Helpers ----------
// IST-aware today
const today = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
const caseTotal = c => (c.case_stages ?? []).reduce((s, st) => s + Number(st.amount || 0), 0);

function isOverdue(c) {
  if (!c.delivery_date) return false;
  if (c.status === 'delivered') return false;
  return new Date(c.delivery_date) < new Date(today());
}

function computeStats(list) {
  return {
    total:   list.length,
    inQueue: list.filter(c => c.status === 'in-queue').length,
    overdue: list.filter(isOverdue).length,
    unpaid:  list.filter(c => !c.payment_status).reduce((s, c) => s + caseTotal(c), 0),
  };
}

function filterCases() {
  let list = allCases;
  if (activeFilter === 'in-queue')  list = list.filter(c => c.status === 'in-queue');
  if (activeFilter === 'delivered') list = list.filter(c => c.status === 'delivered');
  if (activeFilter === 'overdue')   list = list.filter(isOverdue);
  if (activeFilter === 'unpaid')    list = list.filter(c => !c.payment_status);

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    list = list.filter(c =>
      (c.doctor_name ?? '').toLowerCase().includes(q) ||
      (c.patient_identifier ?? '').toLowerCase().includes(q) ||
      (c.case_stages ?? []).some(s => (s.case_type ?? '').toLowerCase().includes(q))
    );
  }
  return list;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
const escapeAttr = escapeHtml;

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtShort(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function statCard(label, value, tone = '') {
  return `<div class="stat-card ${tone ? 'tone-' + tone : ''}">
    <span class="stat-label">${label}</span>
    <span class="stat-value">${value}</span>
  </div>`;
}

function statusOf(c) {
  if (isOverdue(c)) return { label: 'Overdue', cls: 'danger' };
  if (c.status === 'delivered') return { label: 'Delivered', cls: 'success' };
  return { label: 'In Queue', cls: 'primary' };
}

// ================= DESKTOP TABLE ROWS =================
function renderRows(list) {
  if (!list.length) {
    return `<tr><td colspan="6" class="empty-row">No cases yet</td></tr>`;
  }
  return list.map(c => {
    const st = statusOf(c);
    const stages = c.case_stages ?? [];
    const primaryType = stages[0]?.case_type ?? '—';
    const stageNote = stages.length > 1 ? ` <span class="stage-count">+${stages.length - 1}</span>` : '';

    return `<tr data-id="${c.id}" class="case-row">
      <td data-label="Received">${fmtShort(c.received_date)}</td>
      <td data-label="Doctor">
        <div class="cell-main">${escapeHtml(c.doctor_name)}</div>
        ${c.patient_identifier ? `<div class="cell-sub">${escapeHtml(c.patient_identifier)}</div>` : ''}
      </td>
      <td data-label="Case">
        <div class="cell-main">${escapeHtml(primaryType)}${stageNote}</div>
        ${stages.length > 1 ? `<div class="cell-sub">${stages.length} stages</div>` : ''}
      </td>
      <td data-label="Delivery" class="${isOverdue(c) ? 'cell-overdue' : ''}">${fmtShort(c.delivery_date)}</td>
      <td data-label="Status">
        <span class="badge badge-${st.cls}">${st.label}</span>
        ${!c.payment_status ? `<span class="badge badge-warning">Unpaid</span>` : ''}
      </td>
      <td data-label="" class="row-actions">
        <button class="kebab-btn" data-action="menu" data-id="${c.id}" aria-label="Actions">⋯</button>
      </td>
    </tr>`;
  }).join('');
}

// ================= MOBILE LIST =================
function renderMobileRows(list) {
  if (!list.length) {
    return `<div class="empty-row">No cases yet</div>`;
  }
  return list.map(c => {
    const st = statusOf(c);
    const stages = c.case_stages ?? [];
    const primaryType = stages[0]?.case_type ?? '—';
    const stageNote = stages.length > 1 ? ` <span class="stage-count">+${stages.length - 1}</span>` : '';
    const received = c.received_date ? fmtShort(c.received_date) : '—';
    const delivery = c.delivery_date ? fmtShort(c.delivery_date) : '—';
    const overdue = isOverdue(c);

    return `
      <div class="mcase-row" data-id="${c.id}">
        <div class="mcase-head">
          <b class="mcase-doctor">${escapeHtml(c.doctor_name)}</b>
          <button class="kebab-btn" data-action="menu" data-id="${c.id}" aria-label="Actions">⋯</button>
        </div>
        <div class="mcase-type">${escapeHtml(primaryType)}${stageNote}</div>
        <div class="mcase-dates">
          <span>${received}</span>
          <span class="mcase-arrow">→</span>
          <span class="${overdue ? 'cell-overdue' : ''}">${delivery}</span>
        </div>
        <div class="mcase-badges">
          <span class="badge badge-${st.cls}">${st.label}</span>
          ${!c.payment_status ? '<span class="badge badge-warning">Unpaid</span>' : ''}
        </div>
      </div>
    `;
  }).join('');
}
// ================= LIST VIEW =================
export async function renderCases() {
  await loadData();
  const s = computeStats(allCases);
  const filtered = filterCases();

  return `
    <div class="page-header-actions">
      <a class="btn-primary" href="#/cases/new">+ New Case</a>
    </div>

    <div class="stats-row">
      ${statCard('Total', s.total)}
      ${statCard('In Queue', s.inQueue, 'primary')}
      ${statCard('Overdue', s.overdue, 'danger')}
      ${statCard('Unpaid', '₹' + s.unpaid.toFixed(0), 'warning')}
    </div>

    <div class="filter-row">
      <div class="chips">
        <button class="chip ${activeFilter === 'all' ? 'active' : ''}" data-filter="all">All</button>
        <button class="chip ${activeFilter === 'in-queue' ? 'active' : ''}" data-filter="in-queue">In Queue</button>
        <button class="chip ${activeFilter === 'overdue' ? 'active' : ''}" data-filter="overdue">Overdue</button>
        <button class="chip ${activeFilter === 'delivered' ? 'active' : ''}" data-filter="delivered">Delivered</button>
        <button class="chip ${activeFilter === 'unpaid' ? 'active' : ''}" data-filter="unpaid">Unpaid</button>
      </div>
      <input type="search" id="case-search" class="search-input"
             placeholder="Search doctor, case, patient…" value="${escapeAttr(searchQuery)}" />
    </div>

    <!-- Desktop table -->
    <div class="table-wrap neu-card desktop-only">
      <table class="data-table" id="cases-table">
        <thead>
          <tr>
            <th>Received</th>
            <th>Doctor</th>
            <th>Case</th>
            <th>Delivery</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="cases-rows">${renderRows(filtered)}</tbody>
      </table>
    </div>

    <!-- Mobile list -->
    <div class="mobile-cases mobile-only" id="cases-mobile">
      ${renderMobileRows(filtered)}
    </div>

    <div id="modal-root"></div>
  `;
}

export function wireCases() {
  // Filters
  document.querySelectorAll('.chip[data-filter]').forEach(chip => {
    chip.addEventListener('click', () => {
      activeFilter = chip.dataset.filter;
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      paintRows();
    });
  });

  // Search
  const search = document.getElementById('case-search');
  let searchTimer;
  search?.addEventListener('input', e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      searchQuery = e.target.value.trim();
      paintRows();
    }, 180);
  });

    // Row / kebab clicks — scoped to #app so it's GC'd when the page is replaced
  const appRoot = document.getElementById('app');
  appRoot.addEventListener('click', (e) => {
    const kebab = e.target.closest('button[data-action="menu"]');
    if (kebab) { e.stopPropagation(); openActions(kebab.dataset.id, kebab); return; }
    const row = e.target.closest('tr[data-id]');
    if (row) { openCaseDetail(row.dataset.id); return; }
    const mrow = e.target.closest('.mcase-row[data-id]');
    if (mrow) { openCaseDetail(mrow.dataset.id); return; }
  });

function paintRows() {
  const f = filterCases();
  const desktop = document.getElementById('cases-rows');
  const mobile  = document.getElementById('cases-mobile');
  if (desktop) desktop.innerHTML = renderRows(f);
  if (mobile)  mobile.innerHTML  = renderMobileRows(f);
}

// ================= ACTION SHEET =================
function openActions(id, anchorEl) {
  const c = allCases.find(x => x.id === id);
  if (!c) return;

  // Remove any existing menu
  document.getElementById('kebab-menu-root')?.remove();

  const isDelivered = c.status === 'delivered';

  const menu = document.createElement('div');
  menu.id = 'kebab-menu-root';
  menu.className = 'kebab-menu-root';
  menu.innerHTML = `
    <div class="kebab-backdrop"></div>
    <div class="kebab-sheet">
      <button class="kebab-action" data-action="edit">
        <span>Edit case</span>
      </button>
      <button class="kebab-action" data-action="deliver">
        <span>${isDelivered ? 'Reopen case' : 'Mark delivered'}</span>
      </button>
      <button class="kebab-action danger" data-action="delete">
        <span>Delete</span>
      </button>
    </div>
  `;

  document.body.appendChild(menu);

  const close = () => menu.remove();

  menu.querySelector('.kebab-backdrop').addEventListener('click', close);

  menu.querySelector('[data-action="edit"]').onclick = () => {
    close();
    openEdit(c.id);
  };

  menu.querySelector('[data-action="deliver"]').onclick = async () => {
    close();
    if (isDelivered) {
      const { error } = await supabase
        .from('cases').update({ status: 'in-queue', delivered_at: null }).eq('id', c.id);
      if (error) return alert(error.message);
    } else {
      const { error } = await supabase
        .from('cases').update({ status: 'delivered', delivered_at: today() }).eq('id', c.id);
      if (error) return alert(error.message);
    }
    await refresh();
  };

  menu.querySelector('[data-action="delete"]').onclick = () => {
    close();
    confirmDelete(c);
  };
}

// ================= CONFIRM DELETE =================
function confirmDelete(c) {
  document.getElementById('confirm-root')?.remove();
  const root = document.createElement('div');
  root.id = 'confirm-root';
  root.className = 'case-modal-backdrop confirm-backdrop';
  root.innerHTML = `
    <div class="confirm-modal">
      <h3>Delete this case?</h3>
      <p>This will permanently remove <b>${escapeHtml(c.doctor_name)}</b>'s case from
      ${fmtShort(c.received_date)}. This cannot be undone.</p>
      <div class="case-modal-actions">
        <button class="btn-ghost" id="cf-cancel">Cancel</button>
        <button class="btn-danger" id="cf-delete">Delete permanently</button>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  root.querySelector('#cf-cancel').onclick = () => root.remove();
  root.querySelector('#cf-delete').onclick = async () => {
    const btn = root.querySelector('#cf-delete');
    btn.disabled = true;
    btn.textContent = 'Deleting…';
    const { error } = await supabase.from('cases').delete().eq('id', c.id);
    if (error) { alert(error.message); btn.disabled = false; btn.textContent = 'Delete permanently'; return; }
    root.remove();
    await refresh();
  };
}

// ================= DETAIL MODAL =================
function renderDetail(c) {
  const st = statusOf(c);
  const total = caseTotal(c);
  const stages = c.case_stages ?? [];

  return `
    <div class="case-modal-backdrop" id="case-detail">
      <div class="case-modal">
        <div class="case-modal-header">
          <div>
            <div class="case-modal-eyebrow">Case · ${fmtDate(c.received_date)}</div>
            <h3>${escapeHtml(c.doctor_name)}</h3>
            ${c.patient_identifier ? `<div class="case-modal-sub">${escapeHtml(c.patient_identifier)}</div>` : ''}
          </div>
          <button class="modal-close" id="detail-close">×</button>
        </div>

        <div class="case-modal-badges">
          <span class="badge badge-${st.cls}">${st.label}</span>
          ${!c.payment_status
            ? `<span class="badge badge-warning">Unpaid</span>`
            : `<span class="badge badge-success">Paid</span>`}
        </div>

        <div class="detail-grid">
          <div class="detail-item"><span>Received</span><b>${fmtDate(c.received_date)}</b></div>
          <div class="detail-item"><span>Delivery</span><b class="${isOverdue(c) ? 'cell-overdue' : ''}">${fmtDate(c.delivery_date)}</b></div>
          <div class="detail-item"><span>Delivered at</span><b>${fmtDate(c.delivered_at)}</b></div>
        </div>

        <div class="detail-section">
          <div class="detail-section-head"><h4>Stages</h4></div>
          <div class="stage-list">
            ${stages.map((s, i) => `
              <div class="stage-line">
                <div class="stage-line-main">
                  <span class="stage-line-num">${i + 1}</span>
                  <div>
                    <b>${escapeHtml(s.case_type)}</b>
                    <div class="cell-sub">${escapeHtml(s.label || '')} · ₹${Number(s.unit_price).toFixed(0)} × ${s.quantity}</div>
                  </div>
                </div>
                <b>₹${Number(s.amount).toFixed(0)}</b>
              </div>
            `).join('')}
            <div class="stage-total"><span>Total</span><b>₹${total.toFixed(2)}</b></div>
          </div>
        </div>

        <div class="detail-section">
          <div class="detail-section-head"><h4>Notes</h4></div>
          <textarea id="detail-notes" rows="3" placeholder="Add notes about this case…">${escapeHtml(c.notes ?? '')}</textarea>
          <div class="notes-actions"><button class="btn-ghost" id="save-notes">Save notes</button></div>
        </div>

        <div class="case-modal-actions">
          ${c.status !== 'delivered'
            ? `<button class="btn-primary" id="detail-deliver">Mark Delivered</button>`
            : `<button class="btn-ghost" id="detail-reopen">Reopen</button>`}
          <button class="btn-ghost" id="detail-edit">Edit</button>
          <button class="btn-ghost danger" id="detail-delete">Delete</button>
        </div>
        <p class="auth-msg" id="detail-msg"></p>
      </div>
    </div>
  `;
}

function openCaseDetail(id) {
  const c = allCases.find(x => x.id === id);
  if (!c) return;
  const root = document.getElementById('modal-root');
  root.innerHTML = renderDetail(c);
  wireDetail(c);
}

function wireDetail(c) {
  const root = document.getElementById('modal-root');
  root.querySelector('#detail-close').onclick = () => { root.innerHTML = ''; };
  root.querySelector('.case-modal-backdrop').addEventListener('click', (e) => {
    if (e.target.id === 'case-detail') root.innerHTML = '';
  });

  root.querySelector('#save-notes').onclick = async () => {
    const notes = root.querySelector('#detail-notes').value.trim() || null;
    const { error } = await supabase.from('cases').update({ notes }).eq('id', c.id);
    const msg = root.querySelector('#detail-msg');
    if (error) { msg.textContent = error.message; msg.className = 'auth-msg error'; return; }
    msg.textContent = 'Notes saved'; msg.className = 'auth-msg ok';
    setTimeout(() => { msg.textContent = ''; msg.className = 'auth-msg'; }, 1500);
  };

  root.querySelector('#detail-deliver')?.addEventListener('click', async () => {
    const { error } = await supabase.from('cases')
      .update({ status: 'delivered', delivered_at: today() }).eq('id', c.id);
    if (error) return alert(error.message);
    root.innerHTML = '';
    await refresh();
  });

  root.querySelector('#detail-reopen')?.addEventListener('click', async () => {
    const { error } = await supabase.from('cases')
      .update({ status: 'in-queue', delivered_at: null }).eq('id', c.id);
    if (error) return alert(error.message);
    root.innerHTML = '';
    await refresh();
  });

  root.querySelector('#detail-edit').onclick = () => openEdit(c.id);
  root.querySelector('#detail-delete').onclick = () => { root.innerHTML = ''; confirmDelete(c); };
}

// ================= EDIT MODAL =================
function renderEditForm(c) {
  const stageRows = (c.case_stages ?? []).map(s => {
    const opts = priceList.map(p => `
      <option value="${p.id}"
        data-label="${escapeAttr(p.label)}"
        data-price="${p.price}"
        data-type="${escapeAttr(p.case_type)}"
        ${p.case_type === s.case_type ? 'selected' : ''}>
        ${escapeHtml(p.case_type)}
      </option>`).join('');
    return `
      <div class="stage-row">
        <div class="stage-fields">
          <label class="field field-wide-2">
            <span>Case Type</span>
            <select class="stage-type" required>
              <option value="">— Select —</option>
              ${opts}
            </select>
          </label>
          <label class="field">
            <span>Qty</span>
            <input type="number" class="stage-qty" min="1" value="${s.quantity}" required />
          </label>
          <label class="field">
            <span>Price</span>
            <input type="text" class="stage-price" readonly value="₹${Number(s.amount).toFixed(2)}" />
          </label>
          <button type="button" class="stage-remove" title="Remove">×</button>
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="case-modal-backdrop" id="case-detail">
      <div class="case-modal">
        <div class="case-modal-header">
          <div>
            <div class="case-modal-eyebrow">Edit case</div>
            <h3>${escapeHtml(c.doctor_name)}</h3>
          </div>
          <button class="modal-close" id="edit-close">×</button>
        </div>

        <form id="edit-form">
          <div class="form-section">
            <div class="form-grid">
              <label class="field"><span>Received</span>
                <input type="date" id="e-received" value="${c.received_date ?? ''}" required /></label>
              <label class="field"><span>Delivery</span>
                <input type="date" id="e-delivery" value="${c.delivery_date ?? ''}" /></label>
              <label class="field"><span>Doctor</span>
                <input type="text" id="e-doctor" value="${escapeAttr(c.doctor_name ?? '')}" required /></label>
              <label class="field"><span>Patient / Case ID</span>
                <input type="text" id="e-patient" value="${escapeAttr(c.patient_identifier ?? '')}" /></label>
            </div>
          </div>

          <div class="form-section">
            <div class="section-head">
              <h4>Stages</h4>
              <button type="button" class="btn-ghost" id="edit-add-stage">+ Add stage</button>
            </div>
            <div id="edit-stages">${stageRows}</div>
            <div class="case-total-row"><span>Case total</span><b id="edit-total">₹0.00</b></div>
          </div>

          <div class="case-modal-actions">
            <button type="button" class="btn-ghost" id="edit-cancel">Cancel</button>
            <button type="submit" class="btn-primary" id="edit-save">Save changes</button>
          </div>
          <p class="auth-msg" id="edit-msg"></p>
        </form>
      </div>
    </div>
  `;
}

function openEdit(id) {
  const c = allCases.find(x => x.id === id);
  if (!c) return;
  const root = document.getElementById('modal-root');
  root.innerHTML = renderEditForm(c);
  wireEdit(c);
}

function wireEdit(c) {
  const root = document.getElementById('modal-root');
  const stagesList = root.querySelector('#edit-stages');
  const totalEl = root.querySelector('#edit-total');

  function recalcTotals() {
    let total = 0;
    stagesList.querySelectorAll('.stage-row').forEach(row => {
      const qty = Number(row.querySelector('.stage-qty').value) || 0;
      const opt = row.querySelector('.stage-type').selectedOptions[0];
      const price = opt && opt.value ? Number(opt.dataset.price) || 0 : 0;
      total += qty * price;
      row.querySelector('.stage-price').value = '₹' + (qty * price).toFixed(2);
    });
    totalEl.textContent = '₹' + total.toFixed(2);
  }

  function addStageRow() {
    const wrap = document.createElement('div');
    wrap.innerHTML = `
      <div class="stage-row">
        <div class="stage-fields">
          <label class="field field-wide-2">
            <span>Case Type</span>
            <select class="stage-type" required>
              <option value="">— Select —</option>
              ${priceList.map(p => `
                <option value="${p.id}" data-label="${escapeAttr(p.label)}"
                  data-price="${p.price}" data-type="${escapeAttr(p.case_type)}">
                  ${escapeHtml(p.case_type)}
                </option>`).join('')}
            </select>
          </label>
          <label class="field"><span>Qty</span>
            <input type="number" class="stage-qty" min="1" value="1" required /></label>
          <label class="field"><span>Price</span>
            <input type="text" class="stage-price" readonly value="₹0.00" /></label>
          <button type="button" class="stage-remove" title="Remove">×</button>
        </div>
      </div>`;
    stagesList.appendChild(wrap.firstElementChild);
    recalcTotals();
  }

  stagesList.addEventListener('change', recalcTotals);
  stagesList.addEventListener('input',  recalcTotals);
  stagesList.addEventListener('click', (e) => {
    if (e.target.classList.contains('stage-remove')) {
      e.target.closest('.stage-row').remove();
      recalcTotals();
    }
  });

  root.querySelector('#edit-add-stage').onclick = addStageRow;
  root.querySelector('#edit-close').onclick  = () => { root.innerHTML = ''; };
  root.querySelector('#edit-cancel').onclick = () => openCaseDetail(c.id);

  recalcTotals();

  root.querySelector('#edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = root.querySelector('#edit-msg');
    msg.textContent = ''; msg.className = 'auth-msg';

    const newStages = [...stagesList.querySelectorAll('.stage-row')].map((row, i) => {
      const opt = row.querySelector('.stage-type').selectedOptions[0];
      return {
        position:   i,
        case_type:  opt?.dataset.type ?? '',
        label:      opt?.dataset.label ?? '',
        unit_price: Number(opt?.dataset.price ?? 0),
        quantity:   Number(row.querySelector('.stage-qty').value) || 1,
      };
    }).filter(s => s.case_type);

    if (!newStages.length) {
      msg.textContent = 'Add at least one stage.'; msg.className = 'auth-msg error'; return;
    }

    const saveBtn = root.querySelector('#edit-save');
    saveBtn.disabled = true; saveBtn.textContent = 'Saving…';

    const { error: upErr } = await supabase.from('cases').update({
      received_date:      root.querySelector('#e-received').value,
      delivery_date:      root.querySelector('#e-delivery').value || null,
      doctor_name:        root.querySelector('#e-doctor').value.trim(),
      patient_identifier: root.querySelector('#e-patient').value.trim() || null,
    }).eq('id', c.id);

    if (upErr) {
      msg.textContent = upErr.message; msg.className = 'auth-msg error';
      saveBtn.disabled = false; saveBtn.textContent = 'Save changes'; return;
    }

    await supabase.from('case_stages').delete().eq('case_id', c.id);
    const { error: insErr } = await supabase.from('case_stages')
      .insert(newStages.map(s => ({ ...s, case_id: c.id })));

    if (insErr) {
      msg.textContent = insErr.message; msg.className = 'auth-msg error';
      saveBtn.disabled = false; saveBtn.textContent = 'Save changes'; return;
    }

    root.innerHTML = '';
    await refresh();
  });
}

// ================= REFRESH =================
async function refresh() {
  await loadData();
  const s = computeStats(allCases);
  const statsRow = document.querySelector('.stats-row');
  if (statsRow) {
    statsRow.innerHTML = [
      statCard('Total', s.total),
      statCard('In Queue', s.inQueue, 'primary'),
      statCard('Overdue', s.overdue, 'danger'),
      statCard('Unpaid', '₹' + s.unpaid.toFixed(0), 'warning'),
    ].join('');
  }
  paintRows();
}

// ================= NEW CASE (full page) =================
function stageRowHtml() {
  return `
    <div class="stage-row">
      <div class="stage-fields">
        <label class="field field-wide-2">
          <span>Case Type</span>
          <select class="stage-type" required>
            <option value="">— Select a case type —</option>
            ${priceList.map(p => `
              <option value="${p.id}" data-label="${escapeAttr(p.label)}"
                data-price="${p.price}" data-type="${escapeAttr(p.case_type)}">
                ${escapeHtml(p.case_type)}
              </option>`).join('')}
          </select>
        </label>
        <label class="field"><span>Qty</span>
          <input type="number" class="stage-qty" min="1" value="1" required /></label>
        <label class="field"><span>Price</span>
          <input type="text" class="stage-price" readonly value="₹0.00" /></label>
        <button type="button" class="stage-remove" title="Remove" hidden>×</button>
      </div>
    </div>
  `;
}

export async function renderNewCase() {
  await loadData();
  const doctors = [...new Set(allCases.map(c => c.doctor_name).filter(Boolean))].sort();

  return `
    <div class="page-header">
      <div class="page-header-left">
        <a href="#/cases" class="back-link">← Cases</a>
        <h3>New Case</h3>
      </div>
    </div>

    <form id="case-form" class="case-form">
      <div class="form-card neu-card">
        <div class="form-section">
          <div class="section-head"><h4>Case details</h4></div>
          <div class="form-grid">
            <label class="field"><span>Received</span>
              <input type="date" id="f-received" value="${today()}" required /></label>
            <label class="field"><span>Delivery</span>
              <input type="date" id="f-delivery" /></label>
            <label class="field"><span>Doctor</span>
              <input type="text" id="f-doctor" list="doctors-list" required />
              <datalist id="doctors-list">
                ${doctors.map(d => `<option value="${escapeAttr(d)}"></option>`).join('')}
              </datalist></label>
            <label class="field"><span>Patient / Case ID</span>
              <input type="text" id="f-patient" /></label>
          </div>
        </div>

        <div class="form-section">
          <div class="section-head">
            <h4>Stages</h4>
            <button type="button" class="btn-ghost" id="add-stage">+ Add stage</button>
          </div>
          <div id="stages-list"></div>
          <div class="case-total-row"><span>Case total</span><b id="case-total">₹0.00</b></div>
        </div>

        <div class="form-section">
          <div class="section-head"><h4>Notes</h4></div>
          <textarea id="f-notes" rows="3"></textarea>
        </div>

        <div class="form-actions">
          <a href="#/cases" class="btn-ghost">Cancel</a>
          <button type="submit" class="btn-primary" id="save-case">Save Case</button>
        </div>
        <p id="case-msg" class="auth-msg"></p>
      </div>
    </form>
  `;
}

export function wireNewCase() {
  const form = document.getElementById('case-form');
  const msg  = document.getElementById('case-msg');
  const saveBtn = document.getElementById('save-case');
  const stagesList = document.getElementById('stages-list');
  const totalEl = document.getElementById('case-total');

  function updateRemoveButtons() {
    const rows = stagesList.querySelectorAll('.stage-row');
    rows.forEach(row => {
      const btn = row.querySelector('.stage-remove');
      if (btn) btn.hidden = rows.length === 1;
    });
  }

  function recalcTotals() {
    let total = 0;
    stagesList.querySelectorAll('.stage-row').forEach(row => {
      const qty = Number(row.querySelector('.stage-qty').value) || 0;
      const opt = row.querySelector('.stage-type').selectedOptions[0];
      const price = opt && opt.value ? Number(opt.dataset.price) || 0 : 0;
      total += qty * price;
      row.querySelector('.stage-price').value = '₹' + (qty * price).toFixed(2);
    });
    totalEl.textContent = '₹' + total.toFixed(2);
  }

  function addStage() {
    const wrap = document.createElement('div');
    wrap.innerHTML = stageRowHtml();
    stagesList.appendChild(wrap.firstElementChild);
    updateRemoveButtons();
    recalcTotals();
  }

  stagesList.addEventListener('change', recalcTotals);
  stagesList.addEventListener('input',  recalcTotals);
  stagesList.addEventListener('click', (e) => {
    if (e.target.classList.contains('stage-remove')) {
      e.target.closest('.stage-row').remove();
      updateRemoveButtons();
      recalcTotals();
    }
  });
  document.getElementById('add-stage').onclick = addStage;

  form.querySelectorAll('input[type="date"]').forEach(inp => {
    inp.addEventListener('click', () => {
      if (typeof inp.showPicker === 'function') { try { inp.showPicker(); } catch {} }
    });
  });

  addStage();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const stages = [...stagesList.querySelectorAll('.stage-row')].map((row, i) => {
      const opt = row.querySelector('.stage-type').selectedOptions[0];
      return {
        position:   i,
        case_type:  opt?.dataset.type ?? '',
        label:      opt?.dataset.label ?? '',
        unit_price: Number(opt?.dataset.price ?? 0),
        quantity:   Number(row.querySelector('.stage-qty').value) || 1,
      };
    }).filter(s => s.case_type);

    if (!stages.length) {
      msg.textContent = 'Add at least one stage with a case type.';
      msg.className = 'auth-msg error';
      return;
    }

    saveBtn.disabled = true; saveBtn.textContent = 'Saving…';

    const { data: caseRow, error: caseErr } = await supabase.from('cases').insert({
      received_date:      document.getElementById('f-received').value,
      delivery_date:      document.getElementById('f-delivery').value || null,
      doctor_name:        document.getElementById('f-doctor').value.trim(),
      patient_identifier: document.getElementById('f-patient').value.trim() || null,
      notes:              document.getElementById('f-notes').value.trim() || null,
      status:             'in-queue',
      payment_status:     false,
    }).select().single();

    if (caseErr) {
      msg.textContent = caseErr.message; msg.className = 'auth-msg error';
      saveBtn.disabled = false; saveBtn.textContent = 'Save Case';
      return;
    }

    const { error: stageErr } = await supabase.from('case_stages')
      .insert(stages.map(s => ({ ...s, case_id: caseRow.id })));

    if (stageErr) {
      await supabase.from('cases').delete().eq('id', caseRow.id);
      msg.textContent = stageErr.message; msg.className = 'auth-msg error';
      saveBtn.disabled = false; saveBtn.textContent = 'Save Case';
      return;
    }

    window.location.hash = '#/cases';
    window.location.reload();
  });
}
