const fs = require('fs');
const path = require('path');

const directory = "C:\\Users\\UNIQUE\\.gemini\\antigravity\\scratch\\smartdaybudget".replace(/\\/g, '/');

const NAV_ITEMS = [
    ['index.html', '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg><span>Daily Tracker</span>'],
    ['compound-interest.html', '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg><span>Compound Interest</span>'],
    ['loan-payoff.html', '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 0 0 6.001 0M6 7l3 9M6 7h12m-3-1l-3 1m0 0l3 9a5.002 5.002 0 0 0 6.001 0M15 7l3 9m-3-9h-3M12 3v18M12 7h3"></path></svg><span>Loan Payoff</span>'],
    ['credit-card-debt.html', '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg><span>Credit Card Debt</span>'],
    ['savings-goals.html', '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg><span>Savings Goals</span>'],
    ['balance-sheet.html', '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg><span>Balance Sheet</span>'],
    ['income-statement.html', '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg><span>Income Statement</span>'],
    ['cash-flow.html', '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg><span>Cash Flow</span>'],
    ['equity.html', '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 8l-4 4h8z"></path></svg><span>Equity Changes</span>'],
    ['guides.html', '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg><span>Guides</span>']
];

const FOOTER_ITEMS = [
    ['index.html', 'Daily Tracker'],
    ['compound-interest.html', 'Compound Interest'],
    ['loan-payoff.html', 'Loan Payoff'],
    ['credit-card-debt.html', 'Credit Card Debt'],
    ['savings-goals.html', 'Savings Goals'],
    ['balance-sheet.html', 'Balance Sheet'],
    ['income-statement.html', 'Income Statement'],
    ['cash-flow.html', 'Cash Flow'],
    ['equity.html', 'Equity Changes'],
    ['guides.html', 'Guides']
];

function getNavBlock(activeFilename) {
    let block = '            <nav class="nav-menu">\n';
    NAV_ITEMS.forEach(([href, inner]) => {
        const cls = href === activeFilename ? 'nav-item active' : 'nav-item';
        block += `                <a href="${href}" class="${cls}">\n                    ${inner}\n                </a>\n`;
    });
    block += '            </nav>';
    return block;
}

function getFooterBlock() {
    let block = '                <div class="footer-links">\n';
    FOOTER_ITEMS.forEach(([href, text]) => {
        block += `                    <a href="${href}">${text}</a>\n`;
    });
    block += '                </div>';
    return block;
}

let logs = [];
const log = (msg) => {
    console.log(msg);
    logs.push(msg);
};

fs.readdirSync(directory).forEach(file => {
    if (!file.endsWith('.html')) return;
    const filepath = path.join(directory, file);
    let content = fs.readFileSync(filepath, 'utf8');

    const navBlock = getNavBlock(file);
    const footerBlock = getFooterBlock();

    // Substring replace nav
    const navStartStr = '<nav class="nav-menu">';
    const navStartIdx = content.indexOf(navStartStr);
    if (navStartIdx !== -1) {
        const navEndIdx = content.indexOf('</nav>', navStartIdx);
        if (navEndIdx !== -1) {
            content = content.substring(0, navStartIdx) + navBlock + content.substring(navEndIdx + 6);
        }
    }

    // Substring replace footer
    const footerStartStr = '<div class="footer-links">';
    const footerStartIdx = content.indexOf(footerStartStr);
    if (footerStartIdx !== -1) {
        const footerEndIdx = content.indexOf('</div>', footerStartIdx);
        if (footerEndIdx !== -1) {
            content = content.substring(0, footerStartIdx) + footerBlock + content.substring(footerEndIdx + 6);
        }
    }

    fs.writeFileSync(filepath, content, 'utf8');
    log(`SUCCESS: Updated ${file}`);
});

fs.writeFileSync(path.join(directory, 'output.txt'), logs.join('\n'), 'utf8');
