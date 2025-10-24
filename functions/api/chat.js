export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === "/api/admin") {
    const auth = request.headers.get("authorization");
    if (!auth) return new Response("Unauthorized", { status: 401 });
    const base64 = auth.split(" ")[1];
    const [user, pass] = atob(base64).split(":");
    if (user !== env.ADMIN_USER || pass !== env.ADMIN_PASS) {
      return new Response("Forbidden", { status: 403 });
    }
    return new Response("[]", { headers: { "Content-Type": "application/json" } });
  }

  if (path === "/api/chat") {
    const { messages } = await request.json();
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.MODEL,
        max_tokens: parseInt(env.MAX_TOKENS),
        messages: [
          { role: "system", content: env.SYSTEM_PROMPT },
          ...messages,
        ],
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("Not Found", { status: 404 });
}
