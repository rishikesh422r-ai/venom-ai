exports.handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  };

  const reply = (statusCode, data) => ({
    statusCode,
    headers,
    body: JSON.stringify(data)
  });

  if (event.httpMethod !== "POST") {
    return reply(405, {
      error: "Method not allowed. Use POST."
    });
  }

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.error("GROQ_API_KEY is missing");
    return reply(500, {
      error: "AI configuration is missing."
    });
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const messages = Array.isArray(body.messages)
      ? body.messages.slice(-20)
      : [];

    const valid = messages.length > 0 &&
      messages.every((m) =>
        m &&
        ["user", "assistant"].includes(m.role) &&
        typeof m.content === "string" &&
        m.content.trim().length > 0 &&
        m.content.length <= 8000
      );

    if (!valid) {
      return reply(400, {
        error: "Invalid messages. Please try again."
      });
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + apiKey
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content:
                "You are Venom AI, a helpful, intelligent, " +
                "creative assistant. Answer naturally and clearly. " +
                "For creative writing, use vivid and engaging language."
            },
            ...messages
          ],
          max_tokens: 600,
          temperature: 0.7
        })
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error(
        "Groq API status:",
        response.status,
        JSON.stringify(result.error || {})
      );

      return reply(502, {
        error: "The AI service failed. Check Netlify function logs."
      });
    }

    const text =
      result.choices?.[0]?.message?.content?.trim();

    if (!text) {
      return reply(502, {
        error: "The AI returned an empty response."
      });
    }

    return reply(200, { text });

  } catch (error) {
    console.error("Chat function error:", error.message);

    return reply(500, {
      error: "The chat function failed. Check Netlify logs."
    });
  }
};
