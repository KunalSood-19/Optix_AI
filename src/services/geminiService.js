// ====================================================================
// SMARTLENS AI - CORE AGENT SERVICES (GROQ API LAYER)
// ====================================================================

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

console.log("API Key exists:", !!GROQ_API_KEY);

/**
 * Core text-based utility to interact with the Groq API
 */
async function askAI(prompt, isJsonMode = false) {
  try {
    const bodyPayload = {
      model: "llama-3.3-70b-versatile", 
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
    };

    if (isJsonMode) {
      bodyPayload.response_format = { type: "json_object" };
    }

    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify(bodyPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error?.message || "AI request failed");
    }

    return data?.choices?.[0]?.message?.content || "No response generated.";
  } catch (error) {
    console.log("AI ERROR:", error);
    throw error;
  }
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

Answer only using information available in the document.
`);
}

// ========================
// NOTES GENERATOR
// ========================
export async function generateNotes(text) {
  return await askAI(`
You are SmartLens Notes Generator.

Use ONLY the text provided below.
DO NOT use outside knowledge.
DO NOT invent topics.

Return EXACTLY in this format:

TOPIC:
<topic>

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

Text:
${text}
`);
}

// ========================
// GENERAL ASSISTANT
// ========================
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
You are an expert receipt extraction worker. Analyze the receipt text and extract structural tokens.
Return ONLY valid raw JSON conforming strictly to the requested architecture schema. 
Do not include markdown wrapper syntax, conversational preamble, or tail text.

Requested Schema:
{
  "merchant": "Name of the store or merchant layout string",
  "date": "Date of transaction or N/A",
  "total": "Total invoice currency volume value string",
  "items": [
    { "name": "Item line description", "price": "Item cost" }
  ],
  "category": "Suggested expense categorization identifier"
}

Receipt Data Stream:
${text}
`, true);

    const json = result.match(/\{[\s\S]*\}/)?.[0];
    if (!json) return null;

    return JSON.parse(json);
  } catch (error) {
    console.log("Receipt Extraction Error:", error);
    return null;
  }
}

// ========================
// BUSINESS CARD EXTRACTION
// ========================
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

// ========================
// MATH SOLVER
// ========================
export async function solveMath(text) {
  return await askAI(`
You are SmartLens Math Solver.

Correct OCR mistakes first.

Return EXACTLY in this format:

QUESTION:
<question>

SOLUTION:
1. ...
2. ...
3. ...

FINAL ANSWER:
<answer>

OCR TEXT:
${text}
`);
}

// ========================
// LIVE VISION OBJECT DETECTION
// ========================// ========================
// LIVE VISION OBJECT DETECTION
// ========================
export async function identifyObject(base64Image) {
  try {
    if (!base64Image) {
      throw new Error("No image data provided to vision engine");
    }

    // Standardize base64 formatting structure for API data transport
    const cleanBase64 = base64Image.startsWith("data:") 
      ? base64Image 
      : `data:image/jpeg;base64,${base64Image}`;

    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        // ✅ UPDATED: Swapped to Groq's active Llama 4 Vision model ID
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Identify the primary objects spotted in this image. Keep the answer concise and direct, for example: 'Object Spotted: [Name of objects detected]'.",
              },
              {
                type: "image_url",
                image_url: {
                  url: cleanBase64,
                },
              },
            ],
          },
        ],
        temperature: 0.2,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error?.message || "Vision recognition pipeline failed");
    }

    return data?.choices?.[0]?.message?.content || "No objects could be clearly identified.";
  } catch (error) {
    console.log("Vision Processing Error:", error);
    return "Object Spotted: Undefined Target (Analysis Error occurred)";
  }
}