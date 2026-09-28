const fs = require('fs');
const path = require('path');

function walkSync(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    let filepath = path.join(dir, file);
    let stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      walkSync(filepath, callback);
    } else {
      callback(filepath);
    }
  });
}

walkSync('src', (filepath) => {
  if (filepath.endsWith('.js') || filepath.endsWith('.jsx')) {
    let content = fs.readFileSync(filepath, 'utf8');
    
    // Completely wipe out any lingering rgba(255,255,255) for backgrounds/borders
    // Using RegExp with global flag to replace all occurrences regardless of spacing
    content = content.replace(/backgroundColor:\s*['"]rgba\(255,\s*255,\s*255,\s*0\.\d+['"]/g, "backgroundColor: 'rgba(38, 38, 38, 0.65)'");
    content = content.replace(/borderColor:\s*['"]rgba\(255,\s*255,\s*255,\s*0\.\d+['"]/g, "borderColor: 'rgba(128, 128, 128, 0.3)'");
    
    // Wipe out the ambientGlow circle from styles and elements
    content = content.replace(/<View style=\{styles\.ambientGlow\}\s*\/>/g, '');
    
    // Ensure all linear gradients that were previously #2D2D2D or #4D4D4D in the background just become the darkest gray plain
    content = content.replace(/colors=\{[\s\n]*\['#4D4D4D',\s*'#050505',\s*'#050505'\][\s\n]*\}/g, "colors={['#050505', '#050505']}");
    content = content.replace(/colors=\{[\s\n]*\['#2D2D2D',\s*'#050505',\s*'#050505'\][\s\n]*\}/g, "colors={['#050505', '#050505']}");
    
    fs.writeFileSync(filepath, content);
  }
});
console.log('Sweep complete.');
