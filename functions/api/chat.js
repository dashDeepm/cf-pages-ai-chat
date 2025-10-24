export async function onRequestPost({ request, env }) {
  const { messages } = await request.json();

  // 调用 OpenRouter 流式 API
  const res = await fetch("https://api.openrouter.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.MODEL,
      max_tokens: parseInt(env.MAX_TOKENS),
      stream: true, // 流式输出
      messages: [
        { role: "system", content: env.SYSTEM_PROMPT },
        ...messages
      ],
    }),
  });

  const stream = new ReadableStream({
    async start(controller) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while(true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const dataStr = line.replace(/^data: /, "").trim();
          if (dataStr === "[DONE]") continue;
          try {
            const data = JSON.parse(dataStr);
            const text = data?.choices?.[0]?.delta?.content || "";
            controller.enqueue(new TextEncoder().encode(text));
          } catch(e) {}
        }
      }
      controller.close();

      // 可选：存储完整聊天记录到 KV / D1
      if (env.AI_LOGS) {
        const key = `chat-${Date.now()}`;
        await env.AI_LOGS.put(key, JSON.stringify(messages));
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache"
    }
  });
}
