// --- CENTRALIZED CASH FLOW STATE & LOCAL STORAGE ---
const AppState = {
    statements: {
        cashFlow: {
            initialCash: '10000',
            entries: [
                { id: Date.now(), name: 'Client Invoice', amount: '25000', type: 1, category: 'operating' },
                { id: Date.now() + 1, name: 'Office Rent', amount: '5000', type: -1, category: 'operating' }
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
            if (!AppState.statements.cashFlow) {
                AppState.statements.cashFlow = {
                    initialCash: '10000',
                    entries: [
                        { id: Date.now(), name: 'Client Invoice', amount: '25000', type: 1, category: 'operating' },
                        { id: Date.now() + 1, name: 'Office Rent', amount: '5000', type: -1, category: 'operating' }
                    ]
                };
            }
            if (!AppState.statements.cashFlow.entries) AppState.statements.cashFlow.entries = [];
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
const initCashFlow = () => {
    initializeState();

    const container = document.getElementById('cf-entries-container');
    const addBtn = document.getElementById('add-cf-entry-btn');
    const initialCashInput = document.getElementById('cf-initial-cash');

    if (!container || !addBtn || !initialCashInput) {
        console.warn('Cash Flow containers not found.');
        return;
    }

    initialCashInput.value = AppState.statements.cashFlow.initialCash || '';
    initialCashInput.addEventListener('input', () => {
        AppState.statements.cashFlow.initialCash = initialCashInput.value;
        saveState();
        calculateAll();
    });

    const renderList = () => {
        container.innerHTML = '';
        AppState.statements.cashFlow.entries.forEach(item => {
            const row = document.createElement('div');
            row.className = 'expense-row cf-row-layout';
            
            // Dynamically manage suggestion pills visibility (hidden for non-empty saved rows, visible on focus or empty)
            const showPills = item.name === '';
            
            row.innerHTML = `
                <div class="cf-row-inputs">
                    <input type="text" class="item-name" placeholder="Transaction (e.g. Sales)" value="${item.name}" data-id="${item.id}" required>
                    <input type="text" class="item-amount math-input" placeholder="0.00" value="${item.amount}" data-id="${item.id}" required>
                    <button class="btn-remove" data-id="${item.id}" aria-label="Remove">×</button>
                </div>
                
                <div class="cf-routing-box">
                    <div class="cf-routing-question">
                        <span>1. Inflow or Outflow?</span>
                        <div class="segmented-control mini-segmented">
                            <button class="segment segment-inflow ${item.type === 1 ? 'active' : ''}" data-id="${item.id}" data-val="1">Inflow (+)</button>
                            <button class="segment segment-outflow ${item.type === -1 ? 'active' : ''}" data-id="${item.id}" data-val="-1">Outflow (-)</button>
                        </div>
                    </div>
                    <div class="cf-routing-question">
                        <span>2. Cash used for:</span>
                        <div class="segmented-control mini-segmented tri-segmented">
                            <button class="segment cf-activity-btn ${item.category === 'operating' ? 'active' : ''}" data-id="${item.id}" data-cat="operating">Operating (Ops, Bills)</button>
                            <button class="segment cf-activity-btn ${item.category === 'investing' ? 'active' : ''}" data-id="${item.id}" data-cat="investing">Investing (Asset/Property)</button>
                            <button class="segment cf-activity-btn ${item.category === 'financing' ? 'active' : ''}" data-id="${item.id}" data-cat="financing">Financing (Loans, Equity)</button>
                        </div>
                    </div>
                </div>
                
                <div class="suggestion-pills-box" style="display: ${showPills ? 'flex' : 'none'};">
                    <span class="suggestion-pill" data-id="${item.id}" data-name="Client Invoice" data-type="1" data-cat="operating">Client Invoice</span>
                    <span class="suggestion-pill" data-id="${item.id}" data-name="Supplier Bill" data-type="-1" data-cat="operating">Supplier Bill</span>
                    <span class="suggestion-pill" data-id="${item.id}" data-name="Office Equipment" data-type="-1" data-cat="investing">Office Equipment</span>
                    <span class="suggestion-pill" data-id="${item.id}" data-name="Bank Loan Received" data-type="1" data-cat="financing">Bank Loan Received</span>
                    <span class="suggestion-pill" data-id="${item.id}" data-name="Owner Draw" data-type="-1" data-cat="financing">Owner Draw</span>
                </div>
            `;
            container.appendChild(row);

            // Bind focus events on the item-name input to display/hide pills box
            const nameInput = row.querySelector('.item-name');
            const pillsBox = row.querySelector('.suggestion-pills-box');
            if (nameInput && pillsBox) {
                nameInput.addEventListener('focus', () => {
                    pillsBox.style.display = 'flex';
                });
                nameInput.addEventListener('blur', () => {
                    setTimeout(() => {
                        if (item.name !== '') {
                            pillsBox.style.display = 'none';
                        }
                    }, 200);
                });
            }
        });
    };

    container.addEventListener('input', (e) => {
        if (e.target.tagName.toLowerCase() === 'input') {
            const id = parseInt(e.target.dataset.id);
            const entry = AppState.statements.cashFlow.entries.find(x => x.id === id);
            if (entry) {
                if (e.target.classList.contains('item-name')) {
                    entry.name = e.target.value;
                } else if (e.target.classList.contains('item-amount')) {
                    entry.amount = e.target.value;
                }
                saveState();
                calculateAll();
            }
        }
    });

    container.addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('btn-remove')) {
            const id = parseInt(target.dataset.id);
            AppState.statements.cashFlow.entries = AppState.statements.cashFlow.entries.filter(x => x.id !== id);
            saveState();
            renderList();
            calculateAll();
        } else if (target.classList.contains('segment-inflow') || target.classList.contains('segment-outflow')) {
            const id = parseInt(target.dataset.id);
            const val = parseInt(target.dataset.val);
            const entry = AppState.statements.cashFlow.entries.find(x => x.id === id);
            if (entry) {
                entry.type = val;
                saveState();
                renderList();
                calculateAll();
            }
        } else if (target.classList.contains('cf-activity-btn')) {
            const id = parseInt(target.dataset.id);
            const cat = target.dataset.cat;
            const entry = AppState.statements.cashFlow.entries.find(x => x.id === id);
            if (entry) {
                entry.category = cat;
                saveState();
                renderList();
                calculateAll();
            }
        } else if (target.classList.contains('suggestion-pill')) {
            const id = parseInt(target.dataset.id);
            const name = target.dataset.name;
            const type = parseInt(target.dataset.type);
            const cat = target.dataset.cat;
            const entry = AppState.statements.cashFlow.entries.find(x => x.id === id);
            if (entry) {
                entry.name = name;
                entry.type = type;
                entry.category = cat;
                saveState();
                renderList();
                calculateAll();
            }
        }
    });

    addBtn.addEventListener('click', () => {
        AppState.statements.cashFlow.entries.push({ id: Date.now(), name: '', amount: '', type: 1, category: 'operating' });
        saveState();
        renderList();
    });

    const calculateAll = () => {
        const cfInitial = parseFloat(AppState.statements.cashFlow.initialCash) || 0;
        const cfEntries = AppState.statements.cashFlow.entries;

        let totalOps = 0;
        let totalInv = 0;
        let totalFin = 0;

        cfEntries.forEach(entry => {
            const amt = (parseFloat(entry.amount) || 0) * entry.type;
            if (entry.category === 'operating') totalOps += amt;
            else if (entry.category === 'investing') totalInv += amt;
            else if (entry.category === 'financing') totalFin += amt;
        });

        const netCF = totalOps + totalInv + totalFin;
        const endingCF = cfInitial + netCF;

        const cfOpsTotalEl = document.getElementById('cf-ops-total');
        const cfInvTotalEl = document.getElementById('cf-inv-total');
        const cfFinTotalEl = document.getElementById('cf-fin-total');
        const cfNetChangeEl = document.getElementById('cf-net-change');
        const endingCashEl = document.getElementById('cf-ending-cash');

        if (cfOpsTotalEl) cfOpsTotalEl.textContent = formatCurrency(totalOps);
        if (cfInvTotalEl) cfInvTotalEl.textContent = formatCurrency(totalInv);
        if (cfFinTotalEl) cfFinTotalEl.textContent = formatCurrency(totalFin);
        if (cfNetChangeEl) cfNetChangeEl.textContent = formatCurrency(netCF);
        
        if (endingCashEl) {
            endingCashEl.textContent = formatCurrency(endingCF);
            if (endingCF >= cfInitial) {
                endingCashEl.className = 'positive';
            } else {
                endingCashEl.className = 'negative';
            }
        }

        // Live Master Sheet plain-text report sync
        const liveCanvas = document.getElementById('live-canvas-text');
        if (liveCanvas) {
            let report = `=== SMARTDAYBUDGET.COM REPORT ===\n`;
            
            report += `[BEGINNING CASH BALANCE]\n`;
            report += `- Beginning Cash Balance: ${cfInitial} Taka\n\n`;
            
            report += `[OPERATING ACTIVITIES]\n`;
            cfEntries.filter(x => x.category === 'operating').forEach(item => {
                if (item.name || item.amount) {
                    const sign = item.type === 1 ? '+' : '-';
                    report += `- ${item.name || 'Unnamed'}: ${sign}${parseFloat(item.amount) || 0} Taka\n`;
                }
            });
            report += `NET CASH FROM OPERATING: ${totalOps} Taka\n\n`;

            report += `[INVESTING ACTIVITIES]\n`;
            cfEntries.filter(x => x.category === 'investing').forEach(item => {
                if (item.name || item.amount) {
                    const sign = item.type === 1 ? '+' : '-';
                    report += `- ${item.name || 'Unnamed'}: ${sign}${parseFloat(item.amount) || 0} Taka\n`;
                }
            });
            report += `NET CASH FROM INVESTING: ${totalInv} Taka\n\n`;

            report += `[FINANCING ACTIVITIES]\n`;
            cfEntries.filter(x => x.category === 'financing').forEach(item => {
                if (item.name || item.amount) {
                    const sign = item.type === 1 ? '+' : '-';
                    report += `- ${item.name || 'Unnamed'}: ${sign}${parseFloat(item.amount) || 0} Taka\n`;
                }
            });
            report += `NET CASH FROM FINANCING: ${totalFin} Taka\n\n`;

            report += `=== CALCULATED TRACKING ===\n`;
            report += `- Net Absolute Cash Increase/Decrease: ${netCF} Taka\n\n`;

            report += `=== FINAL SUMMARY ===\n`;
            report += `- Beginning Cash Balance: ${cfInitial} Taka\n`;
            report += `- Net Absolute Cash Increase/Decrease: ${netCF} Taka\n`;
            report += `Reconciled Ending Cash Balance: ${endingCF} Taka`;
            liveCanvas.textContent = report;
        }
    };

    renderList();
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
    initCashFlow();

    document.addEventListener('wheel', () => {
        if (document.activeElement.type === 'number') {
            document.activeElement.blur();
        }
    });
});

