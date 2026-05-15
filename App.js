// Utility: Format Currency
const formatCurrency = (num) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
};

// --- CENTRALIZED APP STATE & LOCAL STORAGE ---
const AppState = {
    uiMode: 'classic',
    incomes: [{ id: Date.now(), name: 'Salary', amount: '' }],
    expenses: [{ id: Date.now() + 1, name: 'Rent', amount: '' }],
    targetSavingsMode: 'percent',
    targetSavingsPercent: 15,
    targetSavingsAmount: '',
    currentStreak: 0,
    lastSavedDate: null,
    
    // Generic simple calculator inputs
    calculators: {}
};

// Debounce Utility to prevent main thread blocking
let saveTimeout;
const saveState = () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        localStorage.setItem('SmartDayBudget_MasterState', JSON.stringify(AppState));
    }, 400); // 400ms debounce
};

// Initialize App State
const initializeApp = () => {
    const stored = localStorage.getItem('SmartDayBudget_MasterState');
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            Object.assign(AppState, parsed);
            // Ensure lists exist
            if (!AppState.incomes) AppState.incomes = [];
            if (!AppState.expenses) AppState.expenses = [];
            if (!AppState.calculators) AppState.calculators = {};
            if (!AppState.uiMode) AppState.uiMode = 'classic';
            if (AppState.currentStreak === undefined) AppState.currentStreak = 0;
            if (AppState.lastSavedDate === undefined) AppState.lastSavedDate = null;
        } catch(e) {
            console.error('State parse error');
        }
    }
};
// Run initialize before setting up UI
initializeApp();

// --- A. Daily Tracker (Budget Architect) ---
const initDailyBudget = () => {
    // DOM Elements
    const incomesContainer = document.getElementById('incomes-container');
    const expensesContainer = document.getElementById('expenses-container');
    const modePercentBtn = document.getElementById('mode-percent');
    const modeAmountBtn = document.getElementById('mode-amount');
    const percentInput = document.getElementById('db-target-savings-percent');
    const amountInput = document.getElementById('db-target-savings-amount');
    const addIncomeBtn = document.getElementById('add-income-btn');
    const addExpenseBtn = document.getElementById('add-expense-btn');

    percentInput.value = AppState.targetSavingsPercent;
    amountInput.value = AppState.targetSavingsAmount;

    const updateTargetSavingsUI = () => {
        if (AppState.targetSavingsMode === 'percent') {
            modePercentBtn.classList.add('active');
            modeAmountBtn.classList.remove('active');
            percentInput.style.display = 'block';
            amountInput.style.display = 'none';
        } else {
            modeAmountBtn.classList.add('active');
            modePercentBtn.classList.remove('active');
            amountInput.style.display = 'block';
            percentInput.style.display = 'none';
        }
    };
    
    updateTargetSavingsUI();

    // --- State & DOM Sync (Event Delegation) ---
    
    const handleInputEvent = (e, type) => {
        if (e.target.tagName.toLowerCase() === 'input') {
            const id = parseInt(e.target.dataset.id);
            const array = type === 'incomes' ? AppState.incomes : AppState.expenses;
            const entry = array.find(x => x.id === id);
            
            if (entry) {
                if (e.target.classList.contains('item-name')) {
                    entry.name = e.target.value;
                } else if (e.target.classList.contains('item-amount')) {
                    entry.amount = e.target.value;
                }
                saveState();
                updateDailyBudget();
            }
        }
    };

    const handleClickEvent = (e, type) => {
        if (e.target.classList.contains('btn-remove')) {
            const id = parseInt(e.target.dataset.id);
            if (type === 'incomes') {
                AppState.incomes = AppState.incomes.filter(x => x.id !== id);
            } else {
                AppState.expenses = AppState.expenses.filter(x => x.id !== id);
            }
            saveState();
            renderList(type);
            updateDailyBudget();
        }
    };

    incomesContainer.addEventListener('input', (e) => handleInputEvent(e, 'incomes'));
    incomesContainer.addEventListener('click', (e) => handleClickEvent(e, 'incomes'));
    
    expensesContainer.addEventListener('input', (e) => handleInputEvent(e, 'expenses'));
    expensesContainer.addEventListener('click', (e) => handleClickEvent(e, 'expenses'));

    // --- Dynamic Rendering ---
    const renderList = (type) => {
        const container = type === 'incomes' ? incomesContainer : expensesContainer;
        const data = type === 'incomes' ? AppState.incomes : AppState.expenses;
        container.innerHTML = '';
        
        data.forEach(item => {
            const row = document.createElement('div');
            row.className = 'expense-row';
            row.innerHTML = `
                <input type="text" class="item-name" placeholder="${type === 'incomes' ? 'Income Source (e.g. Salary)' : 'Expense Name'}" value="${item.name}" data-id="${item.id}" required>
                <input type="number" class="item-amount" placeholder="0.00" value="${item.amount}" min="0" step="0.01" data-id="${item.id}" required>
                <button class="btn-remove" data-id="${item.id}" aria-label="Remove">×</button>
            `;
            container.appendChild(row);
        });
    };

    const updateDailyBudget = () => {
        const totalIncome = AppState.incomes.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        const totalExpenses = AppState.expenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

        let targetSavingsPercent = 0;
        
        if (AppState.targetSavingsMode === 'percent') {
            targetSavingsPercent = parseFloat(percentInput.value) || 0;
            const calcAmount = totalIncome * (targetSavingsPercent / 100);
            if (document.activeElement !== amountInput) {
                amountInput.value = calcAmount > 0 ? calcAmount.toFixed(2) : '';
                AppState.targetSavingsAmount = amountInput.value;
            }
        } else {
            const targetAmount = parseFloat(amountInput.value) || 0;
            targetSavingsPercent = totalIncome > 0 ? (targetAmount / totalIncome) * 100 : 0;
            if (document.activeElement !== percentInput) {
                percentInput.value = targetSavingsPercent > 0 ? targetSavingsPercent.toFixed(1) : '';
                AppState.targetSavingsPercent = percentInput.value;
            }
        }

        saveState();

        const result = FinanceMath.calculateBudget(totalIncome, totalExpenses, targetSavingsPercent);

        // Gamification / Streak Counter Logic
        const today = new Date().toISOString().split('T')[0];
        
        if (result.remainingAllowance >= 0 && result.totalIncome > 0) {
            if (AppState.lastSavedDate !== today) {
                if (AppState.lastSavedDate) {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    const yesterdayStr = yesterday.toISOString().split('T')[0];
                    
                    if (AppState.lastSavedDate === yesterdayStr) {
                        AppState.currentStreak += 1;
                    } else {
                        AppState.currentStreak = 1;
                    }
                } else {
                    AppState.currentStreak = 1;
                }
                AppState.lastSavedDate = today;
                saveState();
            }
        } else if (result.remainingAllowance < 0) {
            if (AppState.currentStreak > 0) {
                AppState.currentStreak = 0;
                saveState();
            }
        }

        requestAnimationFrame(() => {
            document.getElementById('db-total-income').textContent = formatCurrency(result.totalIncome);
            document.getElementById('db-target-amount').textContent = formatCurrency(result.targetAmount);
            document.getElementById('db-total-expenses').textContent = formatCurrency(result.totalExpenses);
            document.getElementById('db-classic-total-expenses').textContent = formatCurrency(result.totalExpenses);
            document.getElementById('db-remaining-allowance').textContent = formatCurrency(result.remainingAllowance);
            
            const saveLoseLabel = document.getElementById('db-save-lose-label');
            const streakBadge = document.getElementById('db-streak-badge');
            
            if (result.saveLosePercentage >= 0) {
                saveLoseLabel.textContent = 'Save';
            } else {
                saveLoseLabel.textContent = 'Lose';
            }
            
            if (AppState.currentStreak > 0) {
                streakBadge.textContent = `🔥 ${AppState.currentStreak} Day Streak!`;
                streakBadge.style.display = 'inline';
            } else {
                streakBadge.style.display = 'none';
            }
            
            document.getElementById('db-save-lose-percentage').textContent = Math.abs(result.saveLosePercentage).toFixed(2) + '%';

            const badge = document.getElementById('db-badge');
            const warning = document.getElementById('db-warning');
            const insight = document.getElementById('db-insight');

            if (result.totalIncome === 0 && result.totalExpenses === 0) {
                badge.textContent = 'Ready';
                badge.className = 'badge neutral';
                warning.style.display = 'none';
                insight.textContent = "Add your incomes and expenses to see your allowance.";
            } else if (result.remainingAllowance >= 0) {
                badge.textContent = 'On Track';
                badge.className = 'badge profit';
                warning.style.display = 'none';
                insight.textContent = `You are on track! You have ${formatCurrency(result.remainingAllowance)} left to spend without compromising your goal.`;
            } else {
                badge.textContent = 'Losing Money';
                badge.className = 'badge loss';
                warning.style.display = 'block';
                warning.textContent = "You are currently losing money relative to your goal.";
                insight.textContent = `You have exceeded your allowed expenses by ${formatCurrency(Math.abs(result.remainingAllowance))}. Consider reducing some expenses.`;
            }
        });
    };

    addIncomeBtn.addEventListener('click', () => {
        AppState.incomes.push({ id: Date.now(), name: '', amount: '' });
        saveState();
        renderList('incomes');
    });

    addExpenseBtn.addEventListener('click', () => {
        AppState.expenses.push({ id: Date.now(), name: '', amount: '' });
        saveState();
        renderList('expenses');
    });

    modePercentBtn.addEventListener('click', () => {
        AppState.targetSavingsMode = 'percent';
        saveState();
        updateTargetSavingsUI();
        updateDailyBudget();
    });

    modeAmountBtn.addEventListener('click', () => {
        AppState.targetSavingsMode = 'amount';
        saveState();
        updateTargetSavingsUI();
        updateDailyBudget();
    });

    percentInput.addEventListener('input', (e) => {
        AppState.targetSavingsPercent = e.target.value;
        updateDailyBudget();
    });

    amountInput.addEventListener('input', (e) => {
        AppState.targetSavingsAmount = e.target.value;
        updateDailyBudget();
    });

    renderList('incomes');
    renderList('expenses');
    updateDailyBudget();
};

// Generic Initializer for basic calculators
const bindCalculatorInputs = (inputs, updateFn) => {
    inputs.forEach(id => {
        const el = document.getElementById(id);
        // Default to 'months' if it's the time unit dropdown
        if (!AppState.calculators[id]) {
            AppState.calculators[id] = (id === 'sg-time-unit') ? 'months' : (id === 'ci-compound' ? '12' : '');
        }
        el.value = AppState.calculators[id];
        
        el.addEventListener('input', () => {
            AppState.calculators[id] = el.value;
            saveState();
            updateFn();
        });
    });
};

// --- B. Compound Interest ---
const initCompoundInterest = () => {
    const inputs = ['ci-principal', 'ci-pmt', 'ci-rate', 'ci-time', 'ci-compound'];
    const updateCompoundInterest = () => {
        const P = parseFloat(document.getElementById('ci-principal').value) || 0;
        const PMT = parseFloat(document.getElementById('ci-pmt').value) || 0;
        const r = parseFloat(document.getElementById('ci-rate').value) || 0;
        const t = parseFloat(document.getElementById('ci-time').value) || 0;
        const n = parseInt(document.getElementById('ci-compound').value) || 12;
        
        const { FV, interest, totalContributions } = FinanceMath.calculateCompoundInterest(P, PMT, r, t, n);
        
        requestAnimationFrame(() => {
            document.getElementById('ci-fv').textContent = formatCurrency(FV);
            document.getElementById('ci-interest').textContent = formatCurrency(interest);
            
            const insight = document.getElementById('ci-insight');
            if (P === 0 && PMT === 0) {
                insight.textContent = "Watch your money grow through the power of compounding.";
            } else {
                const interestPercentage = totalContributions > 0 ? (interest / FV) * 100 : 0;
                insight.textContent = `In ${t} years, your total balance will be ${formatCurrency(FV)}. ${interestPercentage.toFixed(1)}% of this final amount is pure interest earned!`;
            }
        });
    };
    
    bindCalculatorInputs(inputs, updateCompoundInterest);
    updateCompoundInterest();
};

// --- C. Loan Amortization ---
const initLoanAmortization = () => {
    const inputs = ['la-amount', 'la-rate', 'la-term'];
    const updateLoanAmortization = () => {
        const L = parseFloat(document.getElementById('la-amount').value) || 0;
        const i = parseFloat(document.getElementById('la-rate').value) || 0;
        const n = parseFloat(document.getElementById('la-term').value) || 0;
        
        const { M, totalInterest, totalCost } = FinanceMath.calculateLoanAmortization(L, i, n);
        
        requestAnimationFrame(() => {
            document.getElementById('la-payment').textContent = formatCurrency(M);
            document.getElementById('la-interest').textContent = formatCurrency(totalInterest);
            document.getElementById('la-total').textContent = formatCurrency(totalCost);
            
            const insight = document.getElementById('la-insight');
            if (L === 0) {
                insight.textContent = "Know exactly how much your loan will cost you over time.";
            } else {
                insight.textContent = `You will pay ${formatCurrency(M)} monthly for ${n} months. The interest adds an extra ${((totalInterest/L)*100 || 0).toFixed(1)}% to your original loan amount.`;
            }
        });
    };
    
    bindCalculatorInputs(inputs, updateLoanAmortization);
    updateLoanAmortization();
};

// --- D. Credit Card Debt ---
const initCreditCardDebt = () => {
    const inputs = ['cc-balance', 'cc-apr', 'cc-payment'];
    const updateCreditCardDebt = () => {
        const B = parseFloat(document.getElementById('cc-balance').value) || 0;
        const APR = parseFloat(document.getElementById('cc-apr').value) || 0;
        const p = parseFloat(document.getElementById('cc-payment').value) || 0;
        
        requestAnimationFrame(() => {
            const warning = document.getElementById('cc-warning');
            const insight = document.getElementById('cc-insight');
            
            if (B === 0 || p === 0) {
                document.getElementById('cc-months').textContent = '0';
                document.getElementById('cc-interest').textContent = '$0.00';
                warning.style.display = 'none';
                insight.textContent = "Plan your path to becoming debt-free.";
                return;
            }
            
            const result = FinanceMath.calculateCreditCardDebt(B, APR, p);
            
            if (result.error) {
                warning.style.display = 'block';
                warning.textContent = result.message;
                document.getElementById('cc-months').textContent = '∞';
                document.getElementById('cc-interest').textContent = '∞';
                insight.textContent = "Please increase your monthly payment to outpace the interest charges.";
            } else {
                warning.style.display = 'none';
                document.getElementById('cc-months').textContent = result.months;
                document.getElementById('cc-interest').textContent = formatCurrency(result.totalInterest);
                
                const years = (result.months / 12).toFixed(1);
                insight.textContent = `At this rate, you will be debt-free in ${result.months} months (about ${years} years), paying ${formatCurrency(result.totalInterest)} in interest.`;
            }
        });
    };
    
    bindCalculatorInputs(inputs, updateCreditCardDebt);
    updateCreditCardDebt();
};

// --- E. Savings Goal ---
const initSavingsGoal = () => {
    const inputs = ['sg-goal', 'sg-current', 'sg-time', 'sg-time-unit'];
    const updateSavingsGoal = () => {
        const G = parseFloat(document.getElementById('sg-goal').value) || 0;
        const S = parseFloat(document.getElementById('sg-current').value) || 0;
        const T = parseFloat(document.getElementById('sg-time').value) || 0;
        const unit = document.getElementById('sg-time-unit').value || 'months';
        
        const { monthlyDeposit } = FinanceMath.calculateSavingsGoal(G, S, T, unit);
        
        requestAnimationFrame(() => {
            document.getElementById('sg-deposit').textContent = formatCurrency(monthlyDeposit);
            
            const insight = document.getElementById('sg-insight');
            if (G === 0 || T === 0) {
                insight.textContent = "Set your goal and figure out exactly what it takes to reach it.";
            } else if (S >= G) {
                insight.textContent = "Congratulations! You have already reached or exceeded your savings goal.";
            } else {
                insight.textContent = `To reach your goal of ${formatCurrency(G)} in ${T} ${unit}, you need to save ${formatCurrency(monthlyDeposit)} each month.`;
            }
        });
    };
    
    bindCalculatorInputs(inputs, updateSavingsGoal);
    updateSavingsGoal();
};

// --- UX Fix: Prevent mouse wheel from changing number inputs ---
const initNumberInputScrollFix = () => {
    document.addEventListener('wheel', () => {
        if (document.activeElement.type === 'number') {
            document.activeElement.blur();
        }
    });
};

// --- Copy Functionality ---
const initCopyButtons = () => {
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = e.target.dataset.calc;
            const section = document.getElementById(targetId);
            
            let textToCopy = `📊 SmartDayBudget - ${section.querySelector('h2').textContent}\n\n`;
            
            const outputs = section.querySelectorAll('.result-row');
            outputs.forEach(row => {
                const labelNode = row.querySelector('span').firstChild;
                const label = labelNode ? labelNode.textContent.trim() : row.querySelector('span').textContent.trim();
                const value = row.querySelector('strong').textContent;
                textToCopy += `👉 ${label}: ${value}\n`;
            });
            
            const insight = section.querySelector('.insight').textContent;
            textToCopy += `\n💡 Insight: ${insight}\n\n`;
            textToCopy += `🔗 Plan your budget at: https://smartdaybudget.com`;
            
            navigator.clipboard.writeText(textToCopy).then(() => {
                const originalText = e.target.textContent;
                e.target.textContent = 'Copied!';
                setTimeout(() => {
                    e.target.textContent = originalText;
                }, 2000);
            });
        });
    });
};

// --- Embed Widget Functionality ---
const initEmbedButtons = () => {
    const embedBtn = document.getElementById('db-embed-btn');
    if (embedBtn) {
        embedBtn.addEventListener('click', (e) => {
            const embedCode = `<iframe src="https://smartdaybudget.com/#daily-budget" width="100%" height="600" style="border:none; border-radius: 12px;"></iframe>`;
            navigator.clipboard.writeText(embedCode).then(() => {
                const originalText = e.target.textContent;
                e.target.textContent = 'Code Copied!';
                setTimeout(() => {
                    e.target.textContent = originalText;
                }, 2000);
            });
        });
    }

    // Check for Iframe (Embed Mode)
    if (window.self !== window.top) {
        document.body.classList.add('embed-mode');
    }
};

// --- Inline JS Extracted Event Listeners ---
const initGlobalEventListeners = () => {
    // Dark Mode Toggles
    const darkModeBtns = [document.getElementById('dark-mode-toggle'), document.getElementById('mobile-dark-mode-toggle')];
    darkModeBtns.forEach(btn => {
        if (btn) {
            btn.addEventListener('click', () => {
                if (typeof toggleDarkMode === 'function') toggleDarkMode();
            });
        }
    });

    // Currency Selectors
    const currencySelectors = [document.getElementById('currency-selector'), document.getElementById('currency-selector-mobile')];
    currencySelectors.forEach(selector => {
        if (selector) {
            selector.addEventListener('change', (e) => {
                if (typeof setCurrency === 'function') setCurrency(e.target.value);
            });
            selector.removeAttribute('onchange');
        }
    });
};

// Initialize App on DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('daily-budget')) initDailyBudget();
    if (document.getElementById('compound-interest')) initCompoundInterest();
    if (document.getElementById('loan-amortization')) initLoanAmortization();
    if (document.getElementById('credit-card-debt')) initCreditCardDebt();
    if (document.getElementById('savings-goal')) initSavingsGoal();
    initCopyButtons();
    initEmbedButtons();
    initNumberInputScrollFix();
    initGlobalEventListeners();
});