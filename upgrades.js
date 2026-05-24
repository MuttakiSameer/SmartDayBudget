/* ============================================================
   upgrades.js — SmartDayBudget Upgrade Module
   Handles: Currency, Dark Mode, Charts, PDF, Email, Share
   ============================================================ */

// ── 1. CURRENCY SYSTEM ──────────────────────────────────────
const currencies = {
  USD: { symbol: '$', name: 'USD' },
  BDT: { symbol: '৳', name: 'BDT' },
  GBP: { symbol: '£', name: 'GBP' },
  EUR: { symbol: '€', name: 'EUR' },
  INR: { symbol: '₹', name: 'INR' },
  PKR: { symbol: '₨', name: 'PKR' },
  NGN: { symbol: '₦', name: 'NGN' }
};

let currentCurrency = localStorage.getItem('sdb_currency') || 'USD';

function setCurrency(code) {
  currentCurrency = code;
  localStorage.setItem('sdb_currency', code);
  updateCurrencySymbols();
}

function updateCurrencySymbols() {
  const symbol = currencies[currentCurrency].symbol;
  document.querySelectorAll('.currency-symbol').forEach(el => {
    el.textContent = symbol;
  });
  const sel = document.getElementById('currency-selector');
  if (sel) sel.value = currentCurrency;
}

// ── 2. DARK MODE ─────────────────────────────────────────────
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('sdb_darkMode', isDark ? 'on' : 'off');
  const btn = document.getElementById('dark-mode-toggle');
  const mobileBtn = document.getElementById('mobile-dark-mode-toggle');
  if (btn) btn.textContent = isDark ? '☀️' : '🌙';
  if (mobileBtn) mobileBtn.textContent = isDark ? '☀️' : '🌙';
}

function initDarkMode() {
  if (localStorage.getItem('sdb_darkMode') === 'on') {
    document.body.classList.add('dark-mode');
    const btn = document.getElementById('dark-mode-toggle');
    const mobileBtn = document.getElementById('mobile-dark-mode-toggle');
    if (btn) btn.textContent = '☀️';
    if (mobileBtn) mobileBtn.textContent = '☀️';
  }
}

// ── 3. SHARE BUTTONS ─────────────────────────────────────────
function shareWhatsApp() {
  const text = encodeURIComponent('Free budget calculator — no sign-up needed: https://smartdaybudget.com');
  window.open('https://wa.me/?text=' + text, '_blank');
}
function shareTwitter() {
  const text = encodeURIComponent('Just used this free budget calculator — no bank linking, total privacy: https://smartdaybudget.com');
  window.open('https://twitter.com/intent/tweet?text=' + text, '_blank');
}
function shareFacebook() {
  window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent('https://smartdaybudget.com'), '_blank');
}

// ── 4. SAVE AS PDF ───────────────────────────────────────────
function savePDF() {
  window.print();
}

// ── 5. EMAIL CAPTURE ─────────────────────────────────────────
function subscribeEmail() {
  const input = document.getElementById('email-input');
  if (!input) return;
  const email = input.value.trim();
  if (!email || !email.includes('@')) {
    alert('Please enter a valid email address.');
    return;
  }
  const form = document.querySelector('.email-form');
  if (form) {
    form.innerHTML = '<p class="success-msg">✓ You\'re in! Check your inbox for your first tip.</p>';
  }
  // Future: replace with Mailchimp/ConvertKit API call
}

// ── 6. EMBED CODE COPY (index.html) ──────────────────────────
function copyEmbedCode() {
  const code = document.getElementById('embed-code');
  if (!code) return;
  const text = code.textContent.trim();
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('copy-embed-btn');
    if (btn) {
      btn.textContent = '✓ Copied!';
      setTimeout(() => { btn.textContent = 'Copy Embed Code'; }, 2000);
    }
  });
}

// ── 7. CHARTS ────────────────────────────────────────────────
let activeChart = null;

function destroyChart() {
  if (activeChart) {
    activeChart.destroy();
    activeChart = null;
  }
}

// Daily Budget — PIE CHART
function renderDailyBudgetChart(income, savings, expenses, allowance) {
  const container = document.getElementById('results-chart-container');
  const canvas = document.getElementById('resultsChart');
  if (!container || !canvas) return;
  if (income <= 0) { container.style.display = 'none'; return; }
  container.style.display = 'block';
  destroyChart();
  activeChart = new Chart(canvas, {
    type: 'pie',
    data: {
      labels: ['Savings', 'Expenses', 'Daily Allowance'],
      datasets: [{
        data: [
          Math.max(0, savings),
          Math.max(0, expenses),
          Math.max(0, allowance)
        ],
        backgroundColor: ['#2196F3', '#f44336', '#FF9800'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        title: { display: true, text: 'Budget Breakdown' }
      }
    }
  });
}

// Compound Interest — LINE CHART
function renderCompoundChart(P, PMT, r, t, n) {
  const container = document.getElementById('results-chart-container');
  const canvas = document.getElementById('resultsChart');
  if (!container || !canvas) return;
  if (t <= 0 || (P <= 0 && PMT <= 0)) { container.style.display = 'none'; return; }
  container.style.display = 'block';
  destroyChart();

  const labels = [];
  const withInterest = [];
  const principalOnly = [];
  const rDecimal = r / 100;

  for (let yr = 0; yr <= t; yr++) {
    labels.push('Year ' + yr);
    // With compound interest
    let FV = P * Math.pow(1 + rDecimal / n, n * yr);
    if (PMT > 0 && rDecimal > 0) {
      FV += PMT * ((Math.pow(1 + rDecimal / n, n * yr) - 1) / (rDecimal / n));
    } else if (PMT > 0) {
      FV += PMT * n * yr;
    }
    withInterest.push(Math.round(FV));
    // Principal only
    principalOnly.push(Math.round(P + PMT * n * yr));
  }

  activeChart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'With Compound Interest',
          data: withInterest,
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76,175,80,0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Principal Only',
          data: principalOnly,
          borderColor: '#aaaaaa',
          backgroundColor: 'rgba(170,170,170,0.1)',
          fill: true,
          tension: 0.1,
          borderDash: [5, 5]
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        title: { display: true, text: 'Growth Over Time' }
      },
      scales: {
        y: {
          ticks: {
            callback: val => currencies[currentCurrency].symbol + val.toLocaleString()
          }
        }
      }
    }
  });
}

// Loan Payoff — BAR CHART
function renderLoanChart(principal, totalInterest) {
  const container = document.getElementById('results-chart-container');
  const canvas = document.getElementById('resultsChart');
  if (!container || !canvas) return;
  if (principal <= 0) { container.style.display = 'none'; return; }
  container.style.display = 'block';
  destroyChart();
  activeChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: ['Principal', 'Total Interest Paid'],
      datasets: [{
        label: 'Amount',
        data: [Math.round(principal), Math.round(totalInterest)],
        backgroundColor: ['#2196F3', '#f44336'],
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Principal vs. Interest Cost' }
      },
      scales: {
        y: {
          ticks: {
            callback: val => currencies[currentCurrency].symbol + val.toLocaleString()
          }
        }
      }
    }
  });
}

// Credit Card Debt — DOUGHNUT CHART
function renderCreditCardChart(balance, totalInterest) {
  const container = document.getElementById('results-chart-container');
  const canvas = document.getElementById('resultsChart');
  if (!container || !canvas) return;
  if (balance <= 0) { container.style.display = 'none'; return; }
  container.style.display = 'block';
  destroyChart();
  activeChart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: ['Original Balance', 'Total Interest Cost'],
      datasets: [{
        data: [Math.round(balance), Math.round(totalInterest)],
        backgroundColor: ['#2196F3', '#f44336'],
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom' },
        title: {
          display: true,
          text: 'Total Cost: ' + currencies[currentCurrency].symbol + (balance + totalInterest).toLocaleString()
        }
      }
    }
  });
}

// Savings Goal — BAR CHART
function renderSavingsChart(current, goal) {
  const container = document.getElementById('results-chart-container');
  const canvas = document.getElementById('resultsChart');
  if (!container || !canvas) return;
  if (goal <= 0) { container.style.display = 'none'; return; }
  container.style.display = 'block';
  destroyChart();
  const remaining = Math.max(0, goal - current);
  activeChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: ['Current Savings', 'Amount Still Needed'],
      datasets: [{
        label: 'Amount',
        data: [Math.round(current), Math.round(remaining)],
        backgroundColor: ['#4CAF50', '#e0e0e0'],
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: { display: true, text: 'Progress to Goal' }
      },
      scales: {
        y: {
          ticks: {
            callback: val => currencies[currentCurrency].symbol + val.toLocaleString()
          }
        }
      }
    }
  });
}

// ── 8. DEBT-FREE DATE (credit-card-debt.html) ────────────────
function getDebtFreeDate(months) {
  if (!months || months <= 0 || months === Infinity) return '—';
  const date = new Date();
  date.setMonth(date.getMonth() + Math.ceil(months));
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// ── DOMContentLoaded INIT ────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Currency
  updateCurrencySymbols();

  // Dark mode
  initDarkMode();

  // Navbar scroll shadow
  const sidebar = document.querySelector('.sidebar');
  const contentArea = document.querySelector('.content-area') || document.querySelector('.main-content');
  if (contentArea && sidebar) {
    contentArea.addEventListener('scroll', () => {
      if (contentArea.scrollTop > 10) {
        sidebar.style.boxShadow = '2px 0 20px rgba(0,0,0,0.12)';
      } else {
        sidebar.style.boxShadow = '2px 0 20px rgba(0,0,0,0.02)';
      }
    });
  }

  // ── Hook into existing App.js calculation updates via MutationObserver ──

  // Daily Budget Chart
  const dbAllowance = document.getElementById('db-remaining-allowance');
  if (dbAllowance) {
    new MutationObserver(() => {
      const income = parseFloat(document.getElementById('db-total-income')?.textContent?.replace(/[^0-9.-]/g, '')) || 0;
      const savings = parseFloat(document.getElementById('db-target-amount')?.textContent?.replace(/[^0-9.-]/g, '')) || 0;
      const expenses = parseFloat(document.getElementById('db-total-expenses')?.textContent?.replace(/[^0-9.-]/g, '')) || 0;
      const allowance = parseFloat(dbAllowance.textContent?.replace(/[^0-9.-]/g, '')) || 0;
      renderDailyBudgetChart(income, savings, expenses, allowance);
    }).observe(dbAllowance, { childList: true, subtree: true, characterData: true });
  }

  // Compound Interest Chart
  const ciFV = document.getElementById('ci-fv');
  if (ciFV) {
    new MutationObserver(() => {
      const P = parseFloat(document.getElementById('ci-principal')?.value) || 0;
      const PMT = parseFloat(document.getElementById('ci-pmt')?.value) || 0;
      const r = parseFloat(document.getElementById('ci-rate')?.value) || 0;
      const t = parseFloat(document.getElementById('ci-time')?.value) || 0;
      const n = parseInt(document.getElementById('ci-compound')?.value) || 12;
      renderCompoundChart(P, PMT, r, t, n);
    }).observe(ciFV, { childList: true, subtree: true, characterData: true });
  }

  // Loan Chart
  const laInterest = document.getElementById('la-interest');
  if (laInterest) {
    new MutationObserver(() => {
      const principal = parseFloat(document.getElementById('la-amount')?.value) || 0;
      const interest = parseFloat(laInterest.textContent?.replace(/[^0-9.-]/g, '')) || 0;
      renderLoanChart(principal, interest);
    }).observe(laInterest, { childList: true, subtree: true, characterData: true });
  }

  // Credit Card Chart + Debt-Free Date
  const ccMonths = document.getElementById('cc-months');
  if (ccMonths) {
    new MutationObserver(() => {
      const balance = parseFloat(document.getElementById('cc-balance')?.value) || 0;
      const totalInterestEl = document.getElementById('cc-interest');
      const interest = parseFloat(totalInterestEl?.textContent?.replace(/[^0-9.-]/g, '')) || 0;
      const months = parseInt(ccMonths.textContent) || 0;
      renderCreditCardChart(balance, interest);
      // Debt-free date
      const dfDate = document.getElementById('debt-free-date');
      if (dfDate) dfDate.textContent = getDebtFreeDate(months);
    }).observe(ccMonths, { childList: true, subtree: true, characterData: true });
  }

  // Savings Goal Chart
  const sgDeposit = document.getElementById('sg-deposit');
  if (sgDeposit) {
    new MutationObserver(() => {
      const goal = parseFloat(document.getElementById('sg-goal')?.value) || 0;
      const current = parseFloat(document.getElementById('sg-current')?.value) || 0;
      renderSavingsChart(current, goal);
    }).observe(sgDeposit, { childList: true, subtree: true, characterData: true });
  }
});
