const fs = require('fs');

// 1. Update App.js
let appJs = fs.readFileSync('App.js', 'utf8');
appJs = appJs.replace(
  "import HandwritingEditorScreen from \"./src/screens/HandwritingEditorScreen\";",
  "import HandwritingEditorScreen from \"./src/screens/HandwritingEditorScreen\";\nimport CircleSearchEditorScreen from \"./src/screens/CircleSearchEditorScreen\";"
);
appJs = appJs.replace(
  "<Stack.Screen name=\"HandwritingEditor\" component={HandwritingEditorScreen} />",
  "<Stack.Screen name=\"HandwritingEditor\" component={HandwritingEditorScreen} />\n      <Stack.Screen name=\"CircleSearchEditor\" component={CircleSearchEditorScreen} options={{ presentation: 'fullScreenModal' }} />"
);
fs.writeFileSync('App.js', appJs);

// 2. Update ScannerScreen.js
let scannerJs = fs.readFileSync('src/screens/ScannerScreen.js', 'utf8');

// Insert mode into array
scannerJs = scannerJs.replace(
  "const SCANNER_MODES = [",
  "const SCANNER_MODES = [\n  { id: \"circleToSearch\", label: \"Circle Search\", icon: \"search-circle-outline\", color: \"#FF3B30\" },"
);

// Change default mode
scannerJs = scannerJs.replace(
  "useState(route?.params?.mode || \"document\");",
  "useState(route?.params?.mode || \"circleToSearch\");"
);

// Add routing logic
const routingLogic = `
      if (mode === "circleToSearch") {
        navigation.navigate("CircleSearchEditor", {
          imageUri: compressed.uri,
          base64: base64Data
        });
        setIsProcessing(false);
        return;
      }

      if (mode === "handwriting") {`;

scannerJs = scannerJs.replace(
  "if (mode === \"handwriting\") {",
  routingLogic
);

fs.writeFileSync('src/screens/ScannerScreen.js', scannerJs);
console.log("Updated App.js and ScannerScreen.js");
