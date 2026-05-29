// --- CENTRALIZED CHANGES IN EQUITY STATE & LOCAL STORAGE ---
const AppState = {
    statements: {
        incomeStatement: { revenues: [], expenses: [] },
        changesInEquity: {
            beginningEquity: '50000',
            newCapital: '10000',
            dividends: '2000'
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
            
            // Defensively ensure structure exists
            if (!AppState.statements) {
                AppState.statements = {};
            }
            if (!AppState.statements.changesInEquity) {
                AppState.statements.changesInEquity = {
                    beginningEquity: '50000',
                    newCapital: '10000',
                    dividends: '2000'
                };
            }
            if (!AppState.statements.incomeStatement) {
                AppState.statements.incomeStatement = {
                    revenues: [],
                    expenses: []
                };
            }
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

// --- DYNAMIC CHANGES IN EQUITY CALCULATOR ---
const initChangesInEquity = () => {
    initializeState();

    const beginningInput = document.getElementById('eq-beginning');
    const netIncomeInput = document.getElementById('eq-net-income');
    const newCapitalInput = document.getElementById('eq-new-capital');
    const dividendsInput = document.getElementById('eq-dividends');

    if (!beginningInput || !netIncomeInput || !newCapitalInput || !dividendsInput) {
        console.warn('Changes in Equity wizard elements not found.');
        return;
    }

    // Set initial values from state
    beginningInput.value = AppState.statements.changesInEquity.beginningEquity || '';
    newCapitalInput.value = AppState.statements.changesInEquity.newCapital || '';
    dividendsInput.value = AppState.statements.changesInEquity.dividends || '';

    // Calculate P&L Net Income dynamically from active state
    const calculateNetIncome = () => {
        const revenues = AppState.statements.incomeStatement.revenues || [];
        const expenses = AppState.statements.incomeStatement.expenses || [];
        const totalRevenue = revenues.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        const totalExpenses = expenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        return totalRevenue - totalExpenses;
    };

    const calculateAll = () => {
        const netIncomeVal = calculateNetIncome();
        netIncomeInput.value = netIncomeVal.toFixed(2);

        const beginningVal = parseFloat(beginningInput.value) || 0;
        const newCapitalVal = parseFloat(newCapitalInput.value) || 0;
        const dividendsVal = parseFloat(dividendsInput.value) || 0;

        const endingVal = beginningVal + netIncomeVal + newCapitalVal - dividendsVal;

        const endingEquityEl = document.getElementById('eq-ending-equity');
        if (endingEquityEl) {
            endingEquityEl.textContent = formatCurrency(endingVal);
            if (endingVal >= beginningVal) {
                endingEquityEl.className = 'positive';
            } else {
                endingEquityEl.className = 'negative';
            }
        }

        const netShift = netIncomeVal + newCapitalVal - dividendsVal;

        // Live Master Sheet plain-text report sync
        const liveCanvas = document.getElementById('live-canvas-text');
        if (liveCanvas) {
            let report = `=== SMARTDAYBUDGET.COM REPORT ===\n`;
            report += `[EQUITY STARTING BASE]\n`;
            report += `- Opening Retained Earnings Balance: ${beginningVal} Taka\n\n`;

            report += `[PERIODIC ADJUSTMENTS]\n`;
            const signNetIncome = netIncomeVal >= 0 ? '+' : '-';
            report += `- Net Profit Absorption (From Income Statement): ${signNetIncome}${Math.abs(netIncomeVal).toFixed(2)} Taka\n`;
            const signCapital = newCapitalVal >= 0 ? '+' : '-';
            report += `- Fresh Owner Capital Investments: ${signCapital}${Math.abs(newCapitalVal).toFixed(2)} Taka\n\n`;

            report += `[EQUITY DEDUCTIONS]\n`;
            report += `- Owner Personal Drawings / Dividends: -${dividendsVal.toFixed(2)} Taka\n\n`;

            report += `=== CALCULATED TRACKING ===\n`;
            report += `- Net Total Equity Movement: ${netShift.toFixed(2)} Taka\n\n`;

            report += `=== FINAL SUMMARY ===\n`;
            report += `Closing Owner Equity Balance: ${endingVal.toFixed(2)} Taka`;
            liveCanvas.textContent = report;
        }
    };

    // Input change listeners
    const handleInput = () => {
        AppState.statements.changesInEquity.beginningEquity = beginningInput.value;
        AppState.statements.changesInEquity.newCapital = newCapitalInput.value;
        AppState.statements.changesInEquity.dividends = dividendsInput.value;
        saveState();
        calculateAll();
    };

    beginningInput.addEventListener('input', handleInput);
    newCapitalInput.addEventListener('input', handleInput);
    dividendsInput.addEventListener('input', handleInput);

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
    initChangesInEquity();

    document.addEventListener('wheel', () => {
        if (document.activeElement.type === 'number') {
            document.activeElement.blur();
        }
    });
});
