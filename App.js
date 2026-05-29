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
    calculators: {},
    
    statements: {
        balanceSheet: { assets: [], liabilities: [], equity: [] },
        incomeStatement: { revenues: [], expenses: [] },
        cashFlow: { initialCash: '', entries: [] },
        changesInEquity: { beginningEquity: '', newCapital: '', dividends: '' }
    }
};

// Debounce Utility to prevent main thread blocking
let saveTimeout;
const saveState = () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        try {
            localStorage.setItem('SmartDayBudget_MasterState', JSON.stringify(AppState));
        } catch (e) {
            console.error('LocalStorage save error:', e);
        }
    }, 400); // 400ms debounce
};

// Initialize App State
const initializeApp = () => {
    const stored = localStorage.getItem('SmartDayBudget_MasterState');
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            Object.assign(AppState, parsed);
            // Ensure lists exist defensively
            if (!AppState.incomes) AppState.incomes = [];
            if (!AppState.expenses) AppState.expenses = [];
            if (!AppState.calculators) AppState.calculators = {};
            if (!AppState.uiMode) AppState.uiMode = 'classic';
            if (AppState.currentStreak === undefined) AppState.currentStreak = 0;
            if (AppState.lastSavedDate === undefined) AppState.lastSavedDate = null;
            if (!AppState.statements) AppState.statements = {};
            if (!AppState.statements.balanceSheet) AppState.statements.balanceSheet = { assets: [], liabilities: [], equity: [] };
            if (!AppState.statements.incomeStatement) AppState.statements.incomeStatement = { revenues: [], expenses: [] };
            if (!AppState.statements.cashFlow) AppState.statements.cashFlow = { initialCash: '', entries: [] };
            if (!AppState.statements.changesInEquity) AppState.statements.changesInEquity = { beginningEquity: '', newCapital: '', dividends: '' };
        } catch(e) {
            console.error('State parse error:', e);
        }
    } else {
        saveState();
    }
};

// Run initialize before setting up UI
initializeApp();

// Safe dynamic currency formatting using upgrades.js current currency system
const formatCurrency = (num) => {
    const currencyCode = typeof currentCurrency !== 'undefined' ? currentCurrency : 'USD';
    const symbol = typeof currencies !== 'undefined' && currencies[currencyCode] ? currencies[currencyCode].symbol : '$';
    const formatted = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
    return `${symbol}${formatted}`;
};

// --- A. Daily Tracker (Budget Architect) ---
const initDailyBudget = () => {
    const incomesContainer = document.getElementById('incomes-container');
    const expensesContainer = document.getElementById('expenses-container');
    const modePercentBtn = document.getElementById('mode-percent');
    const modeAmountBtn = document.getElementById('mode-amount');
    const percentInput = document.getElementById('db-target-savings-percent');
    const amountInput = document.getElementById('db-target-savings-amount');
    const addIncomeBtn = document.getElementById('add-income-btn');
    const addExpenseBtn = document.getElementById('add-expense-btn');

    if (!incomesContainer || !expensesContainer || !modePercentBtn || !modeAmountBtn || !percentInput || !amountInput || !addIncomeBtn || !addExpenseBtn) {
        console.warn('Daily Budget elements not found. Skipping daily budget initialization.');
        return;
    }

    percentInput.value = AppState.targetSavingsPercent;
    amountInput.value = AppState.targetSavingsAmount;

    const updateTargetSavingsUI = () => {
        if (AppState.targetSavingsMode === 'percent') {
            modePercentBtn.classList.add('active');
            modeAmountBtn.classList.remove('active');
            percentInput.classList.remove('hidden');
            amountInput.classList.add('hidden');
            percentInput.style.display = 'block';
            amountInput.style.display = 'none';
        } else {
            modeAmountBtn.classList.add('active');
            modePercentBtn.classList.remove('active');
            amountInput.classList.remove('hidden');
            percentInput.classList.add('hidden');
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
                <input type="text" class="item-name" placeholder="${type === 'incomes' ? 'Income Source (e.g. Salary)' : 'Expense Name'}" value="${item.name || ''}" data-id="${item.id}" required>
                <input type="text" class="item-amount math-input" placeholder="0.00" value="${item.amount || ''}" data-id="${item.id}" required>
                <button class="btn-remove" data-id="${item.id}" aria-label="Remove">×</button>
            `;

            // Inline suggestion badges for Daily Budget
            const suggestionBadges = type === 'incomes'
                ? ['➕ Salary', '➕ Side Hustle', '➕ Freelance', '➕ Business']
                : ['➖ Rent', '➖ Groceries', '➖ Utilities', '➖ Subscriptions', '➖ Transport'];

            const pillBox = document.createElement('div');
            pillBox.className = 'suggestion-pills-box';
            suggestionBadges.forEach(badge => {
                const pill = document.createElement('span');
                pill.className = 'suggestion-pill';
                pill.textContent = badge;
                pill.addEventListener('click', () => {
                    const cleanName = badge.replace(/^[➕➖]\s*/, '');
                    item.name = cleanName;
                    saveState();
                    renderList(type);
                    updateDailyBudget();
                });
                pillBox.appendChild(pill);
            });
            row.appendChild(pillBox);

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
            const totalIncomeEl = document.getElementById('db-total-income');
            const targetAmountEl = document.getElementById('db-target-amount');
            const totalExpensesEl = document.getElementById('db-total-expenses');
            const classicTotalExpensesEl = document.getElementById('db-classic-total-expenses');
            const remainingAllowanceEl = document.getElementById('db-remaining-allowance');
            
            if (totalIncomeEl) totalIncomeEl.textContent = formatCurrency(result.totalIncome);
            if (targetAmountEl) targetAmountEl.textContent = formatCurrency(result.targetAmount);
            if (totalExpensesEl) totalExpensesEl.textContent = formatCurrency(result.totalExpenses);
            if (classicTotalExpensesEl) classicTotalExpensesEl.textContent = formatCurrency(result.totalExpenses);
            if (remainingAllowanceEl) remainingAllowanceEl.textContent = formatCurrency(result.remainingAllowance);
            
            const saveLoseLabel = document.getElementById('db-save-lose-label');
            const streakBadge = document.getElementById('db-streak-badge');
            
            if (saveLoseLabel) {
                saveLoseLabel.textContent = result.saveLosePercentage >= 0 ? 'Save' : 'Lose';
            }
            
            if (streakBadge) {
                if (AppState.currentStreak > 0) {
                    streakBadge.textContent = `🔥 ${AppState.currentStreak} Day Streak!`;
                    streakBadge.style.display = 'inline';
                } else {
                    streakBadge.style.display = 'none';
                }
            }
            
            const percentageEl = document.getElementById('db-save-lose-percentage');
            if (percentageEl) percentageEl.textContent = Math.abs(result.saveLosePercentage).toFixed(2) + '%';

            const badge = document.getElementById('db-badge');
            const warning = document.getElementById('db-warning');
            const insight = document.getElementById('db-insight');

            if (badge && warning && insight) {
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
            }

            // Sync Live Master Sheet Plaintext Report
            const liveCanvas = document.getElementById('live-canvas-text');
            if (liveCanvas) {
                let report = `=== SMARTDAYBUDGET.COM REPORT ===\n`;
                report += `[INCOME LOG]\n`;
                AppState.incomes.forEach(item => {
                    if (item.name || item.amount) {
                        report += `- ${item.name || 'Unnamed'}: ${parseFloat(item.amount) || 0} Taka [Income]\n`;
                    }
                });
                report += `TOTAL INFLOW: ${totalIncome} Taka\n\n`;

                report += `[EXPENSE LOG]\n`;
                AppState.expenses.forEach(item => {
                    if (item.name || item.amount) {
                        report += `- ${item.name || 'Unnamed'}: ${parseFloat(item.amount) || 0} Taka [Expense]\n`;
                    }
                });
                report += `TOTAL OUTFLOW: ${totalExpenses} Taka\n\n`;

                const savingsCommitment = parseFloat(amountInput.value) || 0;
                report += `[SAVINGS TARGET]\n`;
                report += `- Fixed Savings Commitment: ${savingsCommitment} Taka\n\n`;

                const totalCommitment = totalExpenses + savingsCommitment;
                report += `=== CALCULATED TRACKING ===\n`;
                report += `- Total Commitment: ${totalCommitment} Taka\n\n`;

                // Robust Number Parsing & High-efficiency string-based sign check guardrail
                const netIncome = totalIncome - totalExpenses;
                const remainingAllowance = result.remainingAllowance;
                const netIncomeStr = String(netIncome);
                const allowanceStrValue = String(remainingAllowance);

                let statusZone = "";

                // Emergency String-Based Guardrail: Check for negative sign '-' in string representations
                if (netIncomeStr.includes('-')) {
                    statusZone = "Budget Deficit 🚨\nAction Item: Reduce high-outflow core operational expenses immediately to prevent debt accumulation!";
                } else if (allowanceStrValue.includes('-')) {
                    statusZone = "Savings Shortfall ⚠\nGuidance: Review and trim discretionary expenses to successfully cover your fixed savings goal.";
                } else {
                    // Reversed Fallback Logic: Optimized ✓ is NEVER the default fallback string.
                    // Explicitly check for safe, positive balance first.
                    if (remainingAllowance >= 0 && netIncome >= 0) {
                        statusZone = "Optimized ✓";
                    } else if (netIncome < 0) {
                        statusZone = "Budget Deficit 🚨\nAction Item: Reduce high-outflow core operational expenses immediately to prevent debt accumulation!";
                    } else {
                        // Routing NaN/corrupted/deficit states to default warning/deficit blocks
                        statusZone = "Savings Shortfall ⚠\nGuidance: Review and trim discretionary expenses to successfully cover your fixed savings goal.";
                    }
                }

                let allowanceStr = "";
                try {
                    allowanceStr = Number(result.remainingAllowance).toFixed(2);
                } catch (e) {
                    allowanceStr = String(result.remainingAllowance);
                }

                report += `=== FINAL SUMMARY ===\n`;
                report += `Remaining Allowance (RA): ${allowanceStr} Taka\n`;
                report += `Status: ${statusZone}`;
                liveCanvas.textContent = report;
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
        if (!el) return; // Defensive guard
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
        const principalEl = document.getElementById('ci-principal');
        const pmtEl = document.getElementById('ci-pmt');
        const rateEl = document.getElementById('ci-rate');
        const timeEl = document.getElementById('ci-time');
        const compoundEl = document.getElementById('ci-compound');

        if (!principalEl || !pmtEl || !rateEl || !timeEl || !compoundEl) return;

        const P = parseFloat(principalEl.value) || 0;
        const PMT = parseFloat(pmtEl.value) || 0;
        const r = parseFloat(rateEl.value) || 0;
        const t = parseFloat(timeEl.value) || 0;
        const n = parseInt(compoundEl.value) || 12;
        
        const { FV, interest, totalContributions } = FinanceMath.calculateCompoundInterest(P, PMT, r, t, n);
        
        requestAnimationFrame(() => {
            const fvEl = document.getElementById('ci-fv');
            const interestEl = document.getElementById('ci-interest');
            const insight = document.getElementById('ci-insight');

            if (fvEl) fvEl.textContent = formatCurrency(FV);
            if (interestEl) interestEl.textContent = formatCurrency(interest);
            
            if (insight) {
                if (P === 0 && PMT === 0) {
                    insight.textContent = "Watch your money grow through the power of compounding.";
                } else {
                    const interestPercentage = totalContributions > 0 ? (interest / FV) * 100 : 0;
                    insight.textContent = `In ${t} years, your total balance will be ${formatCurrency(FV)}. ${interestPercentage.toFixed(1)}% of this final amount is pure interest earned!`;
                }
            }

            // Sync Live Master Sheet
            const liveCanvas = document.getElementById('live-canvas-text');
            if (liveCanvas) {
                let report = `=== SMARTDAYBUDGET.COM REPORT ===\n`;
                report += `[INVESTMENT PARAMETERS]\n`;
                report += `- Initial Principal Deposit: ${P} Taka\n`;
                report += `- Monthly Contribution: ${PMT} Taka\n`;
                report += `- Annual Interest Rate (ROI): ${r}%\n\n`;

                const freqText = n === 12 ? 'Monthly' : (n === 1 ? 'Annually' : (n === 4 ? 'Quarterly' : 'Daily'));
                report += `[TIMELINE PARAMETERS]\n`;
                report += `- Compounding Frequency: ${freqText}\n`;
                report += `- Investment Duration: ${t} Years\n\n`;

                report += `=== CALCULATED TRACKING ===\n`;
                report += `- Total Principal Invested: ${totalContributions.toFixed(2)} Taka\n`;
                report += `- Total Compound Interest Accumulated: ${interest.toFixed(2)} Taka\n\n`;

                report += `=== FINAL SUMMARY ===\n`;
                report += `Total Estimated Future Balance: ${FV.toFixed(2)} Taka`;
                liveCanvas.textContent = report;
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
        const amountEl = document.getElementById('la-amount');
        const rateEl = document.getElementById('la-rate');
        const termEl = document.getElementById('la-term');

        if (!amountEl || !rateEl || !termEl) return;

        const L = parseFloat(amountEl.value) || 0;
        const i = parseFloat(rateEl.value) || 0;
        const n = parseFloat(termEl.value) || 0;
        
        const { M, totalInterest, totalCost } = FinanceMath.calculateLoanAmortization(L, i, n);
        
        requestAnimationFrame(() => {
            const paymentEl = document.getElementById('la-payment');
            const interestEl = document.getElementById('la-interest');
            const totalEl = document.getElementById('la-total');
            const insight = document.getElementById('la-insight');

            if (paymentEl) paymentEl.textContent = formatCurrency(M);
            if (interestEl) interestEl.textContent = formatCurrency(totalInterest);
            if (totalEl) totalEl.textContent = formatCurrency(totalCost);
            
            if (insight) {
                if (L === 0) {
                    insight.textContent = "Know exactly how much your loan will cost you over time.";
                } else {
                    insight.textContent = `You will pay ${formatCurrency(M)} monthly for ${n} months. The interest adds an extra ${((totalInterest/L)*100 || 0).toFixed(1)}% to your original loan amount.`;
                }
            }

            // Sync Live Master Sheet
            const liveCanvas = document.getElementById('live-canvas-text');
            if (liveCanvas) {
                let report = `=== SMARTDAYBUDGET.COM REPORT ===\n`;
                report += `[LOAN DETAILS]\n`;
                report += `- Total Principal Debt: ${L} Taka\n`;
                report += `- Annual Interest Rate: ${i}%\n`;
                report += `- Target Monthly Payment: ${M.toFixed(2)} Taka\n\n`;

                report += `[TIMELINE PARAMETERS]\n`;
                report += `- Estimated Amortization Term: ${n} Months\n\n`;

                report += `=== CALCULATED TRACKING ===\n`;
                report += `- Principal Paid Off: ${L} Taka\n`;
                report += `- Total Interest Payable: ${totalInterest.toFixed(2)} Taka\n\n`;

                report += `=== FINAL SUMMARY ===\n`;
                report += `Total Cost of Loan Clearance: ${totalCost.toFixed(2)} Taka\n`;
                report += `Status: Debt-Free Plan Generated ✓`;
                liveCanvas.textContent = report;
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
        const balanceEl = document.getElementById('cc-balance');
        const aprEl = document.getElementById('cc-apr');
        const paymentEl = document.getElementById('cc-payment');

        if (!balanceEl || !aprEl || !paymentEl) return;

        const B = parseFloat(balanceEl.value) || 0;
        const APR = parseFloat(aprEl.value) || 0;
        const p = parseFloat(paymentEl.value) || 0;
        
        requestAnimationFrame(() => {
            const warning = document.getElementById('cc-warning');
            const insight = document.getElementById('cc-insight');
            const monthsEl = document.getElementById('cc-months');
            const interestEl = document.getElementById('cc-interest');

            if (B === 0 || p === 0) {
                if (monthsEl) monthsEl.textContent = '0';
                if (interestEl) interestEl.textContent = '$0.00';
                if (warning) warning.style.display = 'none';
                if (insight) insight.textContent = "Plan your path to becoming debt-free.";
                return;
            }
            
            const result = FinanceMath.calculateCreditCardDebt(B, APR, p);
            
            if (result.error) {
                if (warning) {
                    warning.style.display = 'block';
                    warning.textContent = result.message;
                }
                if (monthsEl) monthsEl.textContent = '∞';
                if (interestEl) interestEl.textContent = '∞';
                if (insight) insight.textContent = "Please increase your monthly payment to outpace the interest charges.";
            } else {
                if (warning) warning.style.display = 'none';
                if (monthsEl) monthsEl.textContent = result.months;
                if (interestEl) interestEl.textContent = formatCurrency(result.totalInterest);
                
                if (insight) {
                    const years = (result.months / 12).toFixed(1);
                    let text = `At this rate, you will be debt-free in ${result.months} months (about ${years} years), paying ${formatCurrency(result.totalInterest)} in interest.`;
                    if (result.finalMonthPayment < p) {
                        text += ` Note: For your final month, only ${formatCurrency(result.finalMonthPayment)} is actually required to completely clear the debt.`;
                    }
                    insight.textContent = text;
                }
            }

            // Simulate minimum payment interest for savings output
            let minPayInterest = 0;
            if (B > 0 && APR > 0) {
                let tempBalance = B;
                const mRate = APR / 100 / 12;
                let mCount = 0;
                while (tempBalance > 0.01 && mCount < 600) {
                    const interest = tempBalance * mRate;
                    minPayInterest += interest;
                    const minPay = Math.max(15, tempBalance * 0.02 + interest);
                    if (minPay >= tempBalance + interest) {
                        tempBalance = 0;
                    } else {
                        tempBalance = tempBalance + interest - minPay;
                    }
                    mCount++;
                }
            }
            const savings = Math.max(0, minPayInterest - (result.totalInterest || 0));

            // Sync Live Master Sheet
            const liveCanvas = document.getElementById('live-canvas-text');
            if (liveCanvas) {
                let report = `=== SMARTDAYBUDGET.COM REPORT ===\n`;
                report += `[CREDIT CARD PARAMETERS]\n`;
                report += `- Current Card Balance: ${B} Taka\n`;
                report += `- Annual Percentage Rate (APR): ${APR}%\n`;
                report += `- Target Custom Monthly Payment: ${p} Taka\n\n`;

                const monthsVal = result.error ? '∞' : result.months;
                const getDebtFreeDateLocal = (months) => {
                    if (!months || months <= 0 || months === Infinity) return '—';
                    const date = new Date();
                    date.setMonth(date.getMonth() + Math.ceil(months));
                    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                };
                const dfDateVal = result.error ? '—' : getDebtFreeDateLocal(result.months);

                report += `[TIMELINE PARAMETERS]\n`;
                report += `- Time Required to Pay Off: ${monthsVal} Months\n`;
                report += `- Target Debt-Free Date: ${dfDateVal}\n\n`;

                const savingsText = result.error ? '0.00' : savings.toFixed(2);
                const interestText = result.error ? '∞' : result.totalInterest.toFixed(2);
                report += `=== CALCULATED TRACKING ===\n`;
                report += `- Minimum Payment Avoidance Savings: ${savingsText} Taka\n`;
                report += `- Total Interest Charges Accumulated: ${interestText} Taka\n\n`;

                const ccTotal = result.error ? '∞' : (B + result.totalInterest).toFixed(2);
                const finalPayVal = result.error ? '∞' : (result.finalMonthPayment || p).toFixed(2);
                report += `=== FINAL SUMMARY ===\n`;
                report += `Total Lifetime Cost of Card Debt: ${ccTotal} Taka\n`;
                report += `- Required Final Month Payment: ${finalPayVal} Taka\n`;
                report += `Status: Accelerated Payoff Plan Active ✓`;
                liveCanvas.textContent = report;
            }
        });
    };
    
    bindCalculatorInputs(inputs, updateCreditCardDebt);
    updateCreditCardDebt();
};

// --- E. Savings Goal ---
const initSavingsGoal = () => {
    const inputs = ['sg-name', 'sg-goal', 'sg-current', 'sg-time', 'sg-time-unit'];
    const updateSavingsGoal = () => {
        const goalEl = document.getElementById('sg-goal');
        const currentEl = document.getElementById('sg-current');
        const timeEl = document.getElementById('sg-time');
        const unitEl = document.getElementById('sg-time-unit');
        const goalNameEl = document.getElementById('sg-name');

        if (!goalEl || !currentEl || !timeEl || !unitEl) return;

        const G = parseFloat(goalEl.value) || 0;
        const S = parseFloat(currentEl.value) || 0;
        const T = parseFloat(timeEl.value) || 0;
        const unit = unitEl.value || 'months';

        let goalName = goalNameEl ? goalNameEl.value.trim() : 'Savings Goal';
        let isInvalidName = /^\d+$/.test(goalName);
        if (isInvalidName) {
            if (goalNameEl) goalNameEl.style.borderColor = 'var(--soft-crimson)';
            goalName = 'Savings Goal (Name cannot be purely numeric)';
        } else {
            if (goalNameEl) goalNameEl.style.borderColor = '';
        }
        
        const { monthlyDeposit } = FinanceMath.calculateSavingsGoal(G, S, T, unit);
        const finalDeposit = S >= G ? 0 : monthlyDeposit;
        
        requestAnimationFrame(() => {
            const depositEl = document.getElementById('sg-deposit');
            const insight = document.getElementById('sg-insight');

            if (depositEl) depositEl.textContent = formatCurrency(finalDeposit);
            
            if (insight) {
                if (G === 0 || T === 0) {
                    insight.textContent = "Set your goal and figure out exactly what it takes to reach it.";
                } else if (S >= G) {
                    insight.textContent = "Goal Achieved! 🎉 Congratulations! You have already reached or exceeded your savings goal.";
                } else {
                    insight.textContent = `To reach your goal of ${formatCurrency(G)} in ${T} ${unit}, you need to save ${formatCurrency(finalDeposit)} each month.`;
                }
            }

            // Sync Live Master Sheet
            const liveCanvas = document.getElementById('live-canvas-text');
            if (liveCanvas) {
                let report = `=== SMARTDAYBUDGET.COM REPORT ===\n`;
                report += `[SAVINGS TARGET]\n`;
                report += `- Overall Financial Goal Name: ${goalName}\n`;
                report += `- Total Target Amount: ${G} Taka\n`;
                report += `- Current Saved Progress: ${S} Taka\n\n`;

                let monthsText = T;
                if (unit === 'days') monthsText = (T / 30.417);
                else if (unit === 'weeks') monthsText = (T / 4.345);
                else if (unit === 'years') monthsText = (T * 12);

                report += `[TIMELINE PARAMETERS]\n`;
                report += `- Desired Timeframe: ${parseFloat(monthsText).toFixed(1)} Months\n\n`;

                const remainingNeeded = S >= G ? 0.00 : Math.max(0, G - S);
                report += `=== CALCULATED TRACKING ===\n`;
                report += `- Total Remaining Balance Needed: ${remainingNeeded.toFixed(2)} Taka\n\n`;

                const monthlyRateVal = (S >= G || monthsText <= 0) ? 0.00 : (Math.max(0, G - S) / monthsText);
                const progressPercent = G > 0 ? Math.min(100, (S / G) * 100).toFixed(1) : '0.0';
                report += `=== FINAL SUMMARY ===\n`;
                report += `Required Monthly Savings Rate: ${monthlyRateVal.toFixed(2)} Taka / Month\n`;
                if (S >= G && G > 0) {
                    report += `Status: Goal Fully Funded! 🎉\n`;
                    report += `Action Note: You have already met this target. Redirect surplus cash flow to your next financial goal!`;
                } else {
                    report += `Status: ${progressPercent}% Completed\n`;
                    report += `Action Note: Maintain your savings rate of ${monthlyRateVal.toFixed(2)} Taka / Month to hit your timeframe on schedule.`;
                }
                liveCanvas.textContent = report;
            }
        });
    };
    
    bindCalculatorInputs(inputs, updateSavingsGoal);
    updateSavingsGoal();
};

// --- Suggestion Pills Handler ---
const initSuggestionPills = () => {
    document.addEventListener('click', (e) => {
        const pill = e.target.closest('.suggestion-pill');
        if (pill && pill.dataset.targetInput) {
            const inputId = pill.dataset.targetInput;
            const value = pill.dataset.value;
            const input = document.getElementById(inputId);
            if (input) {
                input.value = value;
                // Dispatch input and change events so the active calculator reacts immediately
                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
    });
};

// --- UX Fix: Prevent mouse wheel from changing number inputs ---
const initNumberInputScrollFix = () => {
    document.addEventListener('wheel', () => {
        if (document.activeElement && document.activeElement.type === 'number') {
            document.activeElement.blur();
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
    initSuggestionPills();
    initNumberInputScrollFix();
});