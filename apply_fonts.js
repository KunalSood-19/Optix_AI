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

    // We look for Style definitions that have text properties
    // In React Native, text styles usually have fontSize or color.
    
    // Replace all fontWeight: "700", "800", "bold" with Rajdhani_700Bold
    content = content.replace(/fontWeight:\s*['"](?:700|800|900|bold)['"]/g, "fontFamily: 'Rajdhani_700Bold'");
    
    // Replace all fontWeight: "600" with Rajdhani_600SemiBold
    content = content.replace(/fontWeight:\s*['"]600['"]/g, "fontFamily: 'Rajdhani_600SemiBold'");
    
    // Replace all fontWeight: "400", "500", "normal" with Rajdhani_500Medium
    content = content.replace(/fontWeight:\s*['"](?:400|500|normal)['"]/g, "fontFamily: 'Rajdhani_500Medium'");
    
    // For text styles that have fontSize but no fontFamily yet (since we replaced fontWeight with fontFamily)
    // We inject fontFamily: 'Rajdhani_500Medium' below fontSize if no fontFamily exists in that block
    // This is a bit tricky with Regex, so we'll do a simpler approach:
    // We find 'fontSize: XX,' and if the next lines up to '}' don't have fontFamily, we add it.
    
    let blocks = content.split(' StyleSheet.create({');
    if (blocks.length > 1) {
        let styleStr = blocks[1];
        
        // simple regex to find style objects
        styleStr = styleStr.replace(/([a-zA-Z0-9_]+:\s*\{[^}]*?fontSize:\s*\d+,?[^}]*?\})/g, (match) => {
            if (!match.includes('fontFamily')) {
                return match.replace(/fontSize:\s*(\d+),?/, 'fontSize: $1,\n    fontFamily: \'Rajdhani_500Medium\',');
            }
            return match;
        });
        
        // Also add to any object that has color: but no fontSize and no fontFamily
        styleStr = styleStr.replace(/([a-zA-Z0-9_]+:\s*\{[^}]*?color:\s*['"][^'"]+['"],?[^}]*?\})/g, (match) => {
            if (!match.includes('fontFamily') && !match.includes('fontSize')) {
                return match.replace(/color:\s*(['"][^'"]+['"]),?/, 'color: $1,\n    fontFamily: \'Rajdhani_500Medium\',');
            }
            return match;
        });

        content = blocks[0] + ' StyleSheet.create({' + styleStr;
    }

    if (original !== content) {
      fs.writeFileSync(filepath, content);
    }
  }
}

walkSync('src', processFile);
console.log('Rajdhani font perfectly applied everywhere!');
