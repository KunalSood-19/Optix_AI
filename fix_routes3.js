const fs = require('fs');
let appJs = fs.readFileSync('App.js', 'utf8');

// Insert it right after ResultScreen
appJs = appJs.replace(
  /component={ResultScreen}\s*\/>/,
  "component={ResultScreen}\n      />\n\n      <Stack.Screen name=\"CircleSearchEditor\" component={CircleSearchEditorScreen} options={{ presentation: 'fullScreenModal' }} />"
);

fs.writeFileSync('App.js', appJs);
console.log("Successfully inserted CircleSearchEditor WITH REGEX!");
