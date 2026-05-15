import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { chatApi, ApiError, extractErrorMessage } from "@/shared/api/client";

export interface JuniorChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface PersistedChatState {
  messages: JuniorChatMessage[];
  lastResponseId: string | null;
}

function getStorageKey(userId: string) {
  return `junior-chat:${userId}`;
}

function loadChatState(userId: string): PersistedChatState {
  try {
    const raw = localStorage.getItem(getStorageKey(userId));
    if (raw) return JSON.parse(raw) as PersistedChatState;
  } catch {
    // ignore malformed storage
  }
  return { messages: [], lastResponseId: null };
}

function saveChatState(userId: string, state: PersistedChatState) {
  try {
    localStorage.setItem(getStorageKey(userId), JSON.stringify(state));
  } catch {
    // ignore storage quota errors
  }
}

function clearChatState(userId: string) {
  localStorage.removeItem(getStorageKey(userId));
}

export function useJuniorChat(userId: string | undefined) {
  const [messages, setMessages] = useState<JuniorChatMessage[]>([]);
  const [lastResponseId, setLastResponseId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!userId) return;
    const state = loadChatState(userId);
    setMessages(state.messages);
    setLastResponseId(state.lastResponseId);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    saveChatState(userId, { messages, lastResponseId });
  }, [userId, messages, lastResponseId]);

  useEffect(() => {
    if (retryAfterSeconds === null || retryAfterSeconds <= 0) {
      if (retryTimerRef.current) {
        clearInterval(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      if (retryAfterSeconds !== null) {
        setRetryAfterSeconds(null);
      }
      return;
    }

    retryTimerRef.current = setInterval(() => {
      setRetryAfterSeconds((prev) => {
        if (prev === null || prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (retryTimerRef.current) clearInterval(retryTimerRef.current);
    };
  }, [retryAfterSeconds]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading || retryAfterSeconds !== null) return;

    const userMessage: JuniorChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await chatApi.sendMessage({
        message: text.trim(),
        ...(lastResponseId ? { previousResponseId: lastResponseId } : {}),
      });

      const assistantMessage: JuniorChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.reply,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setLastResponseId(response.responseId);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 429) {
          const seconds = Number.isFinite(err.retryAfter) && (err.retryAfter ?? 0) > 0
            ? err.retryAfter!
            : 60;
          setRetryAfterSeconds(seconds);
          toast.warning(`Muitas mensagens. Aguarde ${seconds} segundos para continuar.`);
        } else if (err.status === 502) {
          toast.error("O Junior não respondeu. Tente novamente.", {
            action: { label: "Tentar de novo", onClick: () => void sendMessage(text) },
          });
        } else {
          toast.error(extractErrorMessage(err));
        }
      } else {
        toast.error("Erro de conexão. Verifique sua rede.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, retryAfterSeconds, lastResponseId]);

  const clearConversation = useCallback(() => {
    setMessages([]);
    setLastResponseId(null);
    if (userId) clearChatState(userId);
  }, [userId]);

  return {
    messages,
    isLoading,
    isRateLimited: retryAfterSeconds !== null && retryAfterSeconds > 0,
    retryAfterSeconds,
    sendMessage,
    clearConversation,
  };
}
