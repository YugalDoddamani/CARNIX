import { supabase } from '../supabase.js';

async function loadData() {
  const { data, error } = await supabase
    .from('cases')
    .select('*, case_stages(*)')
    .order('received_date', { ascending: false })
    .limit(500);
  if (error) throw error;
  return data ?? [];
}

const today = () => new Date().toISOString().slice(0, 10);

const caseTotal = c =>
  (c.case_stages ?? []).reduce((s, st) => s + Number(st.amount || 0), 0);

function daysFrom(dateStr) {
  if (!dateStr) return Infinity;
  const d = new Date(dateStr);
  const t = new Date(today());
  return Math.round((d - t) / 86400000);
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
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

function statusBadge(c) {
  const d = daysFrom(c.delivery_date);
  const overdue = c.status !== 'delivered' && c.delivery_date && d < 0;
  if (overdue) return `<span class="badge badge-danger">Overdue</span>`;
  if (c.status === 'delivered') return `<span class="badge badge-success">Delivered</span>`;
  return `<span class="badge badge-primary">In Queue</span>`;
}

function dueLabel(c) {
  const d = daysFrom(c.delivery_date);
  if (d === 0) return 'Today';
  if (d === 1) return 'Tomorrow';
  if (d > 1)   return `in ${d}d`;
  return `${Math.abs(d)}d late`;
}

export async function renderDashboard(user) {
  const cases = await loadData();

  const active = cases.filter(c => c.status !== 'delivered');
  const overdue = active
    .filter(c => c.delivery_date && daysFrom(c.delivery_date) < 0)
    .sort((a, b) => new Date(a.delivery_date) - new Date(b.delivery_date));
  const dueSoon = active
    .filter(c => {
      const d = daysFrom(c.delivery_date);
      return d >= 0 && d <= 7;
    })
    .sort((a, b) => new Date(a.delivery_date) - new Date(b.delivery_date));
  const unpaidTotal = cases
    .filter(c => !c.payment_status)
    .reduce((s, c) => s + caseTotal(c), 0);

  const recent = cases.slice(0, 8);
  const firstName = (user?.name ?? 'there').split(' ')[0];

  return `
    <div class="dash-welcome">
      <div>
        <h3>Hello, ${escapeHtml(firstName)}</h3>
        <p>${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} · snapshot of your lab</p>
      </div>
      <a class="btn-primary" href="#/cases/new">+ New Case</a>
    </div>

    <div class="stats-row">
      ${statCard('Active cases', active.length)}
      ${statCard('Overdue', overdue.length, 'danger')}
      ${statCard('Due this week', dueSoon.length, 'primary')}
      ${statCard('Unpaid', '₹' + unpaidTotal.toFixed(0), 'warning')}
    </div>

    <div class="dash-grid">
      <div class="dash-card neu-card">
        <div class="dash-card-head">
          <h4>Due next 7 days</h4>
          <a href="#/cases" class="dash-link">View all →</a>
        </div>
        <div class="dash-list">
          ${dueSoon.length ? dueSoon.slice(0, 6).map(c => `
            <div class="dash-row">
              <div class="dash-row-left">
                <b>${escapeHtml(c.doctor_name)}</b>
                <span>${escapeHtml(c.case_stages?.[0]?.case_type ?? '—')}</span>
              </div>
              <div class="dash-row-right">
                <span class="dash-date">${fmtShort(c.delivery_date)}</span>
                <span class="dash-pill primary">${dueLabel(c)}</span>
              </div>
            </div>
          `).join('') : '<div class="dash-empty">Nothing due this week</div>'}
        </div>
      </div>

      <div class="dash-card neu-card">
        <div class="dash-card-head">
          <h4>Overdue</h4>
          ${overdue.length ? `<a href="#/cases" class="dash-link danger">View all →</a>` : ''}
        </div>
        <div class="dash-list">
          ${overdue.length ? overdue.slice(0, 6).map(c => `
            <div class="dash-row">
              <div class="dash-row-left">
                <b>${escapeHtml(c.doctor_name)}</b>
                <span>${escapeHtml(c.case_stages?.[0]?.case_type ?? '—')}</span>
              </div>
              <div class="dash-row-right">
                <span class="dash-date overdue">${fmtShort(c.delivery_date)}</span>
                <span class="dash-pill danger">${dueLabel(c)}</span>
              </div>
            </div>
          `).join('') : '<div class="dash-empty">No overdue cases 🎉</div>'}
        </div>
      </div>
    </div>

    <div class="dash-card neu-card">
      <div class="dash-card-head">
        <h4>Recent cases</h4>
        <a href="#/cases" class="dash-link">View all →</a>
      </div>
      ${recent.length ? `
        <div class="table-wrap">
          <table class="data-table dash-table">
            <thead>
              <tr>
                <th>Received</th>
                <th>Doctor</th>
                <th>Case</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${recent.map(c => `
                <tr>
                  <td>${fmtShort(c.received_date)}</td>
                  <td><b>${escapeHtml(c.doctor_name)}</b></td>
                  <td>${escapeHtml(c.case_stages?.[0]?.case_type ?? '—')}</td>
                  <td>₹${caseTotal(c).toFixed(0)}</td>
                  <td>${statusBadge(c)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : '<div class="dash-empty">No cases yet. Create one to see it here.</div>'}
    </div>
  `;
}

export function wireDashboard() {
  // No interactions yet
}
