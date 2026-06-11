const OPENROUTER_API_KEY = "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";

export async function askAgent(question) {
  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
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
              role: "system",
              content:
                "You are SmartLens Agent, a helpful AI assistant. Answer clearly and concisely.",
            },
            {
              role: "user",
              content: question,
            },
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

    return (
      data?.choices?.[0]?.message?.content ||
      "No response received."
    );
  } catch (error) {
    console.log("AGENT ERROR:", error);
    return `❌ ${error.message}`;
  }
}