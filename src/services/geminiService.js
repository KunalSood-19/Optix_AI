const OPENROUTER_API_KEY =
  "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";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

async function askAI(prompt) {
  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://smartlens.ai",
      "X-Title": "SmartLens AI",
    },
    body: JSON.stringify({
      model: "google/gemma-3-4b-it",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  const data = await response.json();

  console.log("STATUS:", response.status);
  console.log("DATA:", JSON.stringify(data, null, 2));

  if (!response.ok) {
    throw new Error(JSON.stringify(data));
  }

  return data?.choices?.[0]?.message?.content || "No response";
}

// ========================
// DOCUMENT SUMMARY
// ========================

export async function summarizeText(text) {
  return await askAI(`
You are SmartLens AI.

Return output in exactly this format:

📄 DOCUMENT TYPE <type>

📝 SUMMARY
<2-3 line summary>

🔑 KEY POINTS
• point 1
• point 2
• point 3

📌 IMPORTANT DETAILS
• detail 1
• detail 2
• detail 3

Document:
${text}
`);
}

// ========================
// CHAT WITH DOCUMENT
// ========================

export async function chatWithDocument(text, question) {
  return await askAI(`
    
Document Content:
${text}

Question:
${question}

Answer only using information
available in the document.
`);
}

// ========================
// MATH SOLVER
// ========================

// ======================
export async function generateNotes(text) {
  return await askAI(`
You are SmartLens Notes Generator.

Use ONLY the text provided below.
DO NOT use outside knowledge.
DO NOT invent topics.
If the text is incomplete, create notes only from the available text.

Return EXACTLY in this format:

TOPIC:
<topic from the text>

KEY POINTS:
• point 1
• point 2
• point 3

IMPORTANT DETAILS:
• detail 1
• detail 2

SHORT SUMMARY:
<2-3 lines>

TEXT:
${text}
`);
}
// ========================
// TRANSLATOR
// ========================

export async function translateText(text) {
  return await askAI(`
Translate the following text into English.

Format:

🌐 TRANSLATION

${text}
`);
}


export async function askAssistant(question) {
  return await askAI(`
You are SmartLens Assistant.

You help users with:
- General knowledge
- Coding
- Mathematics
- Writing
- Research
- Technology

Rules:
- Be concise.
- Give accurate answers.
- Use bullet points when helpful.

Question:
${question}
`);
}


// ========================
// RECEIPT EXTRACTION
// ========================

export async function extractReceiptData(text) {
  try {
    const result = await askAI(`
Extract receipt data.

Return ONLY valid JSON.

{
  "merchant": "",
  "date": "",
  "total": "",
  "items": [],
  "category": ""
}

Receipt:
${text}
`);

    const json = result.match(/\{[\s\S]*\}/)?.[0];

    if (!json) return null;

    return JSON.parse(json);
  } catch (error) {
    console.log("Receipt Extraction Error:", error);

    return null;
  }
}

// ========================
// IMAGE FALLBACK
// ========================

export async function identifyObject(base64Image) {
  return `
📷 IMAGE DETECTED

Current version uses OCR + AI.

No readable text was found.

Try:
• Better lighting
• Higher quality image
• Larger document area

Image analysis support coming soon.
`;
}
export async function extractBusinessCardData(text) {
  return await askAI(`
Extract business card information.

Format:

👤 Name
🏢 Company
💼 Designation
📞 Phone
📧 Email
🌐 Website
📍 Address

Business Card:
${text}
`);
}
export async function solveMath(text) {
  return await askAI(`
You are SmartLens Math Solver.

The OCR text may contain mistakes.
Correct obvious OCR mistakes first.

Then solve ONLY the main mathematics question.

VERY IMPORTANT:
Return EXACTLY in this format.

QUESTION:
<corrected question>

SOLUTION:
1. ...
2. ...
3. ...

FINAL ANSWER:
<final answer>

Do NOT explain OCR errors.
Do NOT discuss alternative interpretations.
Do NOT solve multiple questions.
Do NOT use markdown.
Do NOT add introductions.

OCR TEXT:
${text}
`);
}