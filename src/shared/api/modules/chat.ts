import { request, resolveBaseUrl, ensureCsrfTokenForStream, getCsrfToken } from "../http";

export interface ChatMessageResponse {
  reply: string;
  responseId: string;
  // Up to 3 short grounded next-action strings (e.g. "Scout centre-backs").
  // Additive field — may be absent on older responses or an empty array.
  suggestions?: string[];
}

// The proactive first assistant message the backend generates when a
// conversation is created with a saveId. Null when there's no saveId or
// generation failed.
export interface ChatOpeningMessage {
  role: "assistant";
  content: string;
}

// A persisted conversation (server is now the source of truth, scoped per
// user/save via the session cookie). `title`/`saveId` may be null.
export interface ChatConversation {
  id: string;
  title: string | null;
  saveId: string | null;
  createdAt: string;
  updatedAt: string;
  // Present on the POST /chat/conversations response when created with a
  // saveId. Absent/null otherwise. Not returned by the list endpoint.
  openingMessage?: ChatOpeningMessage | null;
}

// A streamed turn, surfaced incrementally by `chatApi.streamMessage`.
export interface ChatStreamCallbacks {
  onDelta: (text: string) => void;
  onDone: (data: { responseId: string; suggestions: string[] }) => void;
  onError: (message: string) => void;
}

// A persisted message, returned when rehydrating a conversation. Ordered by
// `createdAt` asc by the API.
export interface ChatHistoryMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  openaiResponseId: string | null;
  createdAt: string;
}

export const chatApi = {
  // Sending a turn. When `conversationId` is present the API persists the
  // user + assistant messages and derives the context itself (so
  // `previousResponseId` is ignored). Without it the turn is ephemeral.
  sendMessage: (data: { message: string; conversationId?: string; previousResponseId?: string }) =>
    request<ChatMessageResponse>("/chat/messages", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  listConversations: (saveId?: string | null) => {
    const qs = saveId ? `?saveId=${encodeURIComponent(saveId)}` : "";
    return request<ChatConversation[]>(`/chat/conversations${qs}`);
  },

  createConversation: (data: { title?: string; saveId?: string | null }) =>
    request<ChatConversation>("/chat/conversations", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  listMessages: (conversationId: string) =>
    request<ChatHistoryMessage[]>(`/chat/conversations/${conversationId}/messages`),

  deleteConversation: (conversationId: string) =>
    request<void>(`/chat/conversations/${conversationId}`, { method: "DELETE" }),

  // Streams a turn over Server-Sent Events. This is a POST, so EventSource
  // (GET-only) can't be used — we drive `fetch` + a manual SSE frame parser.
  // Same request body and auth (session cookie + CSRF header) as sendMessage.
  // Returns the fetch AbortController so callers can cancel an in-flight stream.
  streamMessage: async (
    data: { message: string; conversationId?: string; previousResponseId?: string },
    callbacks: ChatStreamCallbacks,
    signal?: AbortSignal,
  ): Promise<void> => {
    await ensureCsrfTokenForStream();
    const csrf = getCsrfToken();

    const res = await fetch(`${resolveBaseUrl()}/chat/messages/stream`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...(csrf ? { "X-CSRF-Token": csrf } : {}),
      },
      body: JSON.stringify(data),
      signal,
    });

    if (!res.ok || !res.body) {
      // Surface a structured error so the hook can map it to the same degraded
      // states (429/404/5xx) as the non-streaming path.
      const body = await res.json().catch(() => ({}));
      const err = new Error(body?.error || `HTTP ${res.status}`) as Error & {
        status?: number;
        retryAfter?: number;
      };
      err.status = res.status;
      if (res.status === 429) {
        err.retryAfter = parseInt(res.headers.get("Retry-After") ?? "60", 10);
      }
      throw err;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    // SSE frames are separated by a blank line ("\n\n"); each frame has an
    // `event:` line and a `data:` line. We buffer partial reads and only parse
    // complete frames.
    const parseFrame = (frame: string) => {
      let event = "message";
      const dataLines: string[] = [];
      for (const rawLine of frame.split("\n")) {
        const line = rawLine.trimEnd();
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
      }
      if (dataLines.length === 0) return;
      const raw = dataLines.join("\n");
      let payload: any;
      try {
        payload = JSON.parse(raw);
      } catch {
        return; // ignore malformed frames
      }
      if (event === "delta" && typeof payload.delta === "string") {
        callbacks.onDelta(payload.delta);
      } else if (event === "done") {
        callbacks.onDone({
          responseId: payload.responseId ?? "",
          suggestions: Array.isArray(payload.suggestions) ? payload.suggestions : [],
        });
      } else if (event === "error") {
        callbacks.onError(payload.message ?? "Stream error");
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let sep: number;
      while ((sep = buffer.indexOf("\n\n")) !== -1) {
        const frame = buffer.slice(0, sep);
        buffer = buffer.slice(sep + 2);
        if (frame.trim()) parseFrame(frame);
      }
    }
    // Flush any trailing frame without a terminating blank line.
    if (buffer.trim()) parseFrame(buffer);
  },
};
