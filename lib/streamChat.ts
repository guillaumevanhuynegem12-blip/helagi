import type { Role } from "./types";

export interface ApiMessage {
  role: Role;
  content: string;
}

// Calls the server route and yields text chunks as they stream back.
export async function* streamChat(
  messages: ApiMessage[],
): AsyncGenerator<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  if (!res.ok || !res.body) {
    let detail = `Request failed (${res.status}).`;
    try {
      const data = await res.json();
      if (data?.error) detail = data.error;
    } catch {
      // ignore — keep the generic message
    }
    throw new Error(detail);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    yield decoder.decode(value, { stream: true });
  }
}
