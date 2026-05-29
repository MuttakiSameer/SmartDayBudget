// --- CENTRALIZED INCOME STATEMENT STATE & LOCAL STORAGE ---
const AppState = {
    statements: {
        incomeStatement: {
            revenues: [
                { id: Date.now(), name: 'Product Sales', amount: '85000' }
            ],
            expenses: [
                { id: Date.now() + 1, name: 'Rent', amount: '15000' },
                { id: Date.now() + 2, name: 'Utilities', amount: '3500' }
            ]
        }
    }
};

// Sync State with LocalStorage
const saveState = () => {
    try {
        localStorage.setItem('SmartDayBudget_MasterState', JSON.stringify(AppState));
    } catch (e) {
        console.error('LocalStorage save error:', e);
    }
};

// Initialize App State from LocalStorage
const initializeState = () => {
    const stored = localStorage.getItem('SmartDayBudget_MasterState');
    if (stored) {
        try {
            const parsed = JSON.parse(stored);
            // Defensively merge the entire parsed state so other calculators are preserved
            Object.assign(AppState, parsed);
            
            // Defensively ensure structure exists with arrays
            if (!AppState.statements) {
                AppState.statements = {};
            }
            if (!AppState.statements.incomeStatement) {
                AppState.statements.incomeStatement = {
                    revenues: [
                        { id: Date.now(), name: 'Product Sales', amount: '85000' }
                    ],
                    expenses: [
                        { id: Date.now() + 1, name: 'Rent', amount: '15000' },
                        { id: Date.now() + 2, name: 'Utilities', amount: '3500' }
                    ]
                };
            }
            if (!AppState.statements.incomeStatement.revenues) AppState.statements.incomeStatement.revenues = [];
            if (!AppState.statements.incomeStatement.expenses) AppState.statements.incomeStatement.expenses = [];
        } catch (e) {
            console.error('LocalStorage parse error:', e);
        }
    } else {
        saveState();
    }
};

// Format Currency Utility
const formatCurrency = (num) => {
    const currencyCode = typeof currentCurrency !== 'undefined' ? currentCurrency : 'BDT';
    const formatted = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
    
    // Explicitly handle local Taka representations to maintain complete consistency
    if (currencyCode === 'BDT' || currencyCode === 'USD') {
        return `${formatted} Taka`;
    }
    
    const symbol = typeof currencies !== 'undefined' && currencies[currencyCode] ? currencies[currencyCode].symbol : '';
    return `${formatted} ${symbol || 'Taka'}`;
};

// --- DYNAMIC DOM RENDERING & LIFECYCLE MANAGEMENT ---
const initIncomeStatement = () => {
    initializeState();

    const revenuesContainer = document.getElementById('is-revenues-container');
    const expensesContainer = document.getElementById('is-expenses-container');

    const addRevenueBtn = document.getElementById('add-is-revenue-btn');
    const addExpenseBtn = document.getElementById('add-is-expense-btn');

    if (!revenuesContainer || !expensesContainer) {
        console.warn('Income Statement containers not found.');
        return;
    }

    const renderList = (category) => {
        let container, items, placeholders, suggestionBadges;
        
        if (category === 'revenues') {
            container = revenuesContainer;
            items = AppState.statements.incomeStatement.revenues;
            placeholders = { name: 'Revenue (e.g. Sales)' };
            suggestionBadges = ['Product Sales', 'Service Revenue', 'Freelance Income', 'Investment Income'];
        } else if (category === 'expenses') {
            container = expensesContainer;
            items = AppState.statements.incomeStatement.expenses;
            placeholders = { name: 'Expense (e.g. Rent)' };
            suggestionBadges = ['Rent', 'Salaries', 'Utilities', 'Software SaaS', 'Marketing', 'Supplies'];
        }

        if (!container) return;

        container.innerHTML = '';
        items.forEach(item => {
            const row = document.createElement('div');
            row.className = 'expense-row';
            row.innerHTML = `
                <input type="text" class="item-name" placeholder="${placeholders.name}" value="${item.name}" data-id="${item.id}" required>
                <input type="text" class="item-amount math-input" placeholder="0.00" value="${item.amount}" data-id="${item.id}" required>
                <button class="btn-remove" data-id="${item.id}" aria-label="Remove">×</button>
            `;

            if (suggestionBadges && suggestionBadges.length > 0) {
                const pillBox = document.createElement('div');
                pillBox.className = 'suggestion-pills-box';
                
                // Hide pills for static saved rows by default, show for new/empty rows
                if (item.name !== '') {
                    pillBox.style.display = 'none';
                } else {
                    pillBox.style.display = 'flex';
                }

                suggestionBadges.forEach(badge => {
                    const pill = document.createElement('span');
                    pill.className = 'suggestion-pill';
                    pill.textContent = badge;
                    pill.addEventListener('click', () => {
                        item.name = badge;
                        saveState();
                        renderList(category);
                        calculateAll();
                    });
                    pillBox.appendChild(pill);
                });
                row.appendChild(pillBox);

                // Show suggestion pills when the name input gets focused
                const nameInput = row.querySelector('.item-name');
                if (nameInput) {
                    nameInput.addEventListener('focus', () => {
                        pillBox.style.display = 'flex';
                    });
                    nameInput.addEventListener('blur', () => {
                        // Delay slightly so click events on suggestion pills can fire before hiding
                        setTimeout(() => {
                            if (item.name !== '') {
                                pillBox.style.display = 'none';
                            }
                        }, 200);
                    });
                }
            }

            container.appendChild(row);
        });
    };

    const handleContainerInput = (e, category) => {
        const target = e.target;
        if (target.tagName.toLowerCase() === 'input') {
            const id = parseInt(target.dataset.id);
            const items = AppState.statements.incomeStatement[category];
            const entry = items.find(x => x.id === id);

            if (entry) {
                if (target.classList.contains('item-name')) {
                    entry.name = target.value;
                } else if (target.classList.contains('item-amount')) {
                    entry.amount = target.value;
                }
                saveState();
                calculateAll();
            }
        }
    };

    const handleContainerClick = (e, category) => {
        const target = e.target;
        if (target.classList.contains('btn-remove')) {
            const id = parseInt(target.dataset.id);
            AppState.statements.incomeStatement[category] = AppState.statements.incomeStatement[category].filter(x => x.id !== id);
            saveState();
            renderList(category);
            calculateAll();
        }
    };

    revenuesContainer.addEventListener('input', (e) => handleContainerInput(e, 'revenues'));
    revenuesContainer.addEventListener('click', (e) => handleContainerClick(e, 'revenues'));

    expensesContainer.addEventListener('input', (e) => handleContainerInput(e, 'expenses'));
    expensesContainer.addEventListener('click', (e) => handleContainerClick(e, 'expenses'));

    if (addRevenueBtn) {
        addRevenueBtn.addEventListener('click', () => {
            AppState.statements.incomeStatement.revenues.push({ id: Date.now(), name: '', amount: '' });
            saveState();
            renderList('revenues');
        });
    }

    if (addExpenseBtn) {
        addExpenseBtn.addEventListener('click', () => {
            AppState.statements.incomeStatement.expenses.push({ id: Date.now(), name: '', amount: '' });
            saveState();
            renderList('expenses');
        });
    }

    const calculateAll = () => {
        const revenues = AppState.statements.incomeStatement.revenues;
        const expenses = AppState.statements.incomeStatement.expenses;

        const totalRevenue = revenues.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        const totalExpenses = expenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        const netIncome = totalRevenue - totalExpenses;

        const totalRevenueEl = document.getElementById('is-total-revenue');
        const totalExpensesEl = document.getElementById('is-total-expenses');
        const netIncomeEl = document.getElementById('is-net-income');
        const isBadge = document.getElementById('is-badge');

        if (totalRevenueEl) totalRevenueEl.textContent = formatCurrency(totalRevenue);
        if (totalExpensesEl) totalExpensesEl.textContent = formatCurrency(totalExpenses);
        
        if (netIncomeEl) {
            netIncomeEl.textContent = formatCurrency(netIncome);
            if (netIncome >= 0) {
                netIncomeEl.className = 'positive';
                if (isBadge) {
                    isBadge.textContent = 'Net Profit';
                    isBadge.className = 'badge profit';
                }
            } else {
                netIncomeEl.className = 'negative';
                if (isBadge) {
                    isBadge.textContent = 'Net Loss';
                    isBadge.className = 'badge loss';
                }
            }
        }

        const margin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;

        // Live Master Sheet plain-text report sync
        const liveCanvas = document.getElementById('live-canvas-text');
        if (liveCanvas) {
            let report = `=== SMARTDAYBUDGET.COM REPORT ===\n`;
            report += `[REVENUE LOG]\n`;
            revenues.forEach(item => {
                if (item.name || item.amount) {
                    report += `- ${item.name || 'Unnamed'}: ${parseFloat(item.amount) || 0} Taka [Revenue]\n`;
                }
            });
            report += `TOTAL GROSS REVENUE: ${totalRevenue} Taka\n\n`;

            report += `[EXPENSES LOG]\n`;
            expenses.forEach(item => {
                if (item.name || item.amount) {
                    report += `- ${item.name || 'Unnamed'}: ${parseFloat(item.amount) || 0} Taka [Expense]\n`;
                }
            });
            report += `TOTAL OPERATING EXPENSES: ${totalExpenses} Taka\n\n`;

            report += `=== CALCULATED TRACKING ===\n`;
            report += `- Net Operating Profit Margin: ${margin.toFixed(2)}%\n\n`;

            report += `=== FINAL SUMMARY ===\n`;
            report += `Net Operating Profit (Income): ${netIncome} Taka\n`;
            report += `Status: ${netIncome >= 0 ? 'Profitable ✓' : 'Losing ❌'}`;
            liveCanvas.textContent = report;
        }
    };

    renderList('revenues');
    renderList('expenses');
    calculateAll();

    // Hook currency selectors
    const currencySelector = document.getElementById('currency-selector');
    if (currencySelector) {
        currencySelector.addEventListener('change', () => {
            if (typeof setCurrency !== 'undefined') {
                setCurrency(currencySelector.value);
            }
            calculateAll();
        });
    }
    const currencySelectorMobile = document.getElementById('currency-selector-mobile');
    if (currencySelectorMobile) {
        currencySelectorMobile.addEventListener('change', () => {
            if (typeof setCurrency !== 'undefined') {
                setCurrency(currencySelectorMobile.value);
            }
            calculateAll();
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    initIncomeStatement();

    document.addEventListener('wheel', () => {
        if (document.activeElement.type === 'number') {
            document.activeElement.blur();
        }
    });
});

