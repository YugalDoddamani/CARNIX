import { supabase } from '../supabase.js';

let chartInstance = null;
let currentYear = new Date().getFullYear();

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

const caseTotal = c =>
  (c.case_stages ?? []).reduce((s, st) => s + Number(st.amount || 0), 0);

// ---------- Load ----------
async function loadYear(year) {
  const start = `${year}-01-01`;
  const end   = `${year}-12-31`;

  const { data: cases, error: cErr } = await supabase
    .from('cases')
    .select('received_date, payment_status, case_stages(amount)')
    .eq('payment_status', true)
    .gte('received_date', start)
    .lte('received_date', end);
  if (cErr) throw cErr;

  const { data: expenses, error: eErr } = await supabase
    .from('expenses')
    .select('date, amount, category, is_asset, status')
    .gte('date', start)
    .lte('date', end);
  if (eErr) throw eErr;

  return { cases: cases ?? [], expenses: expenses ?? [] };
}

// ---------- Compute ----------
function buildMonthly(cases, expenses) {
  const months = Array.from({ length: 12 }, (_, i) => ({
    idx: i,
    label: MONTHS[i],
    income: 0,
    expenses: 0,
    net: 0,
    margin: 0,
  }));

  for (const c of cases) {
    if (!c.received_date) continue;
    const m = Number(c.received_date.slice(5, 7)) - 1;
    if (m >= 0 && m < 12) months[m].income += caseTotal(c);
  }

  for (const e of expenses) {
    if (e.status && e.status !== 'Paid') continue;
    if (!e.date) continue;
    const m = Number(e.date.slice(5, 7)) - 1;
    if (m >= 0 && m < 12) months[m].expenses += Number(e.amount || 0);
  }

  for (const m of months) {
    m.net = m.income - m.expenses;
    m.margin = m.income > 0 ? (m.net / m.income) * 100 : 0;
  }

  return months;
}

function categoryBreakdown(expenses) {
  const totals = {};
  for (const e of expenses) {
    if (e.status && e.status !== 'Paid') continue;
    const cat = e.category || 'Other';
    totals[cat] = (totals[cat] || 0) + Number(e.amount || 0);
  }
  return Object.entries(totals)
    .map(([cat, amount]) => ({ cat, amount }))
    .sort((a, b) => b.amount - a.amount);
}

function ytd(months, key) {
  return months.reduce((s, m) => s + m[key], 0);
}

function inr(n) {
  return '₹' + Math.round(n).toLocaleString('en-IN');
}

function statCard(label, value, sub, tone = '') {
  return `
    <div class="kpi ${tone ? 'kpi-' + tone : ''}">
      <div class="kpi-head"><span class="kpi-label">${label}</span></div>
      <div class="kpi-value">${value}</div>
      ${sub ? `<div class="kpi-sub">${sub}</div>` : ''}
    </div>
  `;
}

// ---------- Render ----------
export async function renderPL() {
  const { cases, expenses } = await loadYear(currentYear);
  const months = buildMonthly(cases, expenses);
  const cats = categoryBreakdown(expenses);

  const income = ytd(months, 'income');
  const expenseTotal = ytd(months, 'expenses');
  const net = income - expenseTotal;
  const margin = income > 0 ? (net / income) * 100 : 0;

  const bestMonth = months.reduce((best, m) => m.net > best.net ? m : best, months[0]);
  const activeMonths = months.filter(m => m.income > 0 || m.expenses > 0);

  return `
    <div class="pl-header">
      <div>
        <h2>Profit &amp; Loss</h2>
        <p>Year ${currentYear} · closed cases + logged expenses</p>
      </div>
      <label class="pl-year">
        <span>Year</span>
        <select id="pl-year">
          ${[currentYear + 1, currentYear, currentYear - 1, currentYear - 2].map(y =>
            `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`
          ).join('')}
        </select>
      </label>
    </div>

    <div class="kpi-row">
      ${statCard('Income', inr(income), `${cases.length} paid cases`, 'primary')}
      ${statCard('Expenses', inr(expenseTotal), `${expenses.length} entries`, 'warning')}
      ${statCard('Net profit', inr(net), `${margin.toFixed(1)}% margin`, net >= 0 ? 'success' : 'danger')}
      ${statCard('Best month', bestMonth.income || bestMonth.expenses ? bestMonth.label : '—', bestMonth.net ? inr(bestMonth.net) : 'No data')}
    </div>

    <div class="pl-chart-card">
      <div class="dash-card-head">
        <div>
          <h4>Income vs Expenses</h4>
          <span class="dash-card-sub">Monthly totals for ${currentYear}</span>
        </div>
      </div>
      <div class="chart-wrap pl-chart">
        <canvas id="pl-chart"></canvas>
      </div>
    </div>

    <div class="pl-grid">
      <div class="pl-section">
        <div class="dash-card-head">
          <div>
            <h4>Monthly breakdown</h4>
            <span class="dash-card-sub">${activeMonths.length} active month${activeMonths.length === 1 ? '' : 's'}</span>
          </div>
        </div>
        ${activeMonths.length ? `
          <div class="table-wrap">
            <table class="data-table pl-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th class="num">Income</th>
                  <th class="num">Expenses</th>
                  <th class="num">Net</th>
                  <th class="num">Margin</th>
                </tr>
              </thead>
              <tbody>
                ${months.map(m => {
                  const active = m.income > 0 || m.expenses > 0;
                  if (!active) return '';
                  return `
                    <tr>
                      <td><b>${m.label}</b></td>
                      <td class="num">${inr(m.income)}</td>
                      <td class="num">${inr(m.expenses)}</td>
                      <td class="num ${m.net < 0 ? 'cell-overdue' : ''}"><b>${inr(m.net)}</b></td>
                      <td class="num">${m.income ? m.margin.toFixed(0) + '%' : '—'}</td>
                    </tr>
                  `;
                }).join('')}
                <tr class="pl-total-row">
                  <td><b>Total</b></td>
                  <td class="num"><b>${inr(income)}</b></td>
                  <td class="num"><b>${inr(expenseTotal)}</b></td>
                  <td class="num ${net < 0 ? 'cell-overdue' : ''}"><b>${inr(net)}</b></td>
                  <td class="num"><b>${margin.toFixed(1)}%</b></td>
                </tr>
              </tbody>
            </table>
          </div>
        ` : '<div class="empty-row">No income or expenses logged for this year</div>'}
      </div>

      <div class="pl-section">
        <div class="dash-card-head">
          <div>
            <h4>Expense categories</h4>
            <span class="dash-card-sub">Where money went in ${currentYear}</span>
          </div>
        </div>
        ${cats.length ? `
          <div class="pl-cats">
            ${cats.map(c => {
              const pct = expenseTotal > 0 ? (c.amount / expenseTotal) * 100 : 0;
              return `
                <div class="pl-cat">
                  <div class="pl-cat-head">
                    <span>${escapeHtml(c.cat)}</span>
                    <b>${inr(c.amount)}</b>
                  </div>
                  <div class="pl-cat-bar">
                    <div class="pl-cat-fill" style="width:${pct.toFixed(1)}%"></div>
                  </div>
                  <div class="pl-cat-pct">${pct.toFixed(1)}%</div>
                </div>
              `;
            }).join('')}
          </div>
        ` : '<div class="empty-row">No expenses logged yet</div>'}
      </div>
    </div>
  `;
}

// ---------- Wire ----------
export function wirePL() {
  const canvas = document.getElementById('pl-chart');
  if (!canvas || typeof Chart === 'undefined') return;

  if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

  const yearSel = document.getElementById('pl-year');
  yearSel?.addEventListener('change', async () => {
    currentYear = Number(yearSel.value);
    const main = document.getElementById('app');
    main.innerHTML = '<div class="page-loading"><span class="loader"></span></div>';
    const html = await renderPL();
    main.innerHTML = html;
    wirePL();
  });

  // Load data for the chart
  (async () => {
    try {
      const { cases, expenses } = await loadYear(currentYear);
      const months = buildMonthly(cases, expenses);

      const styles = getComputedStyle(document.documentElement);
      const primary = styles.getPropertyValue('--primary').trim() || '#1F3A93';
      const danger  = styles.getPropertyValue('--danger').trim()  || '#8B1E3F';
      const textColor = styles.getPropertyValue('--text-muted').trim() || '#6B7280';

      chartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: months.map(m => m.label),
          datasets: [
            {
              label: 'Income',
              data: months.map(m => m.income),
              backgroundColor: primary,
              borderRadius: 5,
              barPercentage: 0.7,
              categoryPercentage: 0.5,
            },
            {
              label: 'Expenses',
              data: months.map(m => m.expenses),
              backgroundColor: danger,
              borderRadius: 5,
              barPercentage: 0.7,
              categoryPercentage: 0.5,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'top',
              align: 'end',
              labels: {
                boxWidth: 10,
                boxHeight: 10,
                usePointStyle: true,
                pointStyle: 'rectRounded',
                color: textColor,
                font: { size: 11 },
              },
            },
            tooltip: {
              displayColors: false,
              callbacks: {
                label: (item) => `${item.dataset.label}: ${inr(item.parsed.y)}`,
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
                callback: (val) => '₹' + Number(val).toLocaleString('en-IN'),
              },
              grid: { color: 'rgba(0,0,0,.05)', drawBorder: false },
            },
          },
        },
      });
    } catch (err) {
      console.error('P&L chart error:', err);
    }
  })();
}