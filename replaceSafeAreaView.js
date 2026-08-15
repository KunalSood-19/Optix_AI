const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'screens');
const files = fs.readdirSync(dir);

files.forEach(file => {
  if (file.endsWith('.js') || file.endsWith('.jsx')) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if the file imports SafeAreaView from react-native
    let reactNativeImportMatch = content.match(/import\s+{([^}]*)}\s+from\s+['"]react-native['"];?/);
    if (reactNativeImportMatch) {
      let insideBrackets = reactNativeImportMatch[1];
      if (insideBrackets.includes('SafeAreaView')) {
        let newInside = insideBrackets.replace(/\bSafeAreaView\b,?\s*/g, '');
        // Clean up empty imports
        if (newInside.trim() === '') {
          content = content.replace(reactNativeImportMatch[0], '');
        } else {
          content = content.replace(reactNativeImportMatch[0], `import { ${newInside} } from 'react-native';`);
        }
        content = "import { SafeAreaView } from 'react-native-safe-area-context';\n" + content;
        
        fs.writeFileSync(filePath, content);
        console.log('Updated ' + file);
      }
    }
  }
});
