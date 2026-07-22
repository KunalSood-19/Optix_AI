const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;

export async function askAgent(question) {
  try {
    if (!OPENROUTER_API_KEY) {
      throw new Error("OpenRouter API Key configuration is missing.");
    }

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
          model: "google/gemini-2.5-flash", // Upgraded to Gemini 2.5 Flash for high-speed agent execution
          messages: [
            {
              role: "system",
              content:
                "You are SmartLens Agent, a helpful AI assistant. Answer clearly, structured, and concisely.",
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