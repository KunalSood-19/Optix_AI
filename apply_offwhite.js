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

function processFile(filepath) {
  if (filepath.endsWith('.js') || filepath.endsWith('.jsx')) {
    let content = fs.readFileSync(filepath, 'utf8');
    let original = content;

    // Replace the dull light gray (#B3B3B3) with a crisp Off-White (#F4F4F4)
    // This applies to text colors, icons, borders, etc.
    content = content.replace(/#B3B3B3/g, '#F4F4F4');
    
    // Also, upgrade the medium gray (#808080) slightly to (#A3A3A3) for better legibility on pure black
    content = content.replace(/#808080/g, '#A3A3A3');

    if (original !== content) {
      fs.writeFileSync(filepath, content);
    }
  }
}

walkSync('src', processFile);
console.log('Off-white brightness applied!');
