const fs = require('fs');
let code = fs.readFileSync('src/screens/ResultScreen.js', 'utf8');

code = code.replace(
  'identifyObject, translateText, extractSearchQuery',
  'identifyObject, translateText, extractSearchQuery, performCircleToSearch'
);

code = code.replace(
  /} else if (mode === "objectDetection") {/g,
  `} else if (mode === "circleToSearch") {
        const objData = await performCircleToSearch(base64 || imageUri);
        if (objData && objData.title) {
          rawText = \`# \${objData.title}\\n\\n\${objData.answer}\`;
          if (objData.extractedText && objData.extractedText.trim().length > 0) {
            rawText += \`\\n\\n---\\n\\n**Extracted Text:**\\n\\n\${objData.extractedText}\`;
          }
        } else {
          rawText = "Could not identify the contents of the circled area.";
        }
      } else if (mode === "objectDetection") {`
);

fs.writeFileSync('src/screens/ResultScreen.js', code);
console.log("Updated ResultScreen.js");
