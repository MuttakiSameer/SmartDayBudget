import os
import re

html_files = [f for f in os.listdir('.') if f.endswith('.html')]

# 1. Clean HTML Files: Remove the restrictive inline styles from <main>
for filename in html_files:
    with open(filename, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Strip out the inline style that freezes mobile
    content = re.sub(
        r'<main class="main-content" style="[^"]*">',
        '<main class="main-content">',
        content
    )
    
    with open(filename, 'w', encoding='utf-8') as file:
        file.write(content)

# 2. Clean style.css: Remove the height locks from the core layout containers
if os.path.exists('style.css'):
    with open('style.css', 'r', encoding='utf-8') as file:
        css = file.read()

    # Fix .app-layout (Remove 100vh and overflow hidden)
    css = re.sub(
        r'\.app-layout\s*\{[^}]*\}',
        '.app-layout {\n    display: flex;\n    min-height: 100vh;\n    width: 100%;\n    position: relative;\n}',
        css
    )

    # Fix .content-area, .main-content (Remove 100vh and overflow auto)
    css = re.sub(
        r'\.content-area,\s*\.main-content\s*\{[^}]*\}',
        '.content-area, .main-content {\n    flex-grow: 1;\n    padding: 3rem;\n    position: relative;\n}',
        css
    )

    # Fix Mobile Media Query padding (Remove calc 100vh)
    css = re.sub(
        r'\.content-area,\s*\.main-content\s*\{\s*padding:\s*1\.25rem[^}]*\}',
        '.content-area, .main-content {\n        padding: 1.25rem 16px !important;\n        padding-bottom: 110px !important;\n    }',
        css
    )

    with open('style.css', 'w', encoding='utf-8') as file:
        file.write(css)

print("Native scrolling restored. HTML and CSS height locks removed.")
