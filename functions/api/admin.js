export async function onRequestGet({ env }) {
  // 读取 Authorization header
  const auth = this.request.headers.get("authorization");
  if (!auth || !auth.startsWith("Basic ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const [user, pass] = atob(auth.split(" ")[1]).split(":");
  if (user !== env.ADMIN_USER || pass !== env.ADMIN_PASS) {
    return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
  }

  // 返回假数据或者从 D1/KV 获取聊天记录
  const logs = [
    { id: 1, user: "Alice", assistant: "Hello" },
    { id: 2, user: "Bob", assistant: "Hi" }
  ];

  return new Response(JSON.stringify(logs), {
    headers: { "Content-Type": "application/json" }
  });
}
