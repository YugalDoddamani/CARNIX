import { supabase } from '../supabase.js';

let chartInstance = null;

async function loadData() {
  const { data, error } = await supabase
    .from('cases')
    .select('*, case_stages(*)')
    .order('received_date', { ascending: false })
    .limit(500);
  if (error) throw error;
  return data ?? [];
}

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

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

function dueLabel(c) {
  const d = daysFrom(c.delivery_date);
  if (d === 0) return 'Today';
  if (d === 1) return 'Tomorrow';
  if (d > 1)   return `in ${d}d`;
  return `${Math.abs(d)}d late`;
}

function statCard(label, value, sub, tone = '', icon = '') {
  return `
    <div class="kpi ${tone ? 'kpi-' + tone : ''}">
      <div class="kpi-head">
        <span class="kpi-label">${label}</span>
        ${icon ? `<span class="kpi-icon">${icon}</span>` : ''}
      </div>
      <div class="kpi-value">${value}</div>
      ${sub ? `<div class="kpi-sub">${sub}</div>` : ''}
    </div>
  `;
}

// Build last 14 days of received counts for the chart
function buildDailyCounts(cases) {
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      iso: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      count: 0,
      revenue: 0,
    });
  }
  const index = Object.fromEntries(days.map((d, i) => [d.iso, i]));
  for (const c of cases) {
    const key = c.received_date;
    if (key in index) {
      days[index[key]].count += 1;
      days[index[key]].revenue += caseTotal(c);
    }
  }
  return days;
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

  const unpaidCases = cases.filter(c => !c.payment_status);
  const unpaidTotal = unpaidCases.reduce((s, c) => s + caseTotal(c), 0);
  const deliveredThisMonth = cases.filter(c => {
    if (c.status !== 'delivered' || !c.delivered_at) return false;
    const d = new Date(c.delivered_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const daily = buildDailyCounts(cases);
  const recent = cases.slice(0, 6);
  const firstName = (user?.name ?? 'there').split(' ')[0];

  return `
    <div class="dash-header">
      <div>
        <h2>Hello, ${escapeHtml(firstName)}</h2>
        <p>${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} · snapshot of your lab</p>
      </div>
      <a class="btn-primary" href="#/cases/new">+ New Case</a>
    </div>

    <div class="kpi-row">
      ${statCard('Active cases', active.length, `${dueSoon.length} due this week`)}
      ${statCard('Overdue',      overdue.length, overdue.length ? 'Needs attention' : 'All on track', overdue.length ? 'danger' : '')}
      ${statCard('Unpaid',       '₹' + unpaidTotal.toFixed(0), `${unpaidCases.length} cases pending`, 'warning')}
      ${statCard('Delivered',    deliveredThisMonth, 'This month', 'success')}
    </div>

    <div class="dash-main">
      <div class="dash-chart-card">
        <div class="dash-card-head">
          <div>
            <h4>Case volume</h4>
            <span class="dash-card-sub">Last 14 days</span>
          </div>
        </div>
        <div class="chart-wrap">
          <canvas id="volume-chart"></canvas>
        </div>
      </div>

      <div class="dash-snapshot">
        <div class="dash-snapshot-item">
          <span class="dash-snap-label">Due today</span>
          <b>${active.filter(c => daysFrom(c.delivery_date) === 0).length}</b>
        </div>
        <div class="dash-snapshot-item">
          <span class="dash-snap-label">Due tomorrow</span>
          <b>${active.filter(c => daysFrom(c.delivery_date) === 1).length}</b>
        </div>
        <div class="dash-snapshot-item">
          <span class="dash-snap-label">Delivered total</span>
          <b>${cases.filter(c => c.status === 'delivered').length}</b>
        </div>
        <div class="dash-snapshot-item">
          <span class="dash-snap-label">All-time cases</span>
          <b>${cases.length}</b>
        </div>
      </div>
    </div>

    <div class="dash-section">
      <div class="dash-card-head">
        <div>
          <h4>Recent cases</h4>
          <span class="dash-card-sub">Latest entries</span>
        </div>
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
                <th>Delivery</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${recent.map(c => {
                const overdue = c.status !== 'delivered' && c.delivery_date && daysFrom(c.delivery_date) < 0;
                const status = overdue ? 'Overdue'
                            : c.status === 'delivered' ? 'Delivered'
                            : 'In Queue';
                const cls = overdue ? 'danger'
                          : c.status === 'delivered' ? 'success'
                          : 'primary';
                return `
                 <tr>
  <td data-label="Received">${fmtShort(c.received_date)}</td>
  <td data-label="Doctor"><b>${escapeHtml(c.doctor_name)}</b></td>
  <td data-label="Case">${escapeHtml(c.case_stages?.[0]?.case_type ?? '—')}</td>
  <td data-label="Delivery" class="${overdue ? 'cell-overdue' : ''}">${fmtShort(c.delivery_date)}</td>
  <td data-label="Total">₹${caseTotal(c).toFixed(0)}</td>
  <td data-label="Status"><span class="badge badge-${cls}">${status}</span></td>
</tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      ` : '<div class="dash-empty">No cases yet. Create one to see it here.</div>'}
    </div>

    <div class="dash-two-col">
      <div class="dash-section">
        <div class="dash-card-head">
          <div>
            <h4>Due next 7 days</h4>
            <span class="dash-card-sub">${dueSoon.length} case${dueSoon.length === 1 ? '' : 's'}</span>
          </div>
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

      <div class="dash-section">
        <div class="dash-card-head">
          <div>
            <h4>Overdue</h4>
            <span class="dash-card-sub">${overdue.length} case${overdue.length === 1 ? '' : 's'}</span>
          </div>
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
  `;
}

export function wireDashboard() {
  const canvas = document.getElementById('volume-chart');
  if (!canvas || typeof Chart === 'undefined') return;

  // Destroy prior instance if any
  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

  // Reload data to build the chart series (cheap — small dataset)
  supabase
    .from('cases')
    .select('received_date, case_stages(amount)')
    .order('received_date', { ascending: false })
    .limit(500)
    .then(({ data }) => {
      const cases = (data ?? []).map(c => ({
        received_date: c.received_date,
        case_stages: c.case_stages ?? [],
      }));
      const daily = buildDailyCounts(cases);

      const styles = getComputedStyle(document.documentElement);
      const primary = styles.getPropertyValue('--primary').trim() || '#1E3F73';
      const gridColor = 'rgba(0,0,0,.06)';
      const textColor = styles.getPropertyValue('--text-muted').trim() || '#6B7280';

      chartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: daily.map(d => d.label),
          datasets: [{
            label: 'Cases',
            data: daily.map(d => d.count),
            backgroundColor: primary,
            borderRadius: 6,
            barThickness: 14,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              displayColors: false,
              callbacks: {
                title: (items) => items[0].label,
                label: (item) => `${item.parsed.y} case${item.parsed.y === 1 ? '' : 's'}`,
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: textColor, font: { size: 10 } },
            },
            y: {
              beginAtZero: true,
              ticks: {
                color: textColor,
                font: { size: 10 },
                precision: 0,
                stepSize: 1,
              },
              grid: { color: gridColor, drawBorder: false },
            },
          },
        },
      });
    });
}
