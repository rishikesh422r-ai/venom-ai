exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const messages = Array.isArray(body.messages)
      ? body.messages.slice(-20)
      : [];

    const valid = messages.length > 0 &&
      messages.every((m) =>
        ["user", "assistant"].includes(m.role) &&
        typeof m.content === "string" &&
        m.content.length < 8000
      );

    if (!valid) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid messages" })
      };
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "GROQ_API_KEY is missing" })
      };
    }

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages,
          max_tokens: 600
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq error:", response.status, data);
      return {
        statusCode: 502,
        body: JSON.stringify({ error: "AI service request failed" })
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reply: data.choices?.[0]?.message?.content || ""
      })
    };
  } catch (error) {
    console.error("Chat function error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" })
    };
  }
};
