export async function onRequestPost({ request, env }) {
  const { messages } = await request.json();

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.MODEL,
      messages: [
        { role: "system", content: env.SYSTEM_PROMPT },
        ...messages
      ],
      max_tokens: parseInt(env.MAX_TOKENS),
      stream: true
    })
  });

  if (!res.body) {
    return new Response("OpenRouter API body is empty", { status: 500 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop(); // 保留未完整的行

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const dataStr = line.replace(/^data: /, "").trim();
          if (dataStr === "[DONE]") continue;

          try {
            const data = JSON.parse(dataStr);
            const text = data.choices?.[0]?.delta?.content || "";
            if (text) controller.enqueue(new TextEncoder().encode(text));
          } catch(e) {
            console.error("Parse SSE line error:", e, line);
          }
        }
      }
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
