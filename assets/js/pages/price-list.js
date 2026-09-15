import { supabase } from '../supabase.js';

export async function renderPriceList() {
  const { data, error } = await supabase
    .from('price_list')
    .select('id, case_type, label, price, active')
    .order('case_type', { ascending: true });

  if (error) throw error;

  const rows = (data ?? []).map(item => `
    <tr data-id="${item.id}">
      <td data-label="Case Type">${escapeHtml(item.case_type)}</td>
      <td data-label="Label">${escapeHtml(item.label)}</td>
      <td data-label="Price">₹${Number(item.price).toFixed(2)}</td>
      <td data-label="Active">${item.active ? 'Yes' : 'No'}</td>
      <td data-label="Actions" class="row-actions">
        <button class="btn-ghost" data-action="edit" data-id="${item.id}">Edit</button>
        <button class="btn-ghost danger" data-action="delete" data-id="${item.id}">Delete</button>
      </td>
    </tr>
  `).join('');

  return `
    <div class="page-header">
      <h3>Master Price List</h3>
      <button class="btn-primary" id="add-price">+ Add Item</button>
    </div>

    <div class="table-wrap neu-card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Case Type</th>
            <th>Label</th>
            <th>Price</th>
            <th>Active</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="price-rows">
          ${rows || '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:24px">No items yet</td></tr>'}
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <div class="modal-backdrop" id="price-modal" hidden>
      <div class="modal neu-card">
        <h3 id="modal-title">Add Price Item</h3>
        <form id="price-form">
          <input type="hidden" id="item-id" />

          <label class="field">
            <span>Case Type</span>
            <input type="text" id="case-type" required />
          </label>
          <label class="field">
            <span>Label</span>
            <input type="text" id="label" placeholder="Arch / Unit / etc." required />
          </label>
          <label class="field">
            <span>Price (₹)</span>
            <input type="number" step="0.01" min="0" id="price" required />
          </label>
          <label class="field" style="flex-direction:row;align-items:center;gap:8px">
            <input type="checkbox" id="active" checked />
            <span>Active</span>
          </label>

          <div class="modal-actions">
            <button type="button" class="btn-ghost" id="cancel-btn">Cancel</button>
            <button type="submit" class="btn-primary" id="save-btn">Save</button>
          </div>
          <p id="modal-msg" class="auth-msg"></p>
        </form>
      </div>
    </div>
  `;
}

// ---------- Post-render wiring ----------
export function wirePriceList() {
  const modal    = document.getElementById('price-modal');
  const form     = document.getElementById('price-form');
  const msg      = document.getElementById('modal-msg');
  const title    = document.getElementById('modal-title');
  const saveBtn  = document.getElementById('save-btn');
  const idField  = document.getElementById('item-id');
  const typeF    = document.getElementById('case-type');
  const labelF   = document.getElementById('label');
  const priceF   = document.getElementById('price');
  const activeF  = document.getElementById('active');

  const openModal = (item = null) => {
    msg.textContent = '';
    msg.className = 'auth-msg';
    if (item) {
      title.textContent = 'Edit Price Item';
      idField.value = item.id;
      typeF.value   = item.case_type;
      labelF.value  = item.label;
      priceF.value  = item.price;
      activeF.checked = item.active;
    } else {
      title.textContent = 'Add Price Item';
      form.reset();
      idField.value = '';
      activeF.checked = true;
    }
    modal.hidden = false;
  };

  const closeModal = () => { modal.hidden = true; };

  document.getElementById('add-price')?.addEventListener('click', () => openModal());
  document.getElementById('cancel-btn')?.addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  // Row actions
  document.getElementById('price-rows')?.addEventListener('click', async e => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const { action, id } = btn.dataset;

    if (action === 'edit') {
      const { data, error } = await supabase
        .from('price_list').select('*').eq('id', id).single();
      if (error) return alert(error.message);
      openModal(data);
      return;
    }

    if (action === 'delete') {
      if (!confirm('Delete this item?')) return;
      const { error } = await supabase.from('price_list').delete().eq('id', id);
      if (error) return alert(error.message);
      location.reload();
    }
  });

  // Save (create or update)
  form?.addEventListener('submit', async e => {
    e.preventDefault();
    msg.textContent = '';
    msg.className = 'auth-msg';
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';

    const payload = {
      case_type: typeF.value.trim(),
      label:     labelF.value.trim(),
      price:     Number(priceF.value),
      active:    activeF.checked,
    };

    const id = idField.value;
    const { error } = id
      ? await supabase.from('price_list').update(payload).eq('id', id)
      : await supabase.from('price_list').insert(payload);

    if (error) {
      msg.textContent = error.message;
      msg.className = 'auth-msg error';
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save';
      return;
    }

    closeModal();
    location.reload();
  });
}

// ---------- util ----------
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}
