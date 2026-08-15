// ====================================================================
// SMARTLENS AI - CORE AGENT SERVICES (GROQ API LAYER)
// ====================================================================

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

console.log("Groq API Key exists:", !!GROQ_API_KEY);

/**
 * Exponential backoff retry wrapper
 */
async function withRetry(fn, retries = 3, delayMs = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      console.log(`[Retry ${i + 1}/${retries}] Failed: ${error.message}`);
      if (i === retries - 1) throw error;
      await new Promise((res) => setTimeout(res, delayMs * Math.pow(2, i)));
    }
  }
}

/**
 * Core text-based utility to interact with the Groq API
 */
async function askAI(prompt, isJsonMode = false) {
  return withRetry(async () => {
    const bodyPayload = {
      model: "llama-3.3-70b-versatile", 
      messages: [
        {
          role: "system",
          content: "You must append a confidence score at the very end of your response exactly in this format: [CONFIDENCE: HIGH] or [CONFIDENCE: MEDIUM] or [CONFIDENCE: LOW]."
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
    };

    if (isJsonMode) {
      bodyPayload.response_format = { type: "json_object" };
      // Remove system prompt in json mode to avoid malformed json if it tries to append string
      bodyPayload.messages.shift();
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

    return data?.choices?.[0]?.message?.content || "No response generated. [CONFIDENCE: LOW]";
  });
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
  try {
    const result = await askAI(`
You are an expert business card extraction worker. Analyze the text and extract contact information.
Return ONLY valid raw JSON conforming strictly to the requested schema.
Do not include markdown wrapper syntax, conversational preamble, or tail text.

Requested Schema:
{
  "name": "Full name",
  "company": "Company or organization name",
  "designation": "Job title or designation",
  "phone": "Phone number",
  "email": "Email address",
  "website": "Website URL",
  "address": "Physical address"
}

Business Card:
${text}
`, true);

    const json = result.match(/\{[\s\S]*\}/)?.[0];
    if (!json) return null;

    return JSON.parse(json);
  } catch (error) {
    console.log("Business Card Extraction Error:", error);
    return null;
  }
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
// ========================
export async function identifyObject(base64Image) {
  return withRetry(async () => {
    if (!base64Image) {
      throw new Error("No image data provided to vision engine");
    }

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
        model: "qwen/qwen3.6-27b",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze the image and identify the primary object.
Return ONLY a strictly valid JSON object matching this exact schema:
{
  "identifiedObject": "Name of the main object (e.g., Wireless mouse)",
  "category": "Broad category (e.g., Computer accessory)",
  "confidence": "HIGH, MEDIUM, or LOW",
  "description": "A short, precise description of the object.",
  "visibleCharacteristics": ["characteristic 1", "characteristic 2"],
  "alternativePossibilities": ["alternative 1", "alternative 2"]
}
If there are multiple obvious main objects, list them in the description or alternativePossibilities.
Do not use markdown backticks around the JSON.`
              },
              {
                type: "image_url",
                image_url: { url: cleanBase64 }
              }
            ]
          }
        ],
        temperature: 0.1,
      }),
    });

    const data = await response.json();

    if (response.status === 429) {
      throw new Error("RATE_LIMIT: Object identification is temporarily busy. Please try again.");
    }

    if (!response.ok) {
      throw new Error(data?.error?.message || "Vision recognition pipeline failed");
    }
    
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty response from Object Vision AI");
    
    // Attempt safe parsing
    return parseAndValidateJSON(content, "visibleCharacteristics");
  });
}

// ==========================================
// PHASE 2: OPTIX STUDY INTELLIGENCE
// ==========================================

function parseAndValidateJSON(jsonString, requiredArrayKey) {
  try {
    // Strip <think>...</think> blocks from Qwen/DeepSeek models
    let cleanedString = jsonString;
    const thinkRegex = /<think>[\s\S]*?<\/think>/g;
    cleanedString = cleanedString.replace(thinkRegex, '');

    const jsonMatch = cleanedString.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON object found in response");
    
    const parsed = JSON.parse(jsonMatch[0]);
    if (requiredArrayKey && (!parsed[requiredArrayKey] || !Array.isArray(parsed[requiredArrayKey]))) {
      // Allow it to pass if it's supposed to be a boolean/string flag instead of an array
      if (typeof parsed[requiredArrayKey] === 'undefined') {
        throw new Error(`Missing required key: ${requiredArrayKey}`);
      }
    }
    return parsed;
  } catch (error) {
    console.log("JSON Parse Error:", error);
    throw new Error("Failed to parse AI output into structured data.");
  }
}

export async function generateStudyDashboard(text) {
  return await askAI(`
Analyze the following study material.
Return a very short Title and a brief 2-sentence Overview of what this document is about.

Format exactly:
TITLE: <title>
OVERVIEW: <overview>

Material:
${text}
`);
}

export async function generateStudySummary(text, level = "Standard") {
  let promptInstructions = "Provide a short structured explanation.";
  if (level === "Quick") {
    promptInstructions = "Provide 5-7 important bullet points only.";
  } else if (level === "Detailed") {
    promptInstructions = "Provide a complete detailed explanation with subheadings and important concepts.";
  }

  return await askAI(`
Summarize the following study material at a "${level}" detail level.
${promptInstructions}

Material:
${text}
`);
}

export async function generateStudyNotes(text) {
  return await askAI(`
Generate structured study notes from the following material.
Use Markdown formatting. Do NOT invent information.

Include sections that make sense for the content, such as:
# [Topic Title]
## Overview
## Key Concepts (bullet points)
## Important Definitions (Term: Definition)
## Important Formulas (if applicable)
## Exam Points

Material:
${text}
`);
}

export async function generateFlashcards(text) {
  let result = await askAI(`
Generate flashcards based ONLY on the source content below.
Return ONLY valid JSON. No markdown, no conversational text.

Schema:
{
  "flashcards": [
    {
      "question": "Clear question",
      "answer": "Concise answer",
      "difficulty": "easy|medium|hard"
    }
  ]
}

Material:
${text}
`, true);

  return parseAndValidateJSON(result, "flashcards");
}

export async function generateMCQ(text, count = 5, difficulty = "medium") {
  let result = await askAI(`
Generate exactly ${count} multiple-choice questions at a "${difficulty}" difficulty level based ONLY on the source content.
Return ONLY valid JSON. No markdown, no conversational text.

Requirements:
- Exactly 4 options per question.
- Only one correct answer.
- "correctAnswer" is the integer index (0-3) of the correct option.
- Provide a brief explanation for why the answer is correct.

Schema:
{
  "questions": [
    {
      "question": "Clear question",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": 0,
      "explanation": "Why it is correct",
      "difficulty": "${difficulty}"
    }
  ]
}

Material:
${text}
`, true);

  const parsed = parseAndValidateJSON(result, "questions");
  
  // Clean up and validate
  parsed.questions = parsed.questions.filter(q => 
    q.question && 
    Array.isArray(q.options) && 
    q.options.length === 4 && 
    typeof q.correctAnswer === 'number'
  );
  
  return parsed;
}

// ========================
// PHASE 3: MATH & HANDWRITING
// ========================

export async function parseMathImage(base64Image) {
  return withRetry(async () => {
    if (!base64Image) {
      throw new Error("No image data provided for math parsing");
    }
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
        model: "qwen/qwen3.6-27b",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Extract the mathematical problem from this image. 
Return ONLY a strictly valid JSON object matching this exact schema:
{
  "expression": "extracted mathematical expression in plain text suitable for parsing (e.g. 2x^2 + 5x - 3 = 0, or 25*14 + 30/5)",
  "type": "type of problem (e.g., Arithmetic, Algebra, Calculus, Statistics, Geometry, Word Problem)",
  "confidence": "high or low"
}
Do not return any markdown wrapping. Just the JSON object.
If it is a word problem, extract the word problem exactly as text.`
              },
              {
                type: "image_url",
                image_url: { url: cleanBase64 }
              }
            ]
          }
        ],
        temperature: 0.1
      })
    });
    const jsonResponse = await response.json();
    if (!response.ok) throw new Error(jsonResponse.error?.message || "Math vision failed");
    
    const content = jsonResponse.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty response from Math Vision AI");
    
    return parseAndValidateJSON(content, "expression");
  });
}

export async function explainMathSolution(expression, steps, deterministicAnswer) {
  const result = await askAI(`You are an expert Math Tutor. I have already solved this problem deterministically.
Problem: ${expression}
Steps Taken: ${JSON.stringify(steps)}
Deterministic Final Answer: ${deterministicAnswer || "Not deterministically soluble"}

Please provide a clear, step-by-step human-readable explanation of how to arrive at this answer.
If the deterministic answer is null, solve it step-by-step yourself.
Use simple, encouraging language.`);
  return result;
}

export async function parseHandwriting(base64ImagesArray) {
  // We can pass multiple images to Groq Vision by constructing the content array
  return withRetry(async () => {
    if (!base64ImagesArray || base64ImagesArray.length === 0) {
      throw new Error("No images provided for handwriting parsing");
    }

    const contentArray = [
      {
        type: "text",
        text: `Transcribe all the handwritten notes from the provided images.
Preserve paragraph structure, lists, and line breaks.
Determine if the content is primarily mathematical.
Return strictly valid JSON matching this schema:
{
  "text": "The fully transcribed text here...",
  "isMath": true or false
}
Do not use markdown backticks around the JSON.`
      }
    ];

    base64ImagesArray.forEach(img => {
      const cleanBase64 = img.startsWith("data:") ? img : `data:image/jpeg;base64,${img}`;
      contentArray.push({
        type: "image_url",
        image_url: { url: cleanBase64 }
      });
    });

    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "qwen/qwen3.6-27b",
        messages: [{ role: "user", content: contentArray }],
        temperature: 0.1
      })
    });
    const jsonResponse = await response.json();
    if (!response.ok) throw new Error(jsonResponse.error?.message || "Handwriting vision failed");
    
    const content = jsonResponse.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty response from Handwriting AI");
    
    return parseAndValidateJSON(content, "text");
  });
}