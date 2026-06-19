import { request } from "../http";

export interface ChatMessageResponse {
  reply: string;
  responseId: string;
}

// A persisted conversation (server is now the source of truth, scoped per
// user/save via the session cookie). `title`/`saveId` may be null.
export interface ChatConversation {
  id: string;
  title: string | null;
  saveId: string | null;
  createdAt: string;
  updatedAt: string;
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
};
