export async function onRequestGet({ request, env }) {
  const auth = request.headers.get("authorization");
  if (!auth || !auth.startsWith("Basic ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const [user, pass] = atob(auth.split(" ")[1]).split(":");
  if (user !== env.ADMIN_USER || pass !== env.ADMIN_PASS) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }

  // 获取 KV / D1 的聊天记录
  let logs = [];
  if (env.AI_LOGS) {
    const list = await env.AI_LOGS.list({ prefix: "chat-" });
    for (const item of list.keys) {
      const data = await env.AI_LOGS.get(item.name);
      logs.push({ key: item.name, messages: JSON.parse(data) });
    }
  }

  return new Response(JSON.stringify(logs), {
    headers: { "Content-Type": "application/json" }
  });
}
