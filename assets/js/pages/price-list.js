import { supabase } from '../supabase.js';

let allItems = [];

// ---------- Load ----------
async function loadData() {
  const { data, error } = await supabase
    .from('price_list')
    .select('id, case_type, label, price, active')
    .order('case_type', { ascending: true });
  if (error) throw error;
  allItems = data ?? [];
}

// ---------- Utils ----------
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
const escapeAttr = escapeHtml;

// ---------- Rows ----------
function renderRows(list) {
  if (!list.length) {
    return `<tr><td colspan="5" class="empty-row">No items yet</td></tr>`;
  }
  return list.map(it => `
    <tr data-id="${it.id}" class="price-row">
      <td data-label="Case Type"><b>${escapeHtml(it.case_type)}</b></td>
      <td data-label="Label">${escapeHtml(it.label)}</td>
      <td data-label="Price" class="num">₹${Number(it.price).toFixed(2)}</td>
      <td data-label="Active">
        <span class="badge ${it.active ? 'badge-success' : 'badge-neutral'}">
          ${it.active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td data-label="" class="row-actions">
        <button class="kebab-btn" data-action="menu" data-id="${it.id}" aria-label="Actions">⋯</button>
      </td>
    </tr>
  `).join('');
}

function renderMobileRows(list) {
  if (!list.length) return `<div class="empty-row">No items yet</div>`;
  return list.map(it => `
    <div class="mcase-row price-row" data-id="${it.id}">
      <div class="mcase-head">
        <b class="mcase-doctor">${escapeHtml(it.case_type)}</b>
        <span class="badge ${it.active ? 'badge-success' : 'badge-neutral'}">
          ${it.active ? 'Active' : 'Inactive'}
        </span>
      </div>
      <div class="mcase-type">${escapeHtml(it.label)}</div>
      <div class="mcase-badges">
        <span class="badge badge-primary">₹${Number(it.price).toFixed(2)}</span>
      </div>
    </div>
  `).join('');
}

// ---------- Render ----------
export async function renderPriceList() {
  await loadData();

  return `
    <div class="page-header-actions">
      <button class="btn-primary" id="add-price">+ Add Item</button>
    </div>

    <div class="table-wrap neu-card desktop-only">
      <table class="data-table">
        <thead>
          <tr>
            <th>Case Type</th>
            <th>Label</th>
            <th class="num">Price</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="price-rows">${renderRows(allItems)}</tbody>
      </table>
    </div>

    <div class="mobile-cases mobile-only" id="price-rows-mobile">
      ${renderMobileRows(allItems)}
    </div>

    <div id="modal-root"></div>
  `;
}

// ---------- Wiring ----------
export function wirePriceList() {
  document.getElementById('add-price')?.addEventListener('click', () => openForm());

  const appRoot = document.getElementById('app');
  appRoot.addEventListener('click', (e) => {
    const kebab = e.target.closest('button[data-action="menu"]');
    if (kebab) {
      e.stopPropagation();
      const item = allItems.find(x => x.id === kebab.dataset.id);
      if (item) openActions(item);
      return;
    }
    const row = e.target.closest('tr[data-id], .mcase-row[data-id]');
    if (row) {
      const item = allItems.find(x => x.id === row.dataset.id);
      if (item) openForm(item);
    }
  });
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
    if (!confirm(`Delete "${item.case_type}"? This cannot be undone.`)) return;
    const { error } = await supabase.from('price_list').delete().eq('id', item.id);
    if (error) return alert(error.message);
    await refreshAll();
  };
}

// ---------- Form modal ----------
function renderForm(item = null) {
  const isEdit = !!item;
  const it = item ?? { case_type: '', label: '', price: '', active: true };

  return `
    <div class="case-modal-backdrop" id="price-modal">
      <div class="case-modal">
        <div class="case-modal-header">
          <div>
            <div class="case-modal-eyebrow">${isEdit ? 'Edit price item' : 'New price item'}</div>
            <h3>${isEdit ? escapeHtml(it.case_type) : 'Add Price Item'}</h3>
          </div>
          <button class="modal-close" id="price-close">×</button>
        </div>

        <form id="price-form">
          <div class="form-section">
            <div class="form-grid">
              <label class="field field-wide">
                <span>Case Type</span>
                <input type="text" id="p-case-type" value="${escapeAttr(it.case_type ?? '')}"
                       placeholder="e.g. Cast pour, Mockup…" required />
              </label>
              <label class="field">
                <span>Label</span>
                <input type="text" id="p-label" value="${escapeAttr(it.label ?? '')}"
                       placeholder="Arch / Unit / etc." required />
              </label>
              <label class="field">
                <span>Price (₹)</span>
                <input type="number" step="0.01" min="0" id="p-price"
                       value="${it.price ?? ''}" required />
              </label>
              <label class="field field-checkbox field-wide">
                <input type="checkbox" id="p-active" ${it.active ? 'checked' : ''} />
                <span>Active (visible in case entry)</span>
              </label>
            </div>
          </div>

          <div class="case-modal-actions">
            <button type="button" class="btn-ghost" id="price-cancel">Cancel</button>
            <button type="submit" class="btn-primary" id="price-save">
              ${isEdit ? 'Save changes' : 'Add item'}
            </button>
          </div>
          <p class="auth-msg" id="price-msg"></p>
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
  root.querySelector('#price-close').onclick = close;
  root.querySelector('#price-cancel').onclick = close;
  root.querySelector('.case-modal-backdrop').addEventListener('click', (e) => {
    if (e.target.id === 'price-modal') close();
  });

  // Auto-focus first input
  setTimeout(() => root.querySelector('#p-case-type')?.focus(), 50);

  root.querySelector('#price-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = root.querySelector('#price-msg');
    const btn = root.querySelector('#price-save');
    msg.textContent = ''; msg.className = 'auth-msg';
    btn.disabled = true; btn.textContent = 'Saving…';

    const payload = {
      case_type: root.querySelector('#p-case-type').value.trim(),
      label:     root.querySelector('#p-label').value.trim(),
      price:     Number(root.querySelector('#p-price').value),
      active:    root.querySelector('#p-active').checked,
    };

    const { error } = item
      ? await supabase.from('price_list').update(payload).eq('id', item.id)
      : await supabase.from('price_list').insert(payload);

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

// ---------- Refresh ----------
async function refreshAll() {
  await loadData();
  const dt = document.getElementById('price-rows');
  const mb = document.getElementById('price-rows-mobile');
  if (dt) dt.innerHTML = renderRows(allItems);
  if (mb) mb.innerHTML = renderMobileRows(allItems);
}