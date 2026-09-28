import os
import re

directory = r'c:\Users\vedan\Downloads\SmartLensAI3\src\screens'

def update_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Standardize glass borders and backgrounds for unified glassmorphism
    # Matches rgba(255, 255, 255, 0.something) and sets them precisely.
    content = re.sub(r"borderColor:\s*['\"]rgba\(255,\s*255,\s*255,\s*0\.\d+['\"]", "borderColor: 'rgba(255, 255, 255, 0.15)'", content)
    content = re.sub(r"backgroundColor:\s*['\"]rgba\(255,\s*255,\s*255,\s*0\.\d+['\"]", "backgroundColor: 'rgba(255, 255, 255, 0.05)'", content)
    
    # Text High Contrast
    content = content.replace('#6B6B6B', '#A3A3A3')
    content = content.replace('#808080', '#A3A3A3')
    
    # Inject drop shadows to typical glass containers
    patterns = ['card:', 'actionPill:', 'scanButton:', 'vaultCard:', 'button:']
    for p in patterns:
        if p in content:
            # check if shadowColor is already near this pattern
            idx = content.find(p)
            if idx != -1:
                chunk = content[idx:idx+200]
                if 'shadowColor' not in chunk:
                    # replace the exact pattern
                    content = content.replace(p + ' {', p + " {\n    shadowColor: '#000',\n    shadowOffset: { width: 0, height: 10 },\n    shadowOpacity: 0.5,\n    shadowRadius: 20,\n    elevation: 10,")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith(('.js', '.jsx')):
            update_file(os.path.join(root, file))
print('UI Refactoring Complete')
