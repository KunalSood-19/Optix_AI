const fs = require('fs');
let appJs = fs.readFileSync('App.js', 'utf8');

appJs = appJs.replace(
  "<Stack.Screen name=\"CircleSearchEditor\" component={CircleSearchEditorScreen} options={{ presentation: 'fullScreenModal' }} />",
  ""
);

appJs = appJs.replace(
  "name=\"Result\"\n        component={ResultScreen}\n      />",
  "name=\"Result\"\n        component={ResultScreen}\n      />\n      <Stack.Screen name=\"CircleSearchEditor\" component={CircleSearchEditorScreen} options={{ presentation: 'fullScreenModal' }} />"
);

fs.writeFileSync('App.js', appJs);
console.log("Moved CircleSearchEditor to AppStack!");
