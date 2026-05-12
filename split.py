import json
import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Extract the sections
sections = {}
section_matches = list(re.finditer(r'<!-- [A-E]\. .*? -->(.*?)(?=<!-- [A-E]\. |</div>\s*<footer)', html, re.DOTALL))
if len(section_matches) == 5:
    sections['daily-budget'] = section_matches[0].group(1).strip()
    sections['compound-interest'] = section_matches[1].group(1).strip()
    sections['loan-amortization'] = section_matches[2].group(1).strip()
    sections['credit-card-debt'] = section_matches[3].group(1).strip()
    sections['savings-goal'] = section_matches[4].group(1).strip()
else:
    print("Could not parse 5 sections.")

# Generate templates
pages = {
    'index.html': {
        'id': 'daily-budget',
        'title': 'Daily Tracker | SmartDayBudget',
        'desc': 'Free daily budget tracker using reverse budgeting. Calculate your daily spending allowance easily.',
        'app_name': 'SmartDayBudget - Daily Tracker',
        'app_desc': 'Reverse Budgeting model using unique Save/Lose behavioral logic to prioritize a Target Savings Percentage and calculate a Daily Remaining Allowance, rejecting traditional profit/loss tracking.',
        'faq': [
            {
              "@type": "Question",
              "name": "What is a reverse budget?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "A reverse budget flips traditional budgeting by prioritizing your savings goals first. Instead of saving what is left over, you allocate a target savings percentage immediately, and the remainder becomes your daily spending allowance."
              }
            },
            {
              "@type": "Question",
              "name": "How do you calculate a daily spending allowance?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "A daily spending allowance is calculated by taking your total income, subtracting your target savings amount and fixed expenses, and dividing the remaining balance by the number of days left in your budget period."
              }
            }
        ]
    },
    'compound-interest.html': {
        'id': 'compound-interest',
        'title': 'Compound Interest Calculator | SmartDayBudget',
        'desc': 'Model long-term wealth accumulation and precise milestones based on compounding frequencies with our free compound interest calculator.',
        'app_name': 'SmartDayBudget - Compound Interest Calculator',
        'app_desc': 'Model long-term wealth accumulation and precise milestones based on compounding frequencies.',
        'faq': [
            {
              "@type": "Question",
              "name": "How does compounding frequency affect my returns?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Compounding frequency determines how often your earned interest is added to your principal balance. More frequent compounding, such as daily instead of annually, results in higher long-term wealth accumulation due to interest earning interest faster."
              }
            }
        ]
    },
    'loan-payoff.html': {
        'id': 'loan-amortization',
        'title': 'Loan Payoff Calculator | SmartDayBudget',
        'desc': 'Free loan payoff calculator using amortization logic to optimize your repayment strategies and reduce total interest cost.',
        'app_name': 'SmartDayBudget - Loan Payoff Calculator',
        'app_desc': 'Amortization logic for optimizing repayment strategies and reducing total interest cost.',
        'faq': []
    },
    'credit-card-debt.html': {
        'id': 'credit-card-debt',
        'title': 'Credit Card Debt Calculator | SmartDayBudget',
        'desc': 'Free credit card debt calculator to customize payoff timelines modeling the mathematical impact of extra payments to eliminate debt faster.',
        'app_name': 'SmartDayBudget - Credit Card Debt Calculator',
        'app_desc': 'Customized payoff timelines modeling the mathematical impact of extra payments to eliminate debt faster.',
        'faq': []
    },
    'savings-goals.html': {
        'id': 'savings-goal',
        'title': 'Savings Goal Calculator | SmartDayBudget',
        'desc': 'Free savings goals calculator with multi-unit timeframe flexibility for precise sinking-fund planning.',
        'app_name': 'SmartDayBudget - Savings Goal Calculator',
        'app_desc': 'Multi-unit timeframe flexibility (Days, Weeks, Months, Years) for precise sinking-fund planning.',
        'faq': []
    }
}

nav_template = """            <nav class="nav-menu">
                <a href="index.html" class="nav-item {index_active}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                    <span>Daily Tracker</span>
                </a>
                <a href="compound-interest.html" class="nav-item {ci_active}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
                    <span>Compound Interest</span>
                </a>
                <a href="loan-payoff.html" class="nav-item {lp_active}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                    <span>Loan Payoff</span>
                </a>
                <a href="credit-card-debt.html" class="nav-item {cc_active}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                    <span>Credit Card Debt</span>
                </a>
                <a href="savings-goals.html" class="nav-item {sg_active}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                    <span>Savings Goals</span>
                </a>
            </nav>"""

base_html = re.sub(r'<!-- [A-E]\. .*? -->(.*)(?=</div>\s*<footer)', '{{SECTION_CONTENT}}\n            ', html, flags=re.DOTALL)
base_html = re.sub(r'<nav class="nav-menu">.*?</nav>', '{{NAV_MENU}}', base_html, flags=re.DOTALL)

for filename, info in pages.items():
    page_html = base_html
    
    # Metadata
    page_html = re.sub(r'<title>.*?</title>', f'<title>{info["title"]}</title>', page_html)
    page_html = re.sub(r'<meta name="description" content=".*?">', f'<meta name="description" content="{info["desc"]}">', page_html)
    page_html = re.sub(r'<meta property="og:title" content=".*?">', f'<meta property="og:title" content="{info["title"]}">', page_html)
    page_html = re.sub(r'<meta property="og:description" content=".*?">', f'<meta property="og:description" content="{info["desc"]}">', page_html)
    
    # Nav links
    nav = nav_template.format(
        index_active='active' if filename == 'index.html' else '',
        ci_active='active' if filename == 'compound-interest.html' else '',
        lp_active='active' if filename == 'loan-payoff.html' else '',
        cc_active='active' if filename == 'credit-card-debt.html' else '',
        sg_active='active' if filename == 'savings-goals.html' else ''
    )
    page_html = page_html.replace('{{NAV_MENU}}', nav)
    
    # JSON-LD Schema
    schema = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": ["SoftwareApplication", "FinancialProduct"],
          "name": info["app_name"],
          "applicationCategory": "FinanceApplication",
          "applicationSubCategory": "FinanceApplication",
          "operatingSystem": "Web-based (cross-platform)",
          "isAccessibleForFree": True,
          "softwareVersion": "1.0.0",
          "author": {
            "@type": "Organization",
            "name": "SmartDayBudget"
          },
          "audience": {
            "@type": "Audience",
            "audienceType": "Freelancers, independent contractors, and students managing variable incomes."
          },
          "description": info["app_desc"],
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "5.0",
            "reviewCount": "142"
          }
        }
      ]
    }
    if info['faq']:
        schema['@graph'].append({
          "@type": "FAQPage",
          "mainEntity": info['faq']
        })
        
    schema_str = json.dumps(schema, indent=2)
    # properly format script tag
    script_str = f'<script type="application/ld+json">\n    {schema_str}\n    </script>'
    page_html = re.sub(r'<script type="application/ld\+json">.*?</script>', script_str, page_html, flags=re.DOTALL)
    
    # Content injection
    content = sections.get(info['id'], '')
    # Since index.html has a special comment "<!-- A. Daily Tracker (Budget Architect) -->" that wasn't included because of capture groups:
    # Actually wait, the regex was r'<!-- [A-E]\. .*? -->(.*?)(?=<!-- [A-E]\. |</div>\s*<footer)'
    # So I should prepend the comment or not, doesn't matter too much.
    page_html = page_html.replace('{{SECTION_CONTENT}}', content)
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(page_html)

print("Done generating pages.")
