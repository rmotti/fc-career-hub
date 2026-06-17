import { request } from "../http";

export interface ChatMessageResponse {
  reply: string;
  responseId: string;
}

export const chatApi = {
  sendMessage: (data: { message: string; previousResponseId?: string }) =>
    request<ChatMessageResponse>("/chat/messages", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};
