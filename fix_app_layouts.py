import os
import re

# 1. Define the complete, absolute 6-permanent-item navigation block
unified_nav = """<nav class="nav-menu">
    <a href="index.html" class="nav-item">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
        <span>Daily Tracker</span>
    </a>
    <a href="compound-interest.html" class="nav-item">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
        <span>Compound Interest</span>
    </a>
    <a href="loan-payoff.html" class="nav-item">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7h12m-3-1l-3 1m0 0l3 9a5.002 5.002 0 006.001 0M15 7l3 9m-3-9h-3M12 3v18M12 7h3"></path></svg>
        <span>Loan Payoff</span>
    </a>
    <a href="credit-card-debt.html" class="nav-item">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
        <span>Credit Card Debt</span>
    </a>
    <a href="savings-goals.html" class="nav-item">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle></svg>
        <span>Savings Goals</span>
    </a>
    <a href="guides.html" class="nav-item">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
        <span>Guides</span>
    </a>
</nav>"""

target_files = [
    'index.html', 'compound-interest.html', 'loan-payoff.html', 
    'credit-card-debt.html', 'savings-goals.html', 'guides.html',
    '50000-taka-daily-budget.html', 'biweekly-pay-daily-budget-calculator.html',
    'uk-monthly-salary-daily-budget-calculator.html', 'daily-budget-calculator-uber-drivers.html'
]

for filename in target_files:
    if not os.path.exists(filename):
        continue
        
    with open(filename, 'r', encoding='utf-8') as f:
        html = f.read()

    # TASK A: Permanently fix viewport lockup by replacing the <main class="main-content"> opening tag
    html = re.sub(
        r'<main class="main-content"[^>]*>', 
        '<main class="main-content" style="overflow-y: auto; height: 100vh; -webkit-overflow-scrolling: touch;">', 
        html
    )
    html = html.replace('<main class="main-content">', '<main class="main-content" style="overflow-y: auto; height: 100vh; -webkit-overflow-scrolling: touch;">')

    # TASK B: Wipe out old layout navigation systems and insert the unified 6-item nav menu block
    html = re.sub(r'<nav class="nav-menu">.*?</nav>', unified_nav, html, flags=re.DOTALL)

    # TASK C: Strip out any remaining references to about.html in the sidebar or footer links block
    html = re.sub(r'<a href="about\.html"[^>]*>.*?</a>', '', html, flags=re.DOTALL)

    # TASK D: Enforce active configuration metrics based on current loaded route
    if filename == 'guides.html' or filename.endswith('-budget.html') or filename.endswith('-calculator.html'):
        html = html.replace('href="guides.html" class="nav-item"', 'href="guides.html" class="nav-item active"')
    elif filename == 'index.html':
        html = html.replace('href="index.html" class="nav-item"', 'href="index.html" class="nav-item active"')
    else:
        html = html.replace(f'href="{filename}" class="nav-item"', f'href="{filename}" class="nav-item active"')

    # TASK E: For dedicated content guides, safely migrate standard cards to flat blog layouts
    if filename in ['50000-taka-daily-budget.html', 'biweekly-pay-daily-budget-calculator.html', 'uk-monthly-salary-daily-budget-calculator.html', 'daily-budget-calculator-uber-drivers.html']:
        html = html.replace('<article class="calculator-card">', '<article class="blog-article-container">')
        html = html.replace('<div class="calculator-card">', '<article class="blog-article-container">')

    # Save modifications
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(html)

print("App layouts updated and scrolling issues fully resolved!")
