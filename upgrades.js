/* ============================================================
   upgrades.js — SmartDayBudget Upgrade Module
   Handles: Currency, Dark Mode, Charts, PDF, Email, Share, Copy
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
  const symbol = (currencies[currentCurrency] || currencies["USD"]).symbol;
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
}

// ── 6. EMBED CODE COPY ──────────────────────────
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
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js not loaded. Skipping Daily Budget Chart.');
    return;
  }
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
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js not loaded. Skipping Compound Interest Chart.');
    return;
  }
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
            callback: val => (currencies[currentCurrency] || currencies["USD"]).symbol + val.toLocaleString()
          }
        }
      }
    }
  });
}

// Loan Payoff — BAR CHART
function renderLoanChart(principal, totalInterest) {
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js not loaded. Skipping Loan Chart.');
    return;
  }
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
            callback: val => (currencies[currentCurrency] || currencies["USD"]).symbol + val.toLocaleString()
          }
        }
      }
    }
  });
}

// Credit Card Debt — DOUGHNUT CHART
function renderCreditCardChart(balance, totalInterest) {
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js not loaded. Skipping Credit Card Chart.');
    return;
  }
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
          text: 'Total Cost: ' + (currencies[currentCurrency] || currencies["USD"]).symbol + (balance + totalInterest).toLocaleString()
        }
      }
    }
  });
}

// Savings Goal — BAR CHART
function renderSavingsChart(current, goal) {
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js not loaded. Skipping Savings Goal Chart.');
    return;
  }
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
            callback: val => (currencies[currentCurrency] || currencies["USD"]).symbol + val.toLocaleString()
          }
        }
      }
    }
  });
}

// ── 8. DEBT-FREE DATE ────────────────
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

  // Global Copy Summary Click Listener
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-copy-summary');
    if (btn) {
      const pre = btn.closest('.right-wing-canvas').querySelector('.canvas-pre');
      if (pre) {
        const text = pre.textContent;
        navigator.clipboard.writeText(text).then(() => {
          const originalText = btn.textContent;
          btn.textContent = 'Report Copied! ✓';
          setTimeout(() => {
            btn.textContent = originalText;
          }, 2000);
        });
      }
    }
  });

  // Daily Budget Chart Observer
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

  // Compound Interest Chart Observer
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

  // Loan Chart Observer
  const laInterest = document.getElementById('la-interest');
  if (laInterest) {
    new MutationObserver(() => {
      const principal = parseFloat(document.getElementById('la-amount')?.value) || 0;
      const interest = parseFloat(laInterest.textContent?.replace(/[^0-9.-]/g, '')) || 0;
      renderLoanChart(principal, interest);
    }).observe(laInterest, { childList: true, subtree: true, characterData: true });
  }

  // Credit Card Chart + Debt-Free Date Observer
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

  // Savings Goal Chart Observer
  const sgDeposit = document.getElementById('sg-deposit');
  if (sgDeposit) {
    new MutationObserver(() => {
      const goal = parseFloat(document.getElementById('sg-goal')?.value) || 0;
      const current = parseFloat(document.getElementById('sg-current')?.value) || 0;
      renderSavingsChart(current, goal);
    }).observe(sgDeposit, { childList: true, subtree: true, characterData: true });
  }

  // Global Inline Arithmetic Evaluator Init
  initializeInlineCalculators();
});

// ── 9. INLINE ARITHMETIC EVALUATOR ───────────────────────────
function evaluateInlineMath(input) {
  const rawVal = input.value.trim();
  if (!rawVal) return;
  
  // Replace custom symbols with standard JS operators
  let sanitized = rawVal.replace(/x/gi, '*').replace(/÷/g, '/');
  // Strip out all characters that aren't math operators, decimals, spaces, or parenthesis
  sanitized = sanitized.replace(/[^0-9+\-*/().\s]/g, '');
  
  // Test if it contains at least one math operator to evaluate
  if (!/[+\-*/]/.test(sanitized)) {
      return;
  }
  
  try {
      // Safe evaluation
      const result = Function("return (" + sanitized + ")")();
      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
          // Format result to a clean decimal string (max 4 decimal places)
          const resolvedValue = Number(result.toFixed(4)).toString();
          input.value = resolvedValue;
          
          // Dispatch input and change events so the active calculator reacts immediately
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          
          // Fade out the helper tip if present
          const tip = input.parentNode.querySelector('.math-tip');
          if (tip) {
              tip.style.opacity = '0';
              setTimeout(() => tip.remove(), 300);
          }
      }
  } catch (e) {
      console.warn('Inline evaluation failed:', e);
  }
}

function updateInlineMathTip(input) {
  const value = input.value;
  const hasOperator = /[+\-*x/÷]/.test(value);
  let tip = input.parentNode.querySelector('.math-tip');
  
  if (hasOperator) {
      if (!tip) {
          tip = document.createElement('span');
          tip.className = 'math-tip';
          tip.style.fontSize = '0.75rem';
          tip.style.color = '#888';
          tip.style.display = 'block';
          tip.style.marginTop = '2px';
          tip.style.transition = 'opacity 0.2s ease';
          tip.textContent = '⌨️ Press Enter to calculate';
          input.parentNode.appendChild(tip);
      }
      tip.style.opacity = '1';
  } else {
      if (tip) {
          tip.style.opacity = '0';
          setTimeout(() => {
              if (tip && tip.style.opacity === '0') {
                  tip.remove();
              }
          }, 300);
      }
  }
}

function initializeInlineCalculators() {
  // Keydown listener for Enter key evaluation using event delegation
  document.addEventListener('keydown', (e) => {
      const target = e.target;
      if (target && target.classList.contains('math-input')) {
          if (e.key === 'Enter') {
              e.preventDefault();
              evaluateInlineMath(target);
          }
      }
  });

  // Focusout (blur) listener for evaluation using event delegation
  document.addEventListener('focusout', (e) => {
      const target = e.target;
      if (target && target.classList.contains('math-input')) {
          evaluateInlineMath(target);
      }
  });

  // Input listener to display dynamic micro-tip using event delegation
  document.addEventListener('input', (e) => {
      const target = e.target;
      if (target && target.classList.contains('math-input')) {
          updateInlineMathTip(target);
      }
  });
}
