export async function onRequestPost({ request, env }) {
  const { messages } = await request.json();

  const res = await fetch("https://api.openrouter.ai/v1/chat/completions", {
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
      stream: true // 开启流式输出
    }),
  });

  const stream = new ReadableStream({
    async start(controller) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // 每行 JSON 数据
        const lines = buffer.split("\n");
        buffer = lines.pop(); // 留下不完整的一行
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
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
