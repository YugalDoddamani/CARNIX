import { supabase } from '../supabase.js';

let allCases = [];
let activeFilter = 'all';
let searchQuery = '';
let priceList = [];
let stageCounter = 0;

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
const today = () => new Date().toISOString().slice(0, 10);

const caseTotal = c =>
  (c.case_stages ?? []).reduce((s, st) => s + Number(st.amount || 0), 0);

function isOverdue(c) {
  if (!c.delivery_date) return false;
  if (c.status === 'delivered' || c.status === 'complete') return false;
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
  if (activeFilter === 'delivered') list = list.filter(c => c.status === 'delivered' || c.status === 'complete');
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
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function statCard(label, value, tone = '') {
  return `<div class="stat-card ${tone ? 'tone-' + tone : ''}">
    <span class="stat-label">${label}</span>
    <span class="stat-value">${value}</span>
  </div>`;
}

function renderRows(list) {
  if (!list.length) {
    return `<tr><td colspan="7" class="empty-row">No cases yet</td></tr>`;
  }
  return list.map(c => {
    const overdue = isOverdue(c);
    const total = caseTotal(c);
    const stages = c.case_stages ?? [];
    const primaryType = stages[0]?.case_type ?? '—';
    const stageNote = stages.length > 1 ? ` <span class="stage-count">+${stages.length - 1}</span>` : '';
    const statusLabel = overdue ? 'Overdue'
                      : c.status === 'complete' ? 'Complete'
                      : c.status === 'delivered' ? 'Delivered'
                      : 'In Queue';
    const statusClass = overdue ? 'danger'
                      : (c.status === 'delivered' || c.status === 'complete') ? 'success'
                      : 'primary';

    return `<tr data-id="${c.id}">
      <td data-label="Received">${fmtDate(c.received_date)}</td>
      <td data-label="Doctor">
        <div class="cell-main">${escapeHtml(c.doctor_name)}</div>
        ${c.patient_identifier ? `<div class="cell-sub">${escapeHtml(c.patient_identifier)}</div>` : ''}
      </td>
      <td data-label="Case">
        <div class="cell-main">${escapeHtml(primaryType)}${stageNote}</div>
        ${stages.length > 1 ? `<div class="cell-sub">${stages.length} stages</div>` : ''}
      </td>
      <td data-label="Total">₹${total.toFixed(0)}</td>
      <td data-label="Delivery" class="${overdue ? 'cell-overdue' : ''}">${fmtDate(c.delivery_date)}</td>
      <td data-label="Status">
        <span class="badge badge-${statusClass}">${statusLabel}</span>
        ${!c.payment_status ? `<span class="badge badge-warning">Unpaid</span>` : ''}
      </td>
      <td data-label="" class="row-actions">
        <button class="btn-ghost danger" data-action="delete" data-id="${c.id}">Delete</button>
      </td>
    </tr>`;
  }).join('');
}

// ================= LIST VIEW =================
export async function renderCases() {
  await loadData();

  const s = computeStats(allCases);

  return `
    <div class="page-header">
      <h3>Cases</h3>
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

    <div class="table-wrap neu-card">
      <table class="data-table" id="cases-table">
        <thead>
          <tr>
            <th>Received</th>
            <th>Doctor</th>
            <th>Case</th>
            <th>Total</th>
            <th>Delivery</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="cases-rows">${renderRows(filterCases())}</tbody>
      </table>
    </div>
  `;
}

export function wireCases() {
  document.querySelectorAll('.chip[data-filter]').forEach(chip => {
    chip.addEventListener('click', () => {
      activeFilter = chip.dataset.filter;
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      document.getElementById('cases-rows').innerHTML = renderRows(filterCases());
    });
  });

  const search = document.getElementById('case-search');
  let searchTimer;
  search?.addEventListener('input', e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      searchQuery = e.target.value.trim();
      document.getElementById('cases-rows').innerHTML = renderRows(filterCases());
    }, 180);
  });

  document.getElementById('cases-rows')?.addEventListener('click', async e => {
    const btn = e.target.closest('button[data-action="delete"]');
    if (!btn) return;
    if (!confirm('Delete this case?')) return;
    const { error } = await supabase.from('cases').delete().eq('id', btn.dataset.id);
    if (error) return alert(error.message);
    await renderCases();
    // Re-render list view
    window.location.hash = '#/cases';
    window.location.reload();
  });
}

// ================= FORM VIEW =================
function stageRowHtml() {
  return `
    <div class="stage-row">
      <div class="stage-fields">
        <label class="field field-wide-2">
          <span>Case Type</span>
          <select class="stage-type" required>
            <option value="">— Select a case type —</option>
            ${priceList.map(p => `
              <option value="${p.id}"
                data-label="${escapeAttr(p.label)}"
                data-price="${p.price}"
                data-type="${escapeAttr(p.case_type)}">
                ${escapeHtml(p.case_type)}
              </option>`).join('')}
          </select>
        </label>
        <label class="field">
          <span>Qty</span>
          <input type="number" class="stage-qty" min="1" value="1" required />
        </label>
        <label class="field">
          <span>Price</span>
          <input type="text" class="stage-price" readonly value="₹0.00" />
        </label>
        <button type="button" class="stage-remove" title="Remove stage" hidden>×</button>
      </div>
      <div class="stage-label"></div>
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
          <div class="section-head">
            <h4>Case details</h4>
          </div>
          <div class="form-grid">
            <label class="field">
              <span>Received</span>
              <input type="date" id="f-received" value="${today()}" required />
            </label>
            <label class="field">
              <span>Delivery</span>
              <input type="date" id="f-delivery" />
            </label>
            <label class="field">
              <span>Doctor</span>
              <input type="text" id="f-doctor" list="doctors-list" placeholder="Doctor name" required />
              <datalist id="doctors-list">
                ${doctors.map(d => `<option value="${escapeAttr(d)}"></option>`).join('')}
              </datalist>
            </label>
            <label class="field">
              <span>Patient / Case ID</span>
              <input type="text" id="f-patient" placeholder="Optional" />
            </label>
          </div>
        </div>

        <div class="form-section">
          <div class="section-head">
            <h4>Stages</h4>
            <button type="button" class="btn-ghost" id="add-stage">+ Add stage</button>
          </div>
          <div id="stages-list"></div>
          <div class="case-total-row">
            <span>Case total</span>
            <b id="case-total">₹0.00</b>
          </div>
        </div>

        <div class="form-section">
          <div class="section-head"><h4>Notes</h4></div>
          <label class="field">
            <textarea id="f-notes" rows="3" placeholder="Optional notes about this case"></textarea>
          </label>
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
    rows.forEach((row, i) => {
      const btn = row.querySelector('.stage-remove');
      if (btn) btn.hidden = rows.length === 1;
    });
  }

  function recalcTotals() {
    let caseTotal = 0;
    stagesList.querySelectorAll('.stage-row').forEach(row => {
      const qty = Number(row.querySelector('.stage-qty').value) || 0;
      const sel = row.querySelector('.stage-type');
      const opt = sel.selectedOptions[0];
      const price = opt && opt.value ? Number(opt.dataset.price) || 0 : 0;
      const line = qty * price;
      caseTotal += line;
      row.querySelector('.stage-price').value = '₹' + line.toFixed(2);
      const labelEl = row.querySelector('.stage-label');
      const label = opt && opt.value ? (opt.dataset.label || '') : '';
      labelEl.textContent = label ? `Label: ${label}` : '';
    });
    totalEl.textContent = '₹' + caseTotal.toFixed(2);
  }

  function addStage() {
    const wrap = document.createElement('div');
    wrap.innerHTML = stageRowHtml();
    const row = wrap.firstElementChild;
    stagesList.appendChild(row);
    updateRemoveButtons();
    recalcTotals();
    row.querySelector('.stage-type').focus();
  }

  // Date inputs: click anywhere opens the native picker
function openDatePicker(input) {
  if (typeof input.showPicker === 'function') {
    try { input.showPicker(); } catch (e) {}
  }
}
document.addEventListener('click', (e) => {
  const el = e.target;
  if (el.matches('input[type="date"]')) openDatePicker(el);
});

  stagesList.addEventListener('change', recalcTotals);
  stagesList.addEventListener('input',  recalcTotals);
  stagesList.addEventListener('click', (e) => {
    if (e.target.classList.contains('stage-remove')) {
      e.target.closest('.stage-row').remove();
      updateRemoveButtons();
      recalcTotals();
    }
  });

  document.getElementById('add-stage').addEventListener('click', addStage);

  // Seed with one stage
  addStage();

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';
    msg.className = 'auth-msg';

    const rows = [...stagesList.querySelectorAll('.stage-row')];
    const stages = rows.map((row, i) => {
      const sel = row.querySelector('.stage-type');
      const opt = sel.selectedOptions[0];
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

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';

    const casePayload = {
      received_date:      document.getElementById('f-received').value,
      delivery_date:      document.getElementById('f-delivery').value || null,
      doctor_name:        document.getElementById('f-doctor').value.trim(),
      patient_identifier: document.getElementById('f-patient').value.trim() || null,
      notes:              document.getElementById('f-notes').value.trim() || null,
      status:             'in-queue',
      payment_status:     false,
    };

    const { data: caseRow, error: caseErr } = await supabase
      .from('cases').insert(casePayload).select().single();

    if (caseErr) {
      msg.textContent = caseErr.message;
      msg.className = 'auth-msg error';
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Case';
      return;
    }

    const stagePayload = stages.map(s => ({ ...s, case_id: caseRow.id }));
    const { error: stageErr } = await supabase.from('case_stages').insert(stagePayload);

    if (stageErr) {
      await supabase.from('cases').delete().eq('id', caseRow.id);
      msg.textContent = stageErr.message;
      msg.className = 'auth-msg error';
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Case';
      return;
    }

    window.location.hash = '#/cases';
    window.location.reload();
  });
}
