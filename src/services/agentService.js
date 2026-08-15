const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;

/**
 * Exponential backoff retry wrapper
 */
async function withRetry(fn, retries = 3, delayMs = 1000) {
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

export async function askAgent(historyOrQuestion) {
  return withRetry(async () => {
    if (!GROQ_API_KEY) {
      throw new Error("Groq API Key configuration is missing.");
    }

    let messages = [];
    if (Array.isArray(historyOrQuestion)) {
      messages = historyOrQuestion;
    } else {
      messages = [{ role: "user", content: historyOrQuestion }];
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "qwen/qwen3.6-27b",
          messages: [
            {
              role: "system",
              content:
                "You are SmartLens Agent, a helpful AI assistant. Answer clearly, structured, and concisely. You must append a confidence score at the very end of your response exactly in this format: [CONFIDENCE: HIGH] or [CONFIDENCE: MEDIUM] or [CONFIDENCE: LOW].",
            },
            ...messages,
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error?.message || "Failed to get response"
      );
    }
    
    let rawContent = data?.choices?.[0]?.message?.content || "No response received. [CONFIDENCE: LOW]";
    // Strip <think> tags from qwen output
    rawContent = rawContent.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

    return rawContent;
  });
}