// --- CENTRALIZED BALANCE SHEET STATE & LOCAL STORAGE ---
const AppState = {
    statements: {
        balanceSheet: {
            assets: [
                { id: Date.now(), name: 'Cash', amount: '50000' },
                { id: Date.now() + 1, name: 'Office Equipment', amount: '35000' }
            ],
            liabilities: [
                { id: Date.now() + 2, name: 'Bank Loan', amount: '20000' },
                { id: Date.now() + 3, name: 'Accounts Payable', amount: '5000' }
            ],
            equity: [
                { id: Date.now() + 4, name: 'Initial Capital', amount: '60000' }
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
            
            // Defensively ensure statements and balanceSheet structure exist with arrays
            if (!AppState.statements) {
                AppState.statements = {};
            }
            if (!AppState.statements.balanceSheet) {
                AppState.statements.balanceSheet = {
                    assets: [
                        { id: Date.now(), name: 'Cash', amount: '50000' },
                        { id: Date.now() + 1, name: 'Office Equipment', amount: '35000' }
                    ],
                    liabilities: [
                        { id: Date.now() + 2, name: 'Bank Loan', amount: '20000' },
                        { id: Date.now() + 3, name: 'Accounts Payable', amount: '5000' }
                    ],
                    equity: [
                        { id: Date.now() + 4, name: 'Initial Capital', amount: '60000' }
                    ]
                };
            }
            if (!AppState.statements.balanceSheet.assets) AppState.statements.balanceSheet.assets = [];
            if (!AppState.statements.balanceSheet.liabilities) AppState.statements.balanceSheet.liabilities = [];
            if (!AppState.statements.balanceSheet.equity) AppState.statements.balanceSheet.equity = [];
        } catch (e) {
            console.error('LocalStorage parse error:', e);
        }
    } else {
        saveState();
    }
};

// Format Currency Utility using upgrades.js current currency system
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
const initBalanceSheet = () => {
    initializeState();

    // DOM Elements Safeguards
    const assetsContainer = document.getElementById('bs-assets-container');
    const liabilitiesContainer = document.getElementById('bs-liabilities-container');
    const equityContainer = document.getElementById('bs-equity-container');

    const addAssetBtn = document.getElementById('add-bs-asset-btn');
    const addLiabilityBtn = document.getElementById('add-bs-liability-btn');
    const addEquityBtn = document.getElementById('add-bs-equity-btn');

    if (!assetsContainer || !liabilitiesContainer || !equityContainer) {
        console.warn('Balance Sheet containers not found on the active page.');
        return;
    }

    // Dynamic Lists Rendering (ONLY called on row insertion, removal, or page load)
    const renderList = (category) => {
        let container, items, placeholders, suggestionBadges;
        
        if (category === 'assets') {
            container = assetsContainer;
            items = AppState.statements.balanceSheet.assets;
            placeholders = { name: 'Asset (e.g. Cash)' };
            suggestionBadges = ['Cash', 'Bank Account', 'Equipment', 'Inventory', 'Accounts Receivable'];
        } else if (category === 'liabilities') {
            container = liabilitiesContainer;
            items = AppState.statements.balanceSheet.liabilities;
            placeholders = { name: 'Liability (e.g. Bank Loan)' };
            suggestionBadges = ['Bank Loan', 'Credit Card Debt', 'Accounts Payable', 'Taxes Owed'];
        } else if (category === 'equity') {
            container = equityContainer;
            items = AppState.statements.balanceSheet.equity;
            placeholders = { name: 'Equity (e.g. Capital)' };
            suggestionBadges = ['Initial Capital', 'Retained Earnings', 'Owner Investment'];
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

            // Suggestion pills below input line (selector leak fix)
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

    // --- EVENT DELEGATION FOR REAL-TIME INPUT HANDLERS ---
    // Defensively map inputs without rebuilding the DOM (completely prevents focus/cursor dropping)
    const handleContainerInput = (e, category) => {
        const target = e.target;
        if (target.tagName.toLowerCase() === 'input') {
            const id = parseInt(target.dataset.id);
            const items = AppState.statements.balanceSheet[category];
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

    // Delegation click listener for dynamic row deletion
    const handleContainerClick = (e, category) => {
        const target = e.target;
        if (target.classList.contains('btn-remove')) {
            const id = parseInt(target.dataset.id);
            AppState.statements.balanceSheet[category] = AppState.statements.balanceSheet[category].filter(x => x.id !== id);
            saveState();
            renderList(category);
            calculateAll();
        }
    };

    // Delegation focusout listener to enforce unique names on blur
    const handleContainerFocusOut = (e, category) => {
        const target = e.target;
        if (target.tagName.toLowerCase() === 'input' && target.classList.contains('item-name')) {
            const id = parseInt(target.dataset.id);
            const items = AppState.statements.balanceSheet[category];
            const entry = items.find(x => x.id === id);
            if (entry) {
                const enteredName = target.value.trim();
                if (enteredName) {
                    // Check duplicates in all items of this category (excluding ourselves)
                    let baseName = enteredName.replace(/\s+\d+$/, '').trim();
                    let occurrences = items.filter(x => x.id !== id && x.name.trim().toLowerCase().startsWith(baseName.toLowerCase()));
                    if (occurrences.length > 0) {
                        const nextNumber = occurrences.length + 1;
                        entry.name = `${baseName} ${nextNumber}`;
                        target.value = entry.name;
                    }
                }
                saveState();
                calculateAll();
            }
        }
    };

    // Bind event delegates for Assets
    assetsContainer.addEventListener('input', (e) => handleContainerInput(e, 'assets'));
    assetsContainer.addEventListener('click', (e) => handleContainerClick(e, 'assets'));
    assetsContainer.addEventListener('focusout', (e) => handleContainerFocusOut(e, 'assets'));

    // Bind event delegates for Liabilities
    liabilitiesContainer.addEventListener('input', (e) => handleContainerInput(e, 'liabilities'));
    liabilitiesContainer.addEventListener('click', (e) => handleContainerClick(e, 'liabilities'));
    liabilitiesContainer.addEventListener('focusout', (e) => handleContainerFocusOut(e, 'liabilities'));

    // Bind event delegates for Equity
    equityContainer.addEventListener('input', (e) => handleContainerInput(e, 'equity'));
    equityContainer.addEventListener('click', (e) => handleContainerClick(e, 'equity'));
    equityContainer.addEventListener('focusout', (e) => handleContainerFocusOut(e, 'equity'));

    // --- ADD BUTTON LISTENERS ---
    if (addAssetBtn) {
        addAssetBtn.addEventListener('click', () => {
            AppState.statements.balanceSheet.assets.push({ id: Date.now(), name: '', amount: '' });
            saveState();
            renderList('assets');
        });
    }

    if (addLiabilityBtn) {
        addLiabilityBtn.addEventListener('click', () => {
            AppState.statements.balanceSheet.liabilities.push({ id: Date.now(), name: '', amount: '' });
            saveState();
            renderList('liabilities');
        });
    }

    if (addEquityBtn) {
        addEquityBtn.addEventListener('click', () => {
            AppState.statements.balanceSheet.equity.push({ id: Date.now(), name: '', amount: '' });
            saveState();
            renderList('equity');
        });
    }

    // --- CORE MATHEMATICS & EQUATION VALIDATOR ---
    const calculateAll = () => {
        const assets = AppState.statements.balanceSheet.assets;
        const liabilities = AppState.statements.balanceSheet.liabilities;
        const equity = AppState.statements.balanceSheet.equity;

        // Perform arithmetic calculations
        const totalAssets = assets.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        const totalLiabilities = liabilities.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        const totalEquity = equity.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        const totalLiabilitiesEquity = totalLiabilities + totalEquity;

        const isBalanced = Math.abs(totalAssets - totalLiabilitiesEquity) < 0.01;

        // Safely update DOM total outputs
        const totalAssetsEl = document.getElementById('bs-total-assets');
        const totalLiabilitiesEl = document.getElementById('bs-total-liabilities');
        const totalEquityEl = document.getElementById('bs-total-equity');
        const totalLiabilitiesEquityEl = document.getElementById('bs-total-liabilities-equity');

        if (totalAssetsEl) totalAssetsEl.textContent = formatCurrency(totalAssets);
        if (totalLiabilitiesEl) totalLiabilitiesEl.textContent = formatCurrency(totalLiabilities);
        if (totalEquityEl) totalEquityEl.textContent = formatCurrency(totalEquity);
        if (totalLiabilitiesEquityEl) totalLiabilitiesEquityEl.textContent = formatCurrency(totalLiabilitiesEquity);

        // Update Dual-Entry Balancer Bar UI
        const balancerContainer = document.getElementById('bs-balancer-container');
        const balancerFill = document.getElementById('bs-balancer-fill');
        const balancerStatus = document.getElementById('bs-balancer-status');

        if (balancerContainer && balancerFill && balancerStatus) {
            const combinedValue = totalAssets + totalLiabilitiesEquity;
            const assetPercent = combinedValue > 0 ? (totalAssets / combinedValue) * 100 : 50;

            balancerFill.style.width = `${assetPercent}%`;

            if (isBalanced) {
                balancerContainer.className = 'balancer-container balanced';
                balancerStatus.innerHTML = `Balanced ✓ &nbsp;|&nbsp; Assets = Liabilities + Equity (${formatCurrency(totalAssets)})`;
            } else {
                balancerContainer.className = 'balancer-container unbalanced';
                const difference = Math.abs(totalAssets - totalLiabilitiesEquity);
                balancerStatus.innerHTML = `Out of Balance ❌ &nbsp;|&nbsp; Difference: ${formatCurrency(difference)}`;
            }
        }

        // Live Master Sheet plain-text report sync
        const liveCanvas = document.getElementById('live-canvas-text');
        if (liveCanvas) {
            let report = `=== SMARTDAYBUDGET.COM REPORT ===\n`;
            report += `[ASSETS LOG]\n`;
            assets.forEach(item => {
                if (item.name || item.amount) {
                    report += `- ${item.name || 'Unnamed'}: ${parseFloat(item.amount) || 0} Taka [Asset]\n`;
                }
            });
            report += `TOTAL REGISTERED ASSETS: ${totalAssets} Taka\n\n`;

            report += `[LIABILITIES LOG]\n`;
            liabilities.forEach(item => {
                if (item.name || item.amount) {
                    report += `- ${item.name || 'Unnamed'}: ${parseFloat(item.amount) || 0} Taka [Liability]\n`;
                }
            });
            report += `TOTAL OWD LIABILITIES: ${totalLiabilities} Taka\n\n`;

            report += `[OWNER'S EQUITY LOG]\n`;
            equity.forEach(item => {
                if (item.name || item.amount) {
                    report += `- ${item.name || 'Unnamed'}: ${parseFloat(item.amount) || 0} Taka [Owner's Equity]\n`;
                }
            });
            report += `TOTAL OWNER'S EQUITY: ${totalEquity} Taka\n\n`;

            report += `=== VERIFICATION EQUATION ===\n`;
            report += `Assets (${totalAssets}) = Liabilities + Equity (${totalLiabilitiesEquity})\n`;
            report += `Status: ${isBalanced ? 'Balanced ✓' : 'Out of Balance ❌'}`;
            if (!isBalanced) {
                report += `\n`;
                if (totalAssets > totalLiabilitiesEquity) {
                    report += `Action Required: Your assets exceed your sources of funds. Increase Owner's Equity or record an outstanding Liability to balance.`;
                } else {
                    report += `Action Required: Your sources of funds exceed registered assets. Log your remaining cash, inventory, or equipment values.`;
                }
            }
            liveCanvas.textContent = report;
        }
    };

    // --- INITIALIZATION ---
    renderList('assets');
    renderList('liabilities');
    renderList('equity');
    calculateAll();

    // Hook currency updates
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

// Load and initialize
document.addEventListener('DOMContentLoaded', () => {
    initBalanceSheet();
    
    // Prevent mouse wheel scrolling from shifting values
    document.addEventListener('wheel', () => {
        if (document.activeElement.type === 'number') {
            document.activeElement.blur();
        }
    });
});

