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
    if (content.includes('<StatusBar') && !content.includes('StatusBar,')) {
      const regex = /import\s+{([^}]*)}\s+from\s+['"]react-native['"]/;
      const match = content.match(regex);
      if (match && !match[1].includes('StatusBar')) {
        let newImport = match[0].replace(match[1], match[1] + ', StatusBar');
        content = content.replace(match[0], newImport);
        fs.writeFileSync(filepath, content);
        console.log('Fixed StatusBar in ' + filepath);
      }
    }
  }
});
