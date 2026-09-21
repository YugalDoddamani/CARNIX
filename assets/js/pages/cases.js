import { supabase } from '../supabase.js';

let allCases = [];
let activeFilter = 'all';
let searchQuery = '';
let priceList = [];

// ---------- Data load ----------
async function loadData() {
  const { data: cases, error } = await supabase
    .from('cases')
    .select('*')
    .order('received_date', { ascending: false })
    .limit(500);
  if (error) throw error;
  allCases = cases ?? [];

  const { data: prices } = await supabase
    .from('price_list')
    .select('id, case_type, label, price')
    .eq('active', true)
    .order('case_type');
  priceList = prices ?? [];
}

// ---------- Helpers ----------
const today = () => new Date().toISOString().slice(0, 10);

function isOverdue(c) {
  if (!c.delivery_date) return false;
  if (c.status === 'delivered' || c.status === 'complete') return false;
  return new Date(c.delivery_date) < new Date(today());
}

function computeStats(list) {
  const inQueue = list.filter(c => c.status === 'in-queue').length;
  const overdue = list.filter(isOverdue).length;
  const unpaid = list
    .filter(c => !c.payment_status)
    .reduce((s, c) => s + Number(c.calculated_price || 0), 0);
  return { total: list.length, inQueue, overdue, unpaid };
}

function filterCases() {
  let list = allCases;
  if (activeFilter === 'in-queue') list = list.filter(c => c.status === 'in-queue');
  else if (activeFilter === 'delivered') list = list.filter(c => c.status === 'delivered' || c.status === 'complete');
  else if (activeFilter === 'overdue') list = list.filter(isOverdue);
  else if (activeFilter === 'unpaid') list = list.filter(c => !c.payment_status);

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    list = list.filter(c =>
      (c.doctor_name ?? '').toLowerCase().includes(q) ||
      (c.case_type ?? '').toLowerCase().includes(q) ||
      (c.patient_identifier ?? '').toLowerCase().includes(q)
    );
  }
  return list;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
function escapeAttr(s) { return escapeHtml(s); }

function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function statCard(label, value, tone = '') {
  return `
    <div class="stat-card ${tone ? 'tone-' + tone : ''}">
      <span class="stat-label">${label}</span>
      <span class="stat-value">${value}</span>
    </div>
  `;
}

function renderRows(list) {
  if (!list.length) {
    return `<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:32px">No cases yet</td></tr>`;
  }
  return list.map(c => {
    const overdue = isOverdue(c);
    const paid = c.payment_status;
    return `
      <tr data-id="${c.id}">
        <td data-label="Received">${fmtDate(c.received_date)}</td>
        <td data-label="Doctor"><b>${escapeHtml(c.doctor_name)}</b></td>
        <td data-label="Case">
          ${escapeHtml(c.case_type)}
          ${c.patient_identifier ? `<div class="row-sub">${escapeHtml(c.patient_identifier)}</div>` : ''}
        </td>
        <td data-label="Qty">${c.quantity}</td>
        <td data-label="Total">₹${Number(c.calculated_price || 0).toFixed(0)}</td>
        <td data-label="Delivery" class="${overdue ? 'cell-overdue' : ''}">${fmtDate(c.delivery_date)}</td>
        <td data-label="Status">
          <span class="badge badge-${overdue ? 'danger' : c.status === 'delivered' || c.status === 'complete' ? 'success' : 'primary'}">
            ${overdue ? 'Overdue' : c.status === 'complete' ? 'Complete' : c.status === 'delivered' ? 'Delivered' : 'In Queue'}
          </span>
          ${!paid ? `<span class="badge badge-warning" style="margin-left:4px">Unpaid</span>` : ''}
        </td>
        <td data-label="" class="row-actions">
          <button class="btn-ghost danger" data-action="delete" data-id="${c.id}">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

// ---------- Main render ----------
export async function renderCases() {
  await loadData();

  const doctors = [...new Set(allCases.map(c => c.doctor_name).filter(Boolean))].sort();
  const stats = computeStats(allCases);
  const rows = renderRows(filterCases());

  return `
    <div class="page-header">
      <h3>Cases</h3>
      <button class="btn-primary" id="new-case-btn">+ New Case</button>
    </div>

    <div class="stats-row">
      ${statCard('Total', stats.total)}
      ${statCard('In Queue', stats.inQueue, 'primary')}
      ${statCard('Overdue', stats.overdue, 'danger')}
      ${statCard('Unpaid', '₹' + stats.unpaid.toFixed(0), 'warning')}
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
             placeholder="Search doctor or case…" value="${escapeAttr(searchQuery)}" />
    </div>

    <div class="table-wrap neu-card">
      <table class="data-table" id="cases-table">
        <thead>
          <tr>
            <th>Received</th>
            <th>Doctor</th>
            <th>Case</th>
            <th>Qty</th>
            <th>Total</th>
            <th>Delivery</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="cases-rows">${rows}</tbody>
      </table>
    </div>

    <!-- New Case Modal -->
    <div class="modal-backdrop" id="case-modal" hidden>
      <div class="modal neu-card">
        <h3>New Case</h3>
        <form id="case-form">
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

            <label class="field field-wide">
              <span>Case Type</span>
              <select id="f-case-type" required>
                <option value="">— Select —</option>
                ${priceList.map(p => `
                  <option value="${p.id}"
                    data-label="${escapeAttr(p.label)}"
                    data-price="${p.price}"
                    data-type="${escapeAttr(p.case_type)}">
                    ${escapeHtml(p.case_type)} — ₹${p.price}
                  </option>
                `).join('')}
              </select>
            </label>

            <label class="field">
              <span>Label</span>
              <input type="text" id="f-label" readonly />
            </label>

            <label class="field">
              <span>Unit Price (₹)</span>
              <input type="number" id="f-price" step="0.01" min="0" required />
            </label>

            <label class="field">
              <span>Quantity</span>
              <input type="number" id="f-qty" min="1" value="1" required />
            </label>

            <label class="field">
              <span>Total (₹)</span>
              <input type="text" id="f-total" readonly />
            </label>

            <label class="field field-wide">
              <span>Notes</span>
              <textarea id="f-notes" rows="2" placeholder="Optional"></textarea>
            </label>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn-ghost" id="cancel-case">Cancel</button>
            <button type="submit" class="btn-primary" id="save-case">Save Case</button>
          </div>
          <p id="case-msg" class="auth-msg"></p>
        </form>
      </div>
    </div>
  `;
}

// ---------- Post-render wiring ----------
export function wireCases() {
  const modal  = document.getElementById('case-modal');
  const form   = document.getElementById('case-form');
  const msg    = document.getElementById('case-msg');
  const saveBtn = document.getElementById('save-case');

  const caseSel = document.getElementById('f-case-type');
  const labelF  = document.getElementById('f-label');
  const priceF  = document.getElementById('f-price');
  const qtyF    = document.getElementById('f-qty');
  const totalF  = document.getElementById('f-total');

  // Open / close modal
  const openModal = () => {
    form.reset();
    document.getElementById('f-received').value = today();
    document.getElementById('f-qty').value = 1;
    labelF.value = '';
    priceF.value = '';
    totalF.value = '';
    msg.textContent = '';
    msg.className = 'auth-msg';
    modal.hidden = false;
    setTimeout(() => document.getElementById('f-doctor').focus(), 50);
  };
  const closeModal = () => { modal.hidden = true; };

  document.getElementById('new-case-btn')?.addEventListener('click', openModal);
  document.getElementById('cancel-case')?.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  // Filter chips
  document.querySelectorAll('.chip[data-filter]').forEach(chip => {
    chip.addEventListener('click', () => {
      activeFilter = chip.dataset.filter;
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      document.getElementById('cases-rows').innerHTML = renderRows(filterCases());
    });
  });

  // Search
  const search = document.getElementById('case-search');
  let searchTimer;
  search?.addEventListener('input', e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      searchQuery = e.target.value.trim();
      document.getElementById('cases-rows').innerHTML = renderRows(filterCases());
    }, 180);
  });

  // Case type → auto-fill label, price, total
  const recalc = () => {
    const q = Number(qtyF.value) || 0;
    const p = Number(priceF.value) || 0;
    totalF.value = (q * p).toFixed(2);
  };

  caseSel?.addEventListener('change', () => {
    const opt = caseSel.selectedOptions[0];
    if (!opt || !opt.value) {
      labelF.value = ''; priceF.value = ''; totalF.value = '';
      return;
    }
    labelF.value = opt.dataset.label || '';
    priceF.value = opt.dataset.price || '';
    recalc();
  });

  priceF?.addEventListener('input', recalc);
  qtyF?.addEventListener('input', recalc);

  // Submit
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.textContent = '';
    msg.className = 'auth-msg';
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';

    const opt = caseSel.selectedOptions[0];
    const payload = {
      received_date:      document.getElementById('f-received').value,
      delivery_date:      document.getElementById('f-delivery').value || null,
      doctor_name:        document.getElementById('f-doctor').value.trim(),
      patient_identifier: document.getElementById('f-patient').value.trim() || null,
      case_type:          opt?.dataset.type || '',
      label:              labelF.value,
      unit_price:         Number(priceF.value) || 0,
      quantity:           Number(qtyF.value) || 1,
      notes:              document.getElementById('f-notes').value.trim() || null,
      status:             'in-queue',
      payment_status:     false,
    };

    const { error } = await supabase.from('cases').insert(payload);

    if (error) {
      msg.textContent = error.message;
      msg.className = 'auth-msg error';
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Case';
      return;
    }

    closeModal();
    // Reload page data + re-render
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
    document.getElementById('cases-rows').innerHTML = renderRows(filterCases());
  });

  // Delete row
  document.getElementById('cases-rows')?.addEventListener('click', async e => {
    const btn = e.target.closest('button[data-action="delete"]');
    if (!btn) return;
    if (!confirm('Delete this case?')) return;
    const { error } = await supabase.from('cases').delete().eq('id', btn.dataset.id);
    if (error) return alert(error.message);
    await loadData();
    document.getElementById('cases-rows').innerHTML = renderRows(filterCases());
  });
}
