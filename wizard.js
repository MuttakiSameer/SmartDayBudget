/* ============================================================
   wizard.js — Accounting Wizard & Financial Dashboard
   SmartDayBudget — No backend, all localStorage
   ============================================================ */

// ── STATE ────────────────────────────────────────────────────
let wizardState = { name:'', amount:0, primaryCategory:'', subCategory:'', statementDestination:'', date:'' };
let transactions = JSON.parse(localStorage.getItem('sdb_transactions') || '[]');

// ── WIZARD OPEN / CLOSE ──────────────────────────────────────
function openWizard() {
  wizardState = { name:'', amount:0, primaryCategory:'', subCategory:'', statementDestination:'', date: new Date().toISOString().split('T')[0] };
  document.getElementById('txn-name').value = '';
  document.getElementById('txn-amount').value = '';
  showStep(1);
  document.getElementById('wizard-overlay').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeWizard() {
  document.getElementById('wizard-overlay').style.display = 'none';
  document.body.style.overflow = '';
}

function showStep(step) {
  document.querySelectorAll('.wizard-step').forEach(s => s.classList.remove('active'));
  document.getElementById('wizard-step-' + step).classList.add('active');
  document.getElementById('step-indicator').textContent = 'Step ' + step + ' of 3';
  document.getElementById('wizard-progress-bar').style.width = (step * 33.33) + '%';
}

function wizardGoBack(step) { showStep(step); }

// ── STEP 1 ───────────────────────────────────────────────────
function wizardStep1Next() {
  const name = document.getElementById('txn-name').value.trim();
  const amount = parseFloat(document.getElementById('txn-amount').value);
  if (!name) { alert('Please enter a transaction name.'); return; }
  if (!amount || amount <= 0) { alert('Please enter a valid amount greater than 0.'); return; }
  wizardState.name = name;
  wizardState.amount = amount;
  showStep(2);
}

// ── STEP 2 ───────────────────────────────────────────────────
function wizardStep2Select(category) {
  wizardState.primaryCategory = category;

  const cfg = {
    income_statement: {
      question: 'Is this money coming in or going out?',
      subtitle: 'This helps us put it in the right place.',
      options: [
        { icon:'📥', title:'Money coming in',    desc:'Salary, freelance payment, side income, gift received', sub:'Income',   dest:'Income Statement — Income'  },
        { icon:'📤', title:'Money going out',    desc:'Rent, food, bills, subscriptions, transport',           sub:'Expense',  dest:'Income Statement — Expense' }
      ]
    },
    balance_sheet: {
      question: 'Is this something you own or something you owe?',
      subtitle: 'Assets build wealth. Liabilities reduce it.',
      options: [
        { icon:'🏠', title:'Something I own',   desc:'Property, vehicle, equipment, savings, investments',    sub:'Asset',     dest:'Balance Sheet — Asset'     },
        { icon:'💳', title:'Something I owe',   desc:'Bank loan, credit card balance, mortgage, money borrowed', sub:'Liability', dest:'Balance Sheet — Liability' }
      ]
    },
    cash_flow: {
      question: 'What type of money movement is this?',
      subtitle: 'This tracks how money flows in and out of your life.',
      options: [
        { icon:'📊', title:'An investment I made', desc:'Stocks, mutual funds, property deposit, starting a business',     sub:'Investment',     dest:'Cash Flow — Investment'      },
        { icon:'🔄', title:'Paying back a loan',   desc:'Monthly loan repayment, paying off credit card, debt settlement', sub:'Loan Repayment',  dest:'Cash Flow — Loan Repayment'  }
      ]
    }
  };

  const c = cfg[category];
  document.getElementById('step3-question').textContent  = c.question;
  document.getElementById('step3-subtitle').textContent  = c.subtitle;

  document.getElementById('step3-options').innerHTML = c.options.map(o =>
    `<button class="wizard-option" onclick="wizardStep3Select('${o.sub}','${o.dest.replace(/'/g,"\\'")}')">
      <span class="option-icon">${o.icon}</span>
      <span class="option-title">${o.title}</span>
      <span class="option-desc">${o.desc}</span>
    </button>`
  ).join('');

  showStep(3);
}

// ── STEP 3 ───────────────────────────────────────────────────
function wizardStep3Select(subCategory, destination) {
  wizardState.subCategory = subCategory;
  wizardState.statementDestination = destination;

  const txn = {
    id: Date.now(),
    name: wizardState.name,
    amount: wizardState.amount,
    primaryCategory: wizardState.primaryCategory,
    subCategory: wizardState.subCategory,
    statementDestination: wizardState.statementDestination,
    date: wizardState.date
  };

  console.log('=== NEW TRANSACTION ===', JSON.stringify(txn, null, 2));
  transactions.push(txn);
  localStorage.setItem('sdb_transactions', JSON.stringify(transactions));

  closeWizard();
  renderAllTables();
  updateDashboardCards();
  showSuccessToast(txn.name, txn.statementDestination);
}

// ── RENDER TABLES ────────────────────────────────────────────
function renderAllTables() {
  renderTable('income_statement', 'income-table-body',   'income-clear-btn');
  renderTable('balance_sheet',    'balance-table-body',  'balance-clear-btn');
  renderTable('cash_flow',        'cashflow-table-body', 'cashflow-clear-btn');
}

function renderTable(category, tbodyId, clearBtnId) {
  const filtered = transactions.filter(t => t.primaryCategory === category);
  const tbody    = document.getElementById(tbodyId);
  const clearBtn = document.getElementById(clearBtnId);
  if (!tbody) return;

  const sym = (typeof currencies !== 'undefined' && typeof currentCurrency !== 'undefined')
    ? currencies[currentCurrency]?.symbol || '$' : '$';

  if (clearBtn) clearBtn.style.display = filtered.length > 0 ? 'inline-block' : 'none';

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-row">No transactions yet. Click "+ Add Transaction" to start.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(t => {
    const badgeClass = 'badge-' + t.subCategory.toLowerCase().replace(/\s+/g, '-');
    return `<tr>
      <td>${escHtml(t.name)}</td>
      <td>${sym}${t.amount.toLocaleString('en-US',{minimumFractionDigits:2})}</td>
      <td><span class="badge ${badgeClass}">${t.subCategory}</span></td>
      <td>${t.date}</td>
      <td><button class="btn-delete-row" onclick="deleteTransaction(${t.id})" title="Delete">×</button></td>
    </tr>`;
  }).join('');
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function deleteTransaction(id) {
  transactions = transactions.filter(t => t.id !== id);
  localStorage.setItem('sdb_transactions', JSON.stringify(transactions));
  renderAllTables();
  updateDashboardCards();
}

function clearTable(category, clearBtnId) {
  if (!confirm('Clear all ' + category.replace('_',' ') + ' transactions? This cannot be undone.')) return;
  transactions = transactions.filter(t => t.primaryCategory !== category);
  localStorage.setItem('sdb_transactions', JSON.stringify(transactions));
  renderAllTables();
  updateDashboardCards();
}

// ── COLLAPSE TOGGLE ──────────────────────────────────────────
function toggleTable(sectionId) {
  const body   = document.getElementById(sectionId + '-body-wrap');
  const toggle = document.getElementById(sectionId + '-toggle');
  if (!body) return;
  body.classList.toggle('hidden');
  if (toggle) toggle.classList.toggle('collapsed');
}

// ── DASHBOARD CARDS ──────────────────────────────────────────
function updateDashboardCards() {
  const sym = (typeof currencies !== 'undefined' && typeof currentCurrency !== 'undefined')
    ? currencies[currentCurrency]?.symbol || '$' : '$';

  const sum = sub => transactions.filter(t => t.subCategory === sub).reduce((s,t) => s + t.amount, 0);

  const income   = sum('Income');
  const expenses = sum('Expense');
  const net      = income - expenses;
  const score    = calculateHealthScore();

  const fmt = n => sym + Math.abs(n).toLocaleString('en-US', {minimumFractionDigits:2});

  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  setEl('card-income',   fmt(income));
  setEl('card-expenses', fmt(expenses));

  const netEl  = document.getElementById('card-net');
  const netCard = document.getElementById('net-card');
  if (netEl)  netEl.textContent = (net < 0 ? '-' : '+') + fmt(net);
  if (netCard) netCard.className = 'dash-card ' + (net >= 0 ? 'positive' : 'negative');

  setEl('card-score', score + '/100');
  const scoreCard = document.getElementById('score-card');
  if (scoreCard) scoreCard.className = 'dash-card score';
}

// ── HEALTH SCORE ─────────────────────────────────────────────
function calculateHealthScore() {
  const sum = sub => transactions.filter(t => t.subCategory === sub).reduce((s,t) => s + t.amount, 0);
  const income      = sum('Income');
  const expenses    = sum('Expense');
  const assets      = sum('Asset');
  const liabilities = sum('Liability');

  if (income === 0) return 0;

  let score = 50;
  const savingsRate = (income - expenses) / income;
  if      (savingsRate >= 0.2) score += 40;
  else if (savingsRate >= 0.1) score += 25;
  else if (savingsRate >= 0)   score += 10;
  else                         score -= 20;

  if      (assets > liabilities)  score += 10;
  else if (liabilities > assets)  score -= 10;

  return Math.max(0, Math.min(100, score));
}

// ── SUCCESS TOAST ────────────────────────────────────────────
function showSuccessToast(name, dest) {
  const existing = document.getElementById('success-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'success-toast';
  toast.innerHTML = `✓ <strong>${escHtml(name)}</strong> added to ${escHtml(dest)}`;
  Object.assign(toast.style, {
    position:'fixed', bottom:'24px', right:'24px',
    background:'#1a1a2e', color:'#fff',
    padding:'14px 20px', borderRadius:'10px',
    fontSize:'14px', zIndex:'9999',
    boxShadow:'0 4px 20px rgba(0,0,0,0.2)',
    animation:'slideUp 0.3s ease', maxWidth:'320px',
    lineHeight:'1.4'
  });
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ── INIT ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderAllTables();
  updateDashboardCards();

  const overlay = document.getElementById('wizard-overlay');
  if (overlay) {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeWizard();
    });
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeWizard();
  });
});
