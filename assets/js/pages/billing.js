import { supabase } from '../supabase.js';
import { loadImage, DEFAULT_SETTINGS } from '../pdf-helpers.js';

let allInvoices = [];
let currentItems = [];
let currentTotal = 0;
let currentDoctor = '';
let currentStart = '';
let currentEnd = '';

const today = () =>
  new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
const firstOfMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

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

// ---------- Data loads ----------
async function loadDoctors() {
  const { data, error } = await supabase
    .from('cases').select('doctor_name').limit(2000);
  if (error) return [];
  return [...new Set((data ?? []).map(c => c.doctor_name).filter(Boolean))].sort();
}

async function loadInvoices() {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .order('generated_at', { ascending: false })
    .limit(30);
  if (error) throw error;
  allInvoices = data ?? [];
}

// ---------- Preview ----------
async function fetchMatches(doctor, start, end, uninvoicedOnly) {
  let q = supabase
    .from('cases')
    .select('*, case_stages(*)')
    .eq('doctor_name', doctor)
    .gte('received_date', start)
    .lte('received_date', end)
    .order('received_date', { ascending: true });

  if (uninvoicedOnly) q = q.is('invoice_id', null);

  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

function buildLineItems(matches) {
  const items = [];
  let total = 0;
  for (const c of matches) {
    for (const s of (c.case_stages ?? [])) {
      items.push({
        case_id: c.id,
        date: c.received_date,
        case_type: s.case_type,
        label: s.label,
        unit_price: Number(s.unit_price),
        quantity: Number(s.quantity),
        amount: Number(s.amount),
      });
      total += Number(s.amount);
    }
  }
  return { items, total };
}

// ---------- Render ----------
export async function renderBilling() {
  const [doctors] = await Promise.all([loadDoctors(), loadInvoices()]);

  return `
    <div class="bill-filters neu-card">
      <div class="bill-filter-grid">
        <label class="field">
          <span>Doctor</span>
          <select id="b-doctor">
            <option value="">— Select doctor —</option>
            ${doctors.map(d => `<option value="${escapeAttr(d)}">${escapeHtml(d)}</option>`).join('')}
          </select>
        </label>
        <label class="field">
          <span>From</span>
          <input type="date" id="b-start" value="${firstOfMonth()}" />
        </label>
        <label class="field">
          <span>To</span>
          <input type="date" id="b-end" value="${today()}" />
        </label>
        <label class="field field-checkbox">
          <input type="checkbox" id="b-uninvoiced" checked />
          <span>Uninvoiced only</span>
        </label>
      </div>
    </div>

    <div class="bill-preview-card">
      <div class="bill-preview-head">
        <div>
          <h4>Preview</h4>
          <span class="bill-preview-sub" id="b-period">—</span>
        </div>
        <div class="bill-preview-total">
          <span>Total</span>
          <b id="b-total">₹0.00</b>
        </div>
      </div>
      <div id="b-preview" class="bill-preview-body">
        <div class="empty-row">Select a doctor and date range to preview</div>
      </div>

      <div class="bill-payment-preview">
        <div class="bill-payment-label">Payment details</div>
        <div class="bill-payment-grid">
          <div class="bill-payment-bank">
            <div><span>Bank</span><b>Configure in Control Panel</b></div>
            <div><span>Account</span><b>• • • • • • •</b></div>
            <div><span>IFSC</span><b>• • • • • •</b></div>
            <div><span>UPI</span><b>• • • • •</b></div>
          </div>
          <div class="bill-payment-qr">
            <div class="qr-placeholder">QR</div>
            <span>Scan to pay</span>
          </div>
        </div>
      </div>

      <div class="bill-preview-actions">
        <button class="btn-ghost" id="b-pdf" disabled>Download PDF</button>
        <button class="btn-primary" id="b-save" disabled>Save as Invoice</button>
      </div>
      <p class="auth-msg" id="b-msg"></p>
    </div>

    <div class="bill-history-card">
      <div class="dash-card-head">
        <div>
          <h4>Recent invoices</h4>
          <span class="dash-card-sub">Last 30</span>
        </div>
      </div>
      <div id="b-history">
        ${renderHistory()}
      </div>
    </div>
  `;
}

function renderHistory() {
  if (!allInvoices.length) {
    return `<div class="empty-row">No invoices yet</div>`;
  }
  return `
    <div class="bill-history">
      ${allInvoices.map(inv => `
        <div class="bill-history-row" data-id="${inv.id}">
          <div class="bill-history-main">
            <div class="bill-history-top">
              <b class="bill-history-num">${escapeHtml(inv.invoice_number ?? '—')}</b>
              <span class="badge badge-${inv.status === 'paid' ? 'success' : 'warning'}">
                ${inv.status === 'paid' ? 'Paid' : 'Unpaid'}
              </span>
            </div>
            <div class="bill-history-sub">
              ${escapeHtml(inv.doctor_name)} · ${fmtShort(inv.start_date)} – ${fmtShort(inv.end_date)}
            </div>
          </div>
          <div class="bill-history-right">
            <b>₹${Number(inv.total).toFixed(2)}</b>
            <div class="bill-history-actions">
              <button class="kebab-btn" data-action="menu" data-id="${inv.id}" aria-label="Invoice actions">⋯</button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ---------- Wiring ----------
export function wireBilling() {
  const doctorSel = document.getElementById('b-doctor');
  const startInput = document.getElementById('b-start');
  const endInput = document.getElementById('b-end');
  const uninvoicedBox = document.getElementById('b-uninvoiced');
  const previewEl = document.getElementById('b-preview');
  const totalEl = document.getElementById('b-total');
  const periodEl = document.getElementById('b-period');
  const pdfBtn = document.getElementById('b-pdf');
  const saveBtn = document.getElementById('b-save');
  const msg = document.getElementById('b-msg');

  if (!doctorSel) return;

  let refreshTimer = null;

  async function refresh() {
    const doctor = doctorSel.value;
    const start = startInput.value;
    const end = endInput.value;

    currentDoctor = doctor;
    currentStart = start;
    currentEnd = end;

    if (!doctor || !start || !end) {
      previewEl.innerHTML = '<div class="empty-row">Select a doctor and date range to preview</div>';
      totalEl.textContent = '₹0.00';
      periodEl.textContent = '—';
      pdfBtn.disabled = true;
      saveBtn.disabled = true;
      currentItems = [];
      currentTotal = 0;
      return;
    }

    previewEl.innerHTML = '<div class="empty-row">Loading…</div>';

    try {
      const matches = await fetchMatches(doctor, start, end, uninvoicedBox.checked);
      const { items, total } = buildLineItems(matches);

      currentItems = items;
      currentTotal = total;
      periodEl.textContent = `${fmtLong(start)} – ${fmtLong(end)}`;

      if (!items.length) {
        previewEl.innerHTML = '<div class="empty-row">No matching cases in this range</div>';
        totalEl.textContent = '₹0.00';
        pdfBtn.disabled = true;
        saveBtn.disabled = true;
        return;
      }

      previewEl.innerHTML = `
        <table class="bill-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th class="num">Qty</th>
              <th class="num">Rate</th>
              <th class="num">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${items.map(it => `
              <tr>
                <td>${fmtShort(it.date)}</td>
                <td>
                  <b>${escapeHtml(it.case_type)}</b>
                  ${it.label ? `<span class="bill-label">${escapeHtml(it.label)}</span>` : ''}
                </td>
                <td class="num">${it.quantity}</td>
                <td class="num">₹${it.unit_price.toFixed(2)}</td>
                <td class="num">₹${it.amount.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
      totalEl.textContent = '₹' + total.toFixed(2);
      pdfBtn.disabled = false;
      saveBtn.disabled = false;
    } catch (err) {
      previewEl.innerHTML = `<div class="empty-row error">${escapeHtml(err.message)}</div>`;
      pdfBtn.disabled = true;
      saveBtn.disabled = true;
    }
  }

  doctorSel.addEventListener('change', refresh);
  startInput.addEventListener('change', refresh);
  endInput.addEventListener('change', refresh);
  uninvoicedBox.addEventListener('change', refresh);

  [startInput, endInput].forEach(inp => {
    inp.addEventListener('click', () => {
      if (typeof inp.showPicker === 'function') { try { inp.showPicker(); } catch {} }
    });
  });

  // Download PDF (preview only, no DB write)
  pdfBtn.addEventListener('click', async () => {
    if (!currentItems.length) return;
    try {
      const doc = await buildPDF({
        doctor: currentDoctor,
        start: currentStart,
        end: currentEnd,
        items: currentItems,
        total: currentTotal,
        invoiceNumber: 'DRAFT',
      });
      doc.save(`carnix-draft-${currentDoctor.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      msg.textContent = err.message ?? String(err);
      msg.className = 'auth-msg error';
    }
  });

  // Save as invoice
  saveBtn.addEventListener('click', async () => {
    if (!currentItems.length) return;
    if (!confirm(`Create invoice for ${currentDoctor}?\n\n${currentItems.length} line items · ₹${currentTotal.toFixed(2)}`)) return;

    msg.textContent = ''; msg.className = 'auth-msg';
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';

    try {
      const year = new Date().getFullYear();
      const { data: num, error: numErr } = await supabase
        .rpc('next_invoice_number', { p_year: year });
      if (numErr) throw numErr;

      const { data: inv, error: invErr } = await supabase
        .from('invoices')
        .insert({
          invoice_number: num,
          doctor_name: currentDoctor,
          start_date: currentStart,
          end_date: currentEnd,
          total: currentTotal,
          status: 'unpaid',
        })
        .select()
        .single();
      if (invErr) throw invErr;

      const itemRows = currentItems.map(it => ({
        invoice_id: inv.id,
        case_id: it.case_id,
        description: it.label ? `${it.case_type} (${it.label})` : it.case_type,
        unit_price: it.unit_price,
        quantity: it.quantity,
        amount: it.amount,
      }));
      const { error: itemsErr } = await supabase.from('invoice_items').insert(itemRows);
      if (itemsErr) {
        await supabase.from('invoices').delete().eq('id', inv.id);
        throw itemsErr;
      }

      const caseIds = [...new Set(currentItems.map(i => i.case_id))];
      const { error: linkErr } = await supabase
        .from('cases').update({ invoice_id: inv.id }).in('id', caseIds);
      if (linkErr) throw linkErr;

      msg.textContent = `Invoice ${num} saved.`;
      msg.className = 'auth-msg ok';

      await loadInvoices();
      document.getElementById('b-history').innerHTML = renderHistory();

      const doc = await buildPDF({
        doctor: currentDoctor,
        start: currentStart,
        end: currentEnd,
        items: currentItems,
        total: currentTotal,
        invoiceNumber: num,
      });
      doc.save(`${num}.pdf`);

      refresh();
    } catch (err) {
      msg.textContent = err.message ?? String(err);
      msg.className = 'auth-msg error';
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save as Invoice';
    }
  });

  // Invoice history kebab
  document.getElementById('b-history')?.addEventListener('click', async (e) => {
    const kebab = e.target.closest('button[data-action="menu"]');
    if (!kebab) return;
    e.stopPropagation();
    const id = kebab.dataset.id;
    const inv = allInvoices.find(i => i.id === id);
    if (!inv) return;
    openInvoiceMenu(inv);
  });
}

// ---------- Invoice actions menu ----------
function openInvoiceMenu(inv) {
  document.getElementById('inv-menu')?.remove();
  const menu = document.createElement('div');
  menu.id = 'inv-menu';
  menu.className = 'kebab-menu-root';
  menu.innerHTML = `
    <div class="kebab-backdrop"></div>
    <div class="kebab-sheet">
      <button class="kebab-action" data-action="pdf">Download PDF</button>
      ${inv.status !== 'paid'
        ? `<button class="kebab-action" data-action="paid">Mark as paid</button>`
        : `<button class="kebab-action" data-action="unpaid">Mark as unpaid</button>`}
      <button class="kebab-action danger" data-action="delete">Delete invoice</button>
    </div>
  `;
  document.body.appendChild(menu);

  const close = () => menu.remove();
  menu.querySelector('.kebab-backdrop').addEventListener('click', close);

  menu.querySelector('[data-action="pdf"]').onclick = async () => {
    close();
    const { data: items } = await supabase
      .from('invoice_items').select('*').eq('invoice_id', inv.id);
    if (!items?.length) return alert('No items found');
    const doc = await buildPDF({
      doctor: inv.doctor_name,
      start: inv.start_date,
      end: inv.end_date,
      items: items.map(i => ({
        date: null,
        case_type: i.description,
        label: '',
        unit_price: Number(i.unit_price),
        quantity: Number(i.quantity),
        amount: Number(i.amount),
      })),
      total: Number(inv.total),
      invoiceNumber: inv.invoice_number ?? 'DRAFT',
    });
    doc.save(`${inv.invoice_number ?? 'invoice'}.pdf`);
  };

  menu.querySelector('[data-action="paid"]')?.addEventListener('click', async () => {
    close();
    await setInvoicePaid(inv, true);
  });
  menu.querySelector('[data-action="unpaid"]')?.addEventListener('click', async () => {
    close();
    await setInvoicePaid(inv, false);
  });

  menu.querySelector('[data-action="delete"]').onclick = async () => {
    close();
    if (!confirm(`Delete ${inv.invoice_number}?\n\nCases will be unlocked and can be re-invoiced.`)) return;
    await supabase.from('cases')
      .update({ invoice_id: null, payment_status: false })
      .eq('invoice_id', inv.id);
    await supabase.from('invoices').delete().eq('id', inv.id);
    await loadInvoices();
    document.getElementById('b-history').innerHTML = renderHistory();
  };
}

async function setInvoicePaid(inv, paid) {
  await supabase.from('invoices')
    .update({ status: paid ? 'paid' : 'unpaid', paid_at: paid ? new Date().toISOString() : null })
    .eq('id', inv.id);
  await supabase.from('cases')
    .update({ payment_status: paid })
    .eq('invoice_id', inv.id);
  await loadInvoices();
  document.getElementById('b-history').innerHTML = renderHistory();
}

// ---------- PDF ----------
async function buildPDF({ doctor, start, end, items, total, invoiceNumber }) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 18;

  // ---- Header: logo (falls back to text if missing) ----
  let headerBottomY = M + 12;
  try {
    const logo = await loadImage('/assets/bill-logo.png');
    const logoHeight = 14;
    const logoWidth = (logo.width / logo.height) * logoHeight;
    doc.addImage(logo.dataUrl, 'PNG', M, M, logoWidth, logoHeight);
    headerBottomY = M + logoHeight + 4;
  } catch (e) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(31, 58, 147);
    doc.text('CARNIX', M, M + 6);
    headerBottomY = M + 12;
  }

  // ---- Invoice label ----
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(0);
  doc.text('INVOICE', W - M, M + 6, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text(invoiceNumber, W - M, M + 12, { align: 'right' });

  // ---- Bill to / period ----
  let y = Math.max(headerBottomY, M + 20) + 8;
  doc.setTextColor(120);
  doc.setFontSize(8);
  doc.text('BILL TO', M, y);
  doc.text('PERIOD', W - M, y, { align: 'right' });

  doc.setTextColor(0);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(doctor, M, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`${fmtLong(start)} – ${fmtLong(end)}`, W - M, y + 6, { align: 'right' });

  // ---- Line items table ----
  doc.autoTable({
    startY: y + 16,
    head: [['Date', 'Description', 'Qty', 'Rate', 'Amount']],
    body: items.map(it => [
      it.date ? fmtShort(it.date) : '—',
      it.label ? `${it.case_type} (${it.label})` : it.case_type,
      String(it.quantity),
      `Rs. ${Number(it.unit_price).toFixed(2)}`,
      `Rs. ${Number(it.amount).toFixed(2)}`,
    ]),
    foot: [['', '', '', 'Total', `Rs. ${Number(total).toFixed(2)}`]],
    margin: { left: M, right: M },
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [31, 58, 147], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [240, 242, 248], textColor: 0, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 24 },
      2: { cellWidth: 14, halign: 'right' },
      3: { cellWidth: 26, halign: 'right' },
      4: { cellWidth: 28, halign: 'right' },
    },
  });

  // ---- Payment section ----
  const s = DEFAULT_SETTINGS;
  const payY = doc.lastAutoTable.finalY + 12;

  doc.setDrawColor(230);
  doc.setLineWidth(0.3);
  doc.line(M, payY, W - M, payY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.text('PAYMENT DETAILS', M, payY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60);

  let leftY = payY + 14;
  const leftX = M;
  const lineGap = 5;

  doc.text(`Bank: ${s.bank.name}`, leftX, leftY);            leftY += lineGap;
  doc.text(`A/c Name: ${s.bank.accountName}`, leftX, leftY); leftY += lineGap;
  doc.text(`A/c No: ${s.bank.accountNumber}`, leftX, leftY); leftY += lineGap;
  doc.text(`IFSC: ${s.bank.ifsc}`, leftX, leftY);            leftY += lineGap;
  doc.text(`Branch: ${s.bank.branch}`, leftX, leftY);        leftY += lineGap + 2;

  doc.setTextColor(120);
  doc.setFontSize(8);
  doc.text(`UPI: ${s.upi.id}`, leftX, leftY);                leftY += lineGap;
  doc.text(`Ph: ${s.contact.phone}`, leftX, leftY);          leftY += lineGap;
  doc.text(`Email: ${s.contact.email}`, leftX, leftY);

  // QR
  const qrSize = 30;
  const qrX = W - M - qrSize;
  const qrY = payY + 14;

  try {
    const qr = await loadImage(s.upi.qrUrl);
    doc.addImage(qr.dataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
    doc.setFontSize(7);
    doc.setTextColor(120);
    doc.text('Scan to pay via UPI', qrX + qrSize / 2, qrY + qrSize + 4, { align: 'center' });
  } catch (e) {
    doc.setDrawColor(200);
    doc.setLineWidth(0.3);
    doc.roundedRect(qrX, qrY, qrSize, qrSize, 2, 2);
    doc.setFontSize(7);
    doc.setTextColor(160);
    doc.text('QR', qrX + qrSize / 2, qrY + qrSize / 2 + 1, { align: 'center' });
    doc.text('Scan to pay via UPI', qrX + qrSize / 2, qrY + qrSize + 4, { align: 'center' });
  }

  // ---- Footer ----
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(140);
  doc.text('Thank you for your business.', M, H - 12);

  return doc;
}