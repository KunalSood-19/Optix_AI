const fs = require('fs');
let lines = fs.readFileSync('src/screens/ResultScreen.js', 'utf8').split('\\n');

// Find the line with objectDetection
const line1Index = lines.findIndex(l => l.includes('mode === "objectDetection" ? ["summary", "chat"]'));
if (line1Index !== -1) {
  lines[line1Index] = '    : (mode === "objectDetection" || mode === "circleToSearch") ? ["summary", "chat", "text"]';
}

const line2Index = lines.findIndex(l => l.includes('} else if (mode === "objectDetection") {'));
if (line2Index !== -1) {
  const replacement = `      } else if (mode === "circleToSearch") {
        const objData = await performCircleToSearch(base64 || imageUri);
        if (objData && objData.title) {
          rawText = \`# \${objData.title}\\n\\n\${objData.answer}\`;
          if (objData.extractedText && objData.extractedText.trim().length > 0) {
            setExtractedText(objData.extractedText);
          }
        } else {
          rawText = "Could not identify the contents of the circled area.";
        }
      } else if (mode === "objectDetection") {`;
  lines[line2Index] = replacement;
}

fs.writeFileSync('src/screens/ResultScreen.js', lines.join('\\n'));
console.log("Replaced successfully!");
