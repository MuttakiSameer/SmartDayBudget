import os
import re

files_to_update = [
    'index.html',
    'about.html',
    'compound-interest.html',
    'loan-payoff.html',
    'credit-card-debt.html',
    'savings-goals.html'
]

img_tag = '<img src="SmartDayBudget.png" alt="SmartDayBudget Logo" style="width: 100%; height: 100%; object-fit: contain; border-radius: 8px;">'

for filename in files_to_update:
    filepath = os.path.join(r'c:\Users\dell\.antigravity\FinanceSimple', filename)
    if os.path.exists(filepath):
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # We need to replace only the SVG inside <div class="brand-icon"> that is inside <div class="brand"> or <header class="mobile-header">
        # Let's use regex.
        
        # For desktop logo:
        # <div class="brand">\s*<div class="brand-icon">\s*<svg.*?</svg>\s*</div>
        pattern_desktop = r'(<div class="brand">\s*<div class="brand-icon">\s*)<svg.*?</svg>(\s*</div>)'
        content = re.sub(pattern_desktop, r'\g<1>' + img_tag + r'\g<2>', content, flags=re.DOTALL)
        
        # For mobile logo:
        # <header class="mobile-header">\s*<div class="brand-icon">\s*<svg.*?</svg>\s*</div>
        pattern_mobile = r'(<header class="mobile-header">\s*<div class="brand-icon">\s*)<svg.*?</svg>(\s*</div>)'
        content = re.sub(pattern_mobile, r'\g<1>' + img_tag + r'\g<2>', content, flags=re.DOTALL)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"Updated {filename}")
    else:
        print(f"File not found: {filename}")
