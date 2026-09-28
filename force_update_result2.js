const fs = require('fs');
let code = fs.readFileSync('src/screens/ResultScreen.js', 'utf8');

// Normalize to LF
code = code.replace(/\\r\\n/g, '\\n');

const target1 = \`  const tabs =
    mode === "math" ? ["summary", "text", "chat"]
    : mode === "notes" ? ["summary", "text"]
    : mode === "objectDetection" ? ["summary", "chat"]
    : receiptData ? ["summary", "text", "chat", "receipt"]
    : ["summary", "text", "chat"];\`;

const replacement1 = \`  const tabs =
    mode === "math" ? ["summary", "text", "chat"]
    : mode === "notes" ? ["summary", "text"]
    : (mode === "objectDetection" || mode === "circleToSearch") ? ["summary", "chat", "text"]
    : receiptData ? ["summary", "text", "chat", "receipt"]
    : ["summary", "text", "chat"];\`;

const target2 = \`      } else if (mode === "objectDetection") {
        const objData = await identifyObject(base64);
        setObjectData(objData);
        setSummaryConfidence(objData.confidence?.toUpperCase() || "LOW");
        rawText = \\\`**\${objData.identifiedObject}**\\n\\n\${objData.description}\\\`; // For Ask Optix context
        setAiSummary(rawText);
        setLoading(false);
        return;
      } else {
        rawText = await summarizeText(extractedText);
      }\`;

const replacement2 = \`      } else if (mode === "circleToSearch") {
        const objData = await performCircleToSearch(base64 || imageUri);
        if (objData && objData.title) {
          rawText = \\\`# \${objData.title}\\n\\n\${objData.answer}\\\`;
          if (objData.extractedText && objData.extractedText.trim().length > 0) {
            setExtractedText(objData.extractedText);
          }
        } else {
          rawText = "Could not identify the contents of the circled area.";
        }
      } else if (mode === "objectDetection") {
        const objData = await identifyObject(base64);
        setObjectData(objData);
        setSummaryConfidence(objData.confidence?.toUpperCase() || "LOW");
        rawText = \\\`**\${objData.identifiedObject}**\\n\\n\${objData.description}\\\`; // For Ask Optix context
        setAiSummary(rawText);
        setLoading(false);
        return;
      } else {
        rawText = await summarizeText(extractedText);
      }\`;

if (code.includes(target1)) {
  code = code.replace(target1, replacement1);
  console.log("Replaced target1");
} else {
  console.log("Target 1 not found!");
}

if (code.includes(target2)) {
  code = code.replace(target2, replacement2);
  console.log("Replaced target2");
} else {
  console.log("Target 2 not found!");
}

fs.writeFileSync('src/screens/ResultScreen.js', code);
console.log("Done");
