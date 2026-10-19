exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };
  try {
    const body = JSON.parse(event.body || "{}");
    const messages = Array.isArray(body.messages) ? body.messages.slice(-20) : [];
    const ok = messages.length > 0 && messages.every(m =>
      (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.length < 8000);
    if (!ok) return { statusCode: 400, body: JSON.stringify({ error: "Bad request" }) };
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": "Bearer " + process.env.GROQ_API_KEY
      },
      body: JSON.stringify({ model: "llama-3.3-70b-versatile", max_tokens: 600, messages })
    });
    const data = await r.json();
    console.log(r.status, JSON.stringify(data));
    const text = data.choices && data.choices[0] && data.choices[0].message ? data.choices[0].message.content : "";
    if (!r.ok || !text) return { statusCode: 502, body: JSON.stringify({ error: "Upstream error" }) };
    return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: "Server error" }) };
  }
};
