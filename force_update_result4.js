const fs = require('fs');

let code = fs.readFileSync('src/screens/ResultScreen.js', 'utf8');

// The file has \r\n endings. We will match using indexOf to be completely safe.
const searchImport = 'extractBusinessCardData, solveMath, generateNotes, identifyObject, translateText';
const replaceImport = 'extractBusinessCardData, solveMath, generateNotes, identifyObject, translateText, performCircleToSearch';

if (code.includes(searchImport)) {
  code = code.replace(searchImport, replaceImport);
}

const searchTabs = 'mode === "math" ? ["summary", "text", "chat"]\\r\\n    : mode === "notes" ? ["summary", "text"]\\r\\n    : mode === "objectDetection" ? ["summary", "chat"]';
const replaceTabs = 'mode === "math" ? ["summary", "text", "chat"]\\r\\n    : mode === "notes" ? ["summary", "text"]\\r\\n    : (mode === "objectDetection" || mode === "circleToSearch") ? ["summary", "chat", "text"]';

if (code.includes(searchTabs)) {
  code = code.replace(searchTabs, replaceTabs);
} else {
  // Try without \r
  const searchTabsLF = 'mode === "math" ? ["summary", "text", "chat"]\\n    : mode === "notes" ? ["summary", "text"]\\n    : mode === "objectDetection" ? ["summary", "chat"]';
  const replaceTabsLF = 'mode === "math" ? ["summary", "text", "chat"]\\n    : mode === "notes" ? ["summary", "text"]\\n    : (mode === "objectDetection" || mode === "circleToSearch") ? ["summary", "chat", "text"]';
  if (code.includes(searchTabsLF)) {
    code = code.replace(searchTabsLF, replaceTabsLF);
  }
}

const searchBlockLF = `      } else if (mode === "objectDetection") {
        const objData = await identifyObject(base64);
        setObjectData(objData);
        setSummaryConfidence(objData.confidence?.toUpperCase() || "LOW");
        rawText = \\\`**\${objData.identifiedObject}**\\n\\n\${objData.description}\\\`; // For Ask Optix context
        setAiSummary(rawText);
        setLoading(false);
        return;
      } else {
        rawText = await summarizeText(extractedText);
      }`;

const replaceBlockLF = `      } else if (mode === "circleToSearch") {
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
      }`;

const searchBlockCRLF = searchBlockLF.replace(/\\n/g, '\\r\\n');
const replaceBlockCRLF = replaceBlockLF.replace(/\\n/g, '\\r\\n');

if (code.includes(searchBlockCRLF)) {
  code = code.replace(searchBlockCRLF, replaceBlockCRLF);
} else if (code.includes(searchBlockLF)) {
  code = code.replace(searchBlockLF, replaceBlockLF);
}

fs.writeFileSync('src/screens/ResultScreen.js', code);
console.log("Fixed ResultScreen correctly!");
