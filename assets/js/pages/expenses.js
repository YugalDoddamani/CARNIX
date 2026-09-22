import { supabase } from '../supabase.js';

let allExpenses = [];
let activeCategory = 'all';
let activeMonth = ''; // YYYY-MM, empty = all
let searchQuery = '';

const today = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

const currentMonth = () => today().slice(0, 7);

const CATEGORIES = [
  'Consumables',
  'Equipment',
  'Software',
  'Improvement',
  'Asset',
  'Rent',
  'Utilities',
  'Salary',
  'Marketing',
  'Other',
];

const PAYMENT_TYPES = ['One time', 'EMI', 'Recurring'];
const PAID_FROM = ['Kotak', 'Yugal', 'Muskan', 'Cash', 'Other'];

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
const escapeAttr = escapeHtml;

function fmtShort(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}
function fmtLong(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ---------- Load ----------
async function loadData() {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false })
    .limit(1000);
  if (error) throw error;
  allExpenses = data ?? [];
}

// ---------- Compute ----------
function computeStats(list) {
  const monthKey = currentMonth();
  const thisMonth = list.filter(e => (e.date ?? '').startsWith(monthKey));
  const sum = arr => arr.reduce((s, e) => s + Number(e.amount || 0), 0);
  return {
    total: sum(list),
    thisMonth: sum(thisMonth),
    thisMonthCount: thisMonth.length,
    assets: sum(list.filter(e => e.is_asset)),
  };
}

function filterExpenses() {
  let list = allExpenses;
  if (activeCategory !== 'all') list = list.filter(e => e.category === activeCategory);
  if (activeMonth) list = list.filter(e => (e.date ?? '').startsWith(activeMonth));
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    list = list.filter(e =>
      (e.vendor ?? '').toLowerCase().includes(q) ||
      (e.description ?? '').toLowerCase().includes(q) ||
      (e.category ?? '').toLowerCase().includes(q)
    );
  }
  return list;
}

function statCard(label, value, tone = '') {
  return `<div class="stat-card ${tone ? 'tone-' + tone : ''}">
    <span class="stat-label">${label}</span>
    <span class="stat-value">${value}</span>
  </div>`;
}

// ---------- Table rows ----------
function renderRows(list) {
  if (!list.length) {
    return `<tr><td colspan="7" class="empty-row">No expenses yet</td></tr>`;
  }
  return list.map(e => `
    <tr data-id="${e.id}" class="expense-row">
      <td data-label="Date">${fmtShort(e.date)}</td>
      <td data-label="Category">
        <span class="badge badge-neutral">${escapeHtml(e.category)}</span>
      </td>
      <td data-label="Vendor / Description">
        <div class="cell-main">${escapeHtml(e.vendor || '—')}</div>
        ${e.description ? `<div class="cell-sub">${escapeHtml(e.description)}</div>` : ''}
      </td>
      <td data-label="Paid from">${escapeHtml(e.paid_from || '—')}</td>
      <td data-label="Amount" class="num"><b>₹${Number(e.amount).toFixed(2)}</b></td>
      <td data-label="Type">
        ${e.is_asset ? '<span class="badge badge-success">Asset</span>' : ''}
        ${e.frequency ? `<span class="badge badge-neutral">${escapeHtml(e.frequency)}</span>` : ''}
      </td>
      <td data-label="" class="row-actions">
        <button class="kebab-btn" data-action="menu" data-id="${e.id}" aria-label="Actions">⋯</button>
      </td>
    </tr>
  `).join('');
}

// ---------- List view ----------
export async function renderExpenses() {
  await loadData();
  const s = computeStats(allExpenses);
  const filtered = filterExpenses();

  return `
    <div class="page-header-actions">
      <button class="btn-primary" id="new-expense-btn">+ New Expense</button>
    </div>

    <div class="stats-row">
      ${statCard('This month', '₹' + s.thisMonth.toFixed(0), 'primary')}
      ${statCard('Entries this month', s.thisMonthCount)}
      ${statCard('Total logged', '₹' + s.total.toFixed(0), 'warning')}
      ${statCard('Assets', '₹' + s.assets.toFixed(0))}
    </div>

    <div class="filter-row">
      <div class="chips">
        <button class="chip ${activeCategory === 'all' ? 'active' : ''}" data-cat="all">All</button>
        ${CATEGORIES.map(c => `
          <button class="chip ${activeCategory === c ? 'active' : ''}" data-cat="${escapeAttr(c)}">${escapeHtml(c)}</button>
        `).join('')}
      </div>
      <div class="filter-row-right">
        <input type="month" id="exp-month" class="search-input" value="${escapeAttr(activeMonth)}" />
        <input type="search" id="exp-search" class="search-input" placeholder="Search vendor, description…" value="${escapeAttr(searchQuery)}" />
      </div>
    </div>

    <div class="table-wrap neu-card desktop-only">
      <table class="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Category</th>
            <th>Vendor / Description</th>
            <th>Paid from</th>
            <th class="num">Amount</th>
            <th>Type</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="expense-rows">${renderRows(filtered)}</tbody>
      </table>
    </div>

    <div class="mobile-cases mobile-only" id="expense-rows-mobile">
      ${renderMobileRows(filtered)}
    </div>

    <div id="modal-root"></div>
  `;
}

function renderMobileRows(list) {
  if (!list.length) return `<div class="empty-row">No expenses yet</div>`;
  return list.map(e => `
    <div class="mcase-row" data-id="${e.id}">
      <div class="mcase-head">
        <b class="mcase-doctor">${escapeHtml(e.vendor || e.category)}</b>
        <button class="kebab-btn" data-action="menu" data-id="${e.id}" aria-label="Actions">⋯</button>
      </div>
      <div class="mcase-type">${escapeHtml(e.description || e.category)}</div>
      <div class="mcase-dates">
        <span>${fmtShort(e.date)}</span>
        ${e.paid_from ? `<span class="mcase-arrow">·</span><span>${escapeHtml(e.paid_from)}</span>` : ''}
      </div>
      <div class="mcase-badges">
        <span class="badge badge-neutral">₹${Number(e.amount).toFixed(0)}</span>
        ${e.is_asset ? '<span class="badge badge-success">Asset</span>' : ''}
      </div>
    </div>
  `).join('');
}

// ---------- Wiring ----------
export function wireExpenses() {
  document.querySelectorAll('.chip[data-cat]').forEach(chip => {
    chip.addEventListener('click', () => {
      activeCategory = chip.dataset.cat;
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      paintRows();
    });
  });

  const monthInput = document.getElementById('exp-month');
  monthInput?.addEventListener('change', () => {
    activeMonth = monthInput.value || '';
    paintRows();
  });

  const search = document.getElementById('exp-search');
  let timer;
  search?.addEventListener('input', e => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      searchQuery = e.target.value.trim();
      paintRows();
    }, 180);
  });

  document.getElementById('new-expense-btn')?.addEventListener('click', () => openForm());

  const appRoot = document.getElementById('app');
  appRoot.addEventListener('click', (e) => {
    const kebab = e.target.closest('button[data-action="menu"]');
    if (kebab) {
      e.stopPropagation();
      const exp = allExpenses.find(x => x.id === kebab.dataset.id);
      if (exp) openActions(exp);
    }
  });

  function paintRows() {
    const f = filterExpenses();
    const dt = document.getElementById('expense-rows');
    const mb = document.getElementById('expense-rows-mobile');
    if (dt) dt.innerHTML = renderRows(f);
    if (mb) mb.innerHTML = renderMobileRows(f);

    const s = computeStats(allExpenses);
    const stats = document.querySelector('.stats-row');
    if (stats) {
      stats.innerHTML = [
        statCard('This month', '₹' + s.thisMonth.toFixed(0), 'primary'),
        statCard('Entries this month', s.thisMonthCount),
        statCard('Total logged', '₹' + s.total.toFixed(0), 'warning'),
        statCard('Assets', '₹' + s.assets.toFixed(0)),
      ].join('');
    }
  }
}

// ---------- Actions menu ----------
function openActions(exp) {
  document.getElementById('kebab-menu-root')?.remove();
  const menu = document.createElement('div');
  menu.id = 'kebab-menu-root';
  menu.className = 'kebab-menu-root';
  menu.innerHTML = `
    <div class="kebab-backdrop"></div>
    <div class="kebab-sheet">
      <button class="kebab-action" data-action="edit">Edit</button>
      <button class="kebab-action danger" data-action="delete">Delete</button>
    </div>
  `;
  document.body.appendChild(menu);
  const close = () => menu.remove();
  menu.querySelector('.kebab-backdrop').addEventListener('click', close);
  menu.querySelector('[data-action="edit"]').onclick = () => { close(); openForm(exp); };
  menu.querySelector('[data-action="delete"]').onclick = async () => {
    close();
    if (!confirm(`Delete "${exp.vendor || exp.category}" · ₹${Number(exp.amount).toFixed(2)}?`)) return;
    const { error } = await supabase.from('expenses').delete().eq('id', exp.id);
    if (error) return alert(error.message);
    await refreshAll();
  };
}

// ---------- Form (modal) ----------
function renderForm(exp = null) {
  const isEdit = !!exp;
  const e = exp ?? {
    date: today(),
    category: '',
    vendor: '',
    description: '',
    amount: '',
    payment_type: 'One time',
    status: 'Paid',
    paid_from: '',
    frequency: '',
    is_asset: false,
    notes: '',
  };

  return `
    <div class="case-modal-backdrop" id="expense-modal">
      <div class="case-modal">
        <div class="case-modal-header">
          <div>
            <div class="case-modal-eyebrow">${isEdit ? 'Edit expense' : 'New expense'}</div>
            <h3>${isEdit ? escapeHtml(e.vendor || e.category) : 'Add Expense'}</h3>
          </div>
          <button class="modal-close" id="exp-close">×</button>
        </div>

        <form id="exp-form">
          <div class="form-section">
            <div class="form-grid">
              <label class="field"><span>Date</span>
                <input type="date" id="x-date" value="${e.date ?? ''}" required /></label>
              <label class="field"><span>Amount (₹)</span>
                <input type="number" step="0.01" min="0" id="x-amount" value="${e.amount ?? ''}" required /></label>
              <label class="field"><span>Category</span>
                <select id="x-category" required>
                  <option value="">— Select —</option>
                  ${CATEGORIES.map(c => `<option value="${escapeAttr(c)}" ${e.category === c ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('')}
                </select></label>
              <label class="field"><span>Vendor</span>
                <input type="text" id="x-vendor" value="${escapeAttr(e.vendor ?? '')}" list="vendor-list" />
                <datalist id="vendor-list">
                  ${[...new Set(allExpenses.map(x => x.vendor).filter(Boolean))].sort().map(v => `<option value="${escapeAttr(v)}"></option>`).join('')}
                </datalist></label>
              <label class="field field-wide"><span>Description</span>
                <input type="text" id="x-description" value="${escapeAttr(e.description ?? '')}" /></label>
              <label class="field"><span>Payment type</span>
                <select id="x-payment-type">
                  ${PAYMENT_TYPES.map(p => `<option value="${escapeAttr(p)}" ${e.payment_type === p ? 'selected' : ''}>${escapeHtml(p)}</option>`).join('')}
                </select></label>
              <label class="field"><span>Paid from</span>
                <select id="x-paid-from">
                  <option value="">— Select —</option>
                  ${PAID_FROM.map(p => `<option value="${escapeAttr(p)}" ${e.paid_from === p ? 'selected' : ''}>${escapeHtml(p)}</option>`).join('')}
                </select></label>
              <label class="field"><span>Frequency</span>
                <select id="x-frequency">
                  <option value="">None</option>
                  <option value="Repeating" ${e.frequency === 'Repeating' ? 'selected' : ''}>Repeating</option>
                  <option value="Recurring" ${e.frequency === 'Recurring' ? 'selected' : ''}>Recurring</option>
                </select></label>
              <label class="field"><span>Status</span>
                <select id="x-status">
                  <option value="Paid" ${e.status === 'Paid' ? 'selected' : ''}>Paid</option>
                  <option value="Pending" ${e.status === 'Pending' ? 'selected' : ''}>Pending</option>
                </select></label>
              <label class="field field-checkbox field-wide">
                <input type="checkbox" id="x-is-asset" ${e.is_asset ? 'checked' : ''} />
                <span>This is an asset</span>
              </label>
              <label class="field field-wide"><span>Notes</span>
                <textarea id="x-notes" rows="2">${escapeHtml(e.notes ?? '')}</textarea></label>
            </div>
          </div>

          <div class="case-modal-actions">
            <button type="button" class="btn-ghost" id="exp-cancel">Cancel</button>
            <button type="submit" class="btn-primary" id="exp-save">${isEdit ? 'Save changes' : 'Add expense'}</button>
          </div>
          <p class="auth-msg" id="exp-msg"></p>
        </form>
      </div>
    </div>
  `;
}

function openForm(exp = null) {
  const root = document.getElementById('modal-root');
  root.innerHTML = renderForm(exp);
  wireForm(exp);
}

function wireForm(exp) {
  const root = document.getElementById('modal-root');
  const close = () => root.innerHTML = '';
  root.querySelector('#exp-close').onclick = close;
  root.querySelector('#exp-cancel').onclick = close;
  root.querySelector('.case-modal-backdrop').addEventListener('click', (e) => {
    if (e.target.id === 'expense-modal') close();
  });

  const dateInput = root.querySelector('#x-date');
  dateInput?.addEventListener('click', () => {
    if (typeof dateInput.showPicker === 'function') { try { dateInput.showPicker(); } catch {} }
  });

  root.querySelector('#exp-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = root.querySelector('#exp-msg');
    const btn = root.querySelector('#exp-save');
    msg.textContent = ''; msg.className = 'auth-msg';
    btn.disabled = true; btn.textContent = 'Saving…';

    const payload = {
      date: root.querySelector('#x-date').value,
      category: root.querySelector('#x-category').value,
      vendor: root.querySelector('#x-vendor').value.trim() || null,
      description: root.querySelector('#x-description').value.trim() || null,
      amount: Number(root.querySelector('#x-amount').value),
      payment_type: root.querySelector('#x-payment-type').value,
      paid_from: root.querySelector('#x-paid-from').value || null,
      frequency: root.querySelector('#x-frequency').value || null,
      status: root.querySelector('#x-status').value,
      is_asset: root.querySelector('#x-is-asset').checked,
      notes: root.querySelector('#x-notes').value.trim() || null,
    };

    const { error } = exp
      ? await supabase.from('expenses').update(payload).eq('id', exp.id)
      : await supabase.from('expenses').insert(payload);

    if (error) {
      msg.textContent = error.message;
      msg.className = 'auth-msg error';
      btn.disabled = false;
      btn.textContent = exp ? 'Save changes' : 'Add expense';
      return;
    }

    close();
    await refreshAll();
  });
}

// ---------- Refresh ----------
async function refreshAll() {
  await loadData();
  const f = filterExpenses();
  const dt = document.getElementById('expense-rows');
  const mb = document.getElementById('expense-rows-mobile');
  if (dt) dt.innerHTML = renderRows(f);
  if (mb) mb.innerHTML = renderMobileRows(f);

  const s = computeStats(allExpenses);
  const stats = document.querySelector('.stats-row');
  if (stats) {
    stats.innerHTML = [
      statCard('This month', '₹' + s.thisMonth.toFixed(0), 'primary'),
      statCard('Entries this month', s.thisMonthCount),
      statCard('Total logged', '₹' + s.total.toFixed(0), 'warning'),
      statCard('Assets', '₹' + s.assets.toFixed(0)),
    ].join('');
  }
}