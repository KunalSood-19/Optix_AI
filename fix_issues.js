const fs = require('fs');
let scannerCode = fs.readFileSync('src/screens/ScannerScreen.js', 'utf8');
scannerCode = scannerCode.replace("http://api.qrserver.com/v1/read-qr-code/", "https://api.qrserver.com/v1/read-qr-code/");
fs.writeFileSync('src/screens/ScannerScreen.js', scannerCode);

let assistantCode = fs.readFileSync('src/screens/AssistantScreen.js', 'utf8');
assistantCode = assistantCode.replace(
  "behavior={Platform.OS === 'ios' ? 'padding' : undefined}", 
  "behavior={Platform.OS === 'ios' ? 'padding' : 'height'}"
);
fs.writeFileSync('src/screens/AssistantScreen.js', assistantCode);

console.log('Fixed URLs and Keyboard behavior');
