const fs = require('fs');
let appJs = fs.readFileSync('App.js', 'utf8');

// Insert the screen right before QRScanner
appJs = appJs.replace(
  '      <Stack.Screen\n        name="QRScanner"',
  '      <Stack.Screen name="CircleSearchEditor" component={CircleSearchEditorScreen} options={{ presentation: "fullScreenModal" }} />\n      <Stack.Screen\n        name="QRScanner"'
);

fs.writeFileSync('App.js', appJs);
console.log("Successfully inserted CircleSearchEditor!");
