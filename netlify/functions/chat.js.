exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };
  try {
    const body = JSON.parse(event.body || "{}");
    const messages = Array.isArray(body.messages) ? body.messages.slice(-20) : [];
    const ok = messages.length > 0 && messages.every(m =>
      (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.length < 8000);
    if (!ok) return { statusCode: 400, body: JSON.stringify({ error: "Bad request" }) };
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({ model: "claude-sonnet-5-5", max_tokens: 600, messages })
    });
    const data = await r.json();
    const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
    if (!r.ok || !text) return { statusCode: 502, body: JSON.stringify({ error: "Upstream error" }) };
    return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: "Server error" }) };
  }
};
