export async function onRequestPost({ request, env }) {
  const { messages } = await request.json();

  const apiRes = await fetch("https://api.openrouter.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
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

  const stream = new ReadableStream({
    async start(controller) {
      const reader = apiRes.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop(); // 保留残余

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const dataStr = line.replace(/^data: /, "").trim();
          if (dataStr === "[DONE]") continue;

          try {
            const data = JSON.parse(dataStr);
            const text = data?.choices?.[0]?.delta?.content || "";
            if (text) controller.enqueue(new TextEncoder().encode(text));
          } catch(e) {}
        }
      }
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache"
    }
  });
}
