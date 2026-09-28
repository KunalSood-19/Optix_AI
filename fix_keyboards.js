const fs = require('fs');
const files = [
  'src/screens/DocumentDetailScreen.js',
  'src/screens/MathSolverScreen.js',
  'src/screens/ResetPasswordScreen.js',
  'src/screens/ResultScreen.js',
  'src/screens/StudyDashboardScreen.js'
];

files.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(
      /behavior=\{Platform\.OS === "ios" \? "padding" : undefined\}/g,
      'behavior={Platform.OS === "ios" ? "padding" : "height"}'
    );
    fs.writeFileSync(file, content);
  } catch(e) {
    console.log("Error on", file);
  }
});

console.log("Done fixing keyboard avoiding views!");
