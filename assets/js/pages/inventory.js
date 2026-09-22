import { supabase } from '../supabase.js';

let allItems = [];
let activeFilter = 'all'; // all | low | out
let searchQuery = '';

const CATEGORIES = [
  'Dental Stone', 'Plaster', 'Wax', 'Wire', 'Teeth', 'Acrylic',
  'Consumables', 'Tools', 'Equipment', 'Other',
];

const UNITS = ['kg', 'g', 'box', 'pack', 'piece', 'roll', 'litre', 'set'];

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
const escapeAttr = escapeHtml;

// ---------- Load ----------
async function loadData() {
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  allItems = data ?? [];
}

// ---------- Status ----------
function stockStatus(item) {
  const q = Number(item.quantity) || 0;
  const min = Number(item.min_quantity) || 0;
  if (q <= 0) return { key: 'out', label: 'Out of stock', cls: 'danger' };
  if (q <= min) return { key: 'low', label: 'Low stock', cls: 'warning' };
  return { key: 'ok', label: 'In stock', cls: 'success' };
}

function computeStats(list) {
  let low = 0, out = 0;
  for (const i of list) {
    const s = stockStatus(i);
    if (s.key === 'out') out++;
    else if (s.key === 'low') low++;
  }
  return { total: list.length, low, out };
}

function filterItems() {
  let list = allItems;
  if (activeFilter === 'low') list = list.filter(i => stockStatus(i).key === 'low');
  if (activeFilter === 'out') list = list.filter(i => stockStatus(i).key === 'out');
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    list = list.filter(i =>
      (i.name ?? '').toLowerCase().includes(q) ||
      (i.category ?? '').toLowerCase().includes(q) ||
      (i.vendor ?? '').toLowerCase().includes(q)
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

// ---------- Rows ----------
function renderRows(list) {
  if (!list.length) {
    return `<tr><td colspan="6" class="empty-row">No items yet</td></tr>`;
  }
  return list.map(it => {
    const st = stockStatus(it);
    const qty = Number(it.quantity) || 0;
    const min = Number(it.min_quantity) || 0;
    return `<tr data-id="${it.id}" class="inv-row">
      <td data-label="Item">
        <div class="cell-main">${escapeHtml(it.name)}</div>
        ${it.vendor ? `<div class="cell-sub">${escapeHtml(it.vendor)}</div>` : ''}
      </td>
      <td data-label="Category">
        ${it.category ? `<span class="badge badge-neutral">${escapeHtml(it.category)}</span>` : '—'}
      </td>
      <td data-label="Stock">
        <div class="stock-cell">
          <button class="stock-btn" data-action="dec" data-id="${it.id}" aria-label="Decrease">−</button>
          <b class="stock-value ${st.key !== 'ok' ? 'stock-' + st.key : ''}">${qty}</b>
          <span class="stock-unit">${escapeHtml(it.unit || '')}</span>
          <button class="stock-btn" data-action="inc" data-id="${it.id}" aria-label="Increase">+</button>
        </div>
      </td>
      <td data-label="Min">${min} ${escapeHtml(it.unit || '')}</td>
      <td data-label="Status">
        <span class="badge badge-${st.cls}">${st.label}</span>
      </td>
      <td data-label="" class="row-actions">
        <button class="kebab-btn" data-action="menu" data-id="${it.id}" aria-label="Actions">⋯</button>
      </td>
    </tr>`;
  }).join('');
}

function renderMobileRows(list) {
  if (!list.length) return `<div class="empty-row">No items yet</div>`;
  return list.map(it => {
    const st = stockStatus(it);
    const qty = Number(it.quantity) || 0;
    return `
      <div class="mcase-row inv-row" data-id="${it.id}">
        <div class="mcase-head">
          <b class="mcase-doctor">${escapeHtml(it.name)}</b>
          <span class="badge badge-${st.cls}">${st.label}</span>
        </div>
        <div class="mcase-type">${escapeHtml(it.category || '—')}${it.vendor ? ' · ' + escapeHtml(it.vendor) : ''}</div>
        <div class="inv-mobile-stock">
          <button class="stock-btn" data-action="dec" data-id="${it.id}" aria-label="Decrease">−</button>
          <span class="inv-qty">${qty} <span class="stock-unit">${escapeHtml(it.unit || '')}</span></span>
          <button class="stock-btn" data-action="inc" data-id="${it.id}" aria-label="Increase">+</button>
        </div>
      </div>
    `;
  }).join('');
}

// ---------- Render ----------
export async function renderInventory() {
  await loadData();
  const s = computeStats(allItems);
  const filtered = filterItems();

  return `
    <div class="page-header-actions">
      <button class="btn-primary" id="new-item-btn">+ Add Item</button>
    </div>

    <div class="stats-row">
      ${statCard('Total items', s.total)}
      ${statCard('Low stock', s.low, s.low ? 'warning' : '')}
      ${statCard('Out of stock', s.out, s.out ? 'danger' : '')}
      ${statCard('Categories', new Set(allItems.map(i => i.category).filter(Boolean)).size)}
    </div>

    <div class="filter-row">
      <div class="chips">
        <button class="chip ${activeFilter === 'all' ? 'active' : ''}" data-filter="all">All</button>
        <button class="chip ${activeFilter === 'low' ? 'active' : ''}" data-filter="low">Low stock</button>
        <button class="chip ${activeFilter === 'out' ? 'active' : ''}" data-filter="out">Out of stock</button>
      </div>
      <input type="search" id="inv-search" class="search-input"
             placeholder="Search item, category, vendor…" value="${escapeAttr(searchQuery)}" />
    </div>

    <div class="table-wrap neu-card desktop-only">
      <table class="data-table">
        <thead>
          <tr>
            <th>Item</th>
            <th>Category</th>
            <th>Stock</th>
            <th>Min</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="inv-rows">${renderRows(filtered)}</tbody>
      </table>
    </div>

    <div class="mobile-cases mobile-only" id="inv-rows-mobile">
      ${renderMobileRows(filtered)}
    </div>

    <div id="modal-root"></div>
  `;
}

// ---------- Wiring ----------
export function wireInventory() {
  document.querySelectorAll('.chip[data-filter]').forEach(chip => {
    chip.addEventListener('click', () => {
      activeFilter = chip.dataset.filter;
      document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      paint();
    });
  });

  const search = document.getElementById('inv-search');
  let timer;
  search?.addEventListener('input', e => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      searchQuery = e.target.value.trim();
      paint();
    }, 180);
  });

  document.getElementById('new-item-btn')?.addEventListener('click', () => openForm());

  const appRoot = document.getElementById('app');
  appRoot.addEventListener('click', async (e) => {
    const stockBtn = e.target.closest('button[data-action="inc"], button[data-action="dec"]');
    if (stockBtn) {
      e.stopPropagation();
      const delta = stockBtn.dataset.action === 'inc' ? 1 : -1;
      await adjustStock(stockBtn.dataset.id, delta);
      return;
    }

    const kebab = e.target.closest('button[data-action="menu"]');
    if (kebab) {
      e.stopPropagation();
      const item = allItems.find(x => x.id === kebab.dataset.id);
      if (item) openActions(item);
      return;
    }

    const row = e.target.closest('tr[data-id], .inv-row[data-id]');
    if (row) {
      const item = allItems.find(x => x.id === row.dataset.id);
      if (item) openForm(item);
    }
  });
}

async function adjustStock(id, delta) {
  const item = allItems.find(x => x.id === id);
  if (!item) return;
  const next = Math.max(0, (Number(item.quantity) || 0) + delta);
  // Optimistic update
  item.quantity = next;
  paint();
  const { error } = await supabase.from('inventory').update({ quantity: next }).eq('id', id);
  if (error) {
    // Revert
    item.quantity = next - delta;
    paint();
    alert(error.message);
  }
}

// ---------- Actions menu ----------
function openActions(item) {
  document.getElementById('kebab-menu-root')?.remove();
  const menu = document.createElement('div');
  menu.id = 'kebab-menu-root';
  menu.className = 'kebab-menu-root';
  menu.innerHTML = `
    <div class="kebab-backdrop"></div>
    <div class="kebab-sheet">
      <button class="kebab-action" data-action="edit">Edit item</button>
      <button class="kebab-action danger" data-action="delete">Delete</button>
    </div>
  `;
  document.body.appendChild(menu);
  const close = () => menu.remove();
  menu.querySelector('.kebab-backdrop').addEventListener('click', close);

  menu.querySelector('[data-action="edit"]').onclick = () => { close(); openForm(item); };

  menu.querySelector('[data-action="delete"]').onclick = async () => {
    close();
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from('inventory').delete().eq('id', item.id);
    if (error) return alert(error.message);
    await refreshAll();
  };
}

// ---------- Form ----------
function renderForm(item = null) {
  const isEdit = !!item;
  const it = item ?? {
    name: '', category: '', unit: 'box', quantity: 0,
    min_quantity: 0, vendor: '', notes: '',
  };

  return `
    <div class="case-modal-backdrop" id="inv-modal">
      <div class="case-modal">
        <div class="case-modal-header">
          <div>
            <div class="case-modal-eyebrow">${isEdit ? 'Edit item' : 'New item'}</div>
            <h3>${isEdit ? escapeHtml(it.name) : 'Add Inventory Item'}</h3>
          </div>
          <button class="modal-close" id="inv-close">×</button>
        </div>

        <form id="inv-form">
          <div class="form-section">
            <div class="form-grid">
              <label class="field field-wide"><span>Item name</span>
                <input type="text" id="i-name" value="${escapeAttr(it.name)}" required /></label>
              <label class="field"><span>Category</span>
                <select id="i-category">
                  <option value="">— Select —</option>
                  ${CATEGORIES.map(c => `<option value="${escapeAttr(c)}" ${it.category === c ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('')}
                </select></label>
              <label class="field"><span>Unit</span>
                <select id="i-unit">
                  ${UNITS.map(u => `<option value="${escapeAttr(u)}" ${it.unit === u ? 'selected' : ''}>${escapeHtml(u)}</option>`).join('')}
                </select></label>
              <label class="field"><span>Quantity on hand</span>
                <input type="number" step="0.01" min="0" id="i-quantity" value="${it.quantity}" required /></label>
              <label class="field"><span>Minimum threshold</span>
                <input type="number" step="0.01" min="0" id="i-min" value="${it.min_quantity}" required /></label>
              <label class="field field-wide"><span>Vendor</span>
                <input type="text" id="i-vendor" value="${escapeAttr(it.vendor ?? '')}" /></label>
              <label class="field field-wide"><span>Notes</span>
                <textarea id="i-notes" rows="2">${escapeHtml(it.notes ?? '')}</textarea></label>
            </div>
          </div>

          <div class="case-modal-actions">
            <button type="button" class="btn-ghost" id="inv-cancel">Cancel</button>
            <button type="submit" class="btn-primary" id="inv-save">${isEdit ? 'Save changes' : 'Add item'}</button>
          </div>
          <p class="auth-msg" id="inv-msg"></p>
        </form>
      </div>
    </div>
  `;
}

function openForm(item = null) {
  const root = document.getElementById('modal-root');
  root.innerHTML = renderForm(item);
  wireForm(item);
}

function wireForm(item) {
  const root = document.getElementById('modal-root');
  const close = () => root.innerHTML = '';
  root.querySelector('#inv-close').onclick = close;
  root.querySelector('#inv-cancel').onclick = close;
  root.querySelector('.case-modal-backdrop').addEventListener('click', (e) => {
    if (e.target.id === 'inv-modal') close();
  });

  root.querySelector('#inv-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = root.querySelector('#inv-msg');
    const btn = root.querySelector('#inv-save');
    msg.textContent = ''; msg.className = 'auth-msg';
    btn.disabled = true; btn.textContent = 'Saving…';

    const payload = {
      name: root.querySelector('#i-name').value.trim(),
      category: root.querySelector('#i-category').value || null,
      unit: root.querySelector('#i-unit').value,
      quantity: Number(root.querySelector('#i-quantity').value) || 0,
      min_quantity: Number(root.querySelector('#i-min').value) || 0,
      vendor: root.querySelector('#i-vendor').value.trim() || null,
      notes: root.querySelector('#i-notes').value.trim() || null,
    };

    const { error } = item
      ? await supabase.from('inventory').update(payload).eq('id', item.id)
      : await supabase.from('inventory').insert(payload);

    if (error) {
      msg.textContent = error.message;
      msg.className = 'auth-msg error';
      btn.disabled = false;
      btn.textContent = item ? 'Save changes' : 'Add item';
      return;
    }

    close();
    await refreshAll();
  });
}

// ---------- Paint / refresh ----------
function paint() {
  const f = filterItems();
  const dt = document.getElementById('inv-rows');
  const mb = document.getElementById('inv-rows-mobile');
  if (dt) dt.innerHTML = renderRows(f);
  if (mb) mb.innerHTML = renderMobileRows(f);
}

async function refreshAll() {
  await loadData();
  paint();
  const s = computeStats(allItems);
  const stats = document.querySelector('.stats-row');
  if (stats) {
    stats.innerHTML = [
      statCard('Total items', s.total),
      statCard('Low stock', s.low, s.low ? 'warning' : ''),
      statCard('Out of stock', s.out, s.out ? 'danger' : ''),
      statCard('Categories', new Set(allItems.map(i => i.category).filter(Boolean)).size),
    ].join('');
  }
}