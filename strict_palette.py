import os
import re

directory = r'c:\Users\vedan\Downloads\SmartLensAI3\src'
app_js = r'c:\Users\vedan\Downloads\SmartLensAI3\App.js'

COLOR_1 = '#B3B3B3'  
COLOR_2 = '#808080'  
COLOR_3 = '#4D4D4D'  
COLOR_4 = '#262626'  
COLOR_5 = '#050505'  

GLASS_BG = 'rgba(38, 38, 38, 0.65)'  # COLOR_4 with opacity
GLASS_BORDER = 'rgba(128, 128, 128, 0.3)' # COLOR_2 with opacity

def apply_strict_palette(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Base Backgrounds
    content = content.replace('#000000', COLOR_5)
    content = content.replace('#0A0A0A', COLOR_5)
    
    # Texts and Icons (White -> Color 1)
    content = content.replace('#FFFFFF', COLOR_1)
    content = content.replace('"white"', f'"{COLOR_1}"')
    
    # Secondary Texts (A3A3A3 or 6B6B6B -> Color 2)
    content = content.replace('#A3A3A3', COLOR_2)
    content = content.replace('#6B6B6B', COLOR_2)
    
    # Glows and Accents (2D2D2D -> Color 3)
    content = content.replace('#2D2D2D', COLOR_3)
    content = content.replace('rgba(107, 107, 107', 'rgba(77, 77, 77') 
    
    # Glass Backgrounds
    content = re.sub(r"backgroundColor:\s*['\"]rgba\(255,\s*255,\s*255,\s*0\.\d+['\"]", f"backgroundColor: '{GLASS_BG}'", content)
    
    # Glass Borders
    content = re.sub(r"borderColor:\s*['\"]rgba\(255,\s*255,\s*255,\s*0\.\d+['\"]", f"borderColor: '{GLASS_BORDER}'", content)
    
    # Fix HomeScreen specific arrays
    content = content.replace("colors={['#2D2D2D', '#000000', '#000000']}", f"colors={{['{COLOR_3}', '{COLOR_5}', '{COLOR_5}']}}")

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith(('.js', '.jsx')):
            apply_strict_palette(os.path.join(root, file))

if os.path.exists(app_js):
    apply_strict_palette(app_js)

print('Strict Palette Applied')
