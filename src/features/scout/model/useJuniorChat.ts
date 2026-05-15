import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { chatApi, ApiError, extractErrorMessage } from "@/shared/api/client";

export interface JuniorChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface ConversationEntry {
  id: string;
  title: string;
  messages: JuniorChatMessage[];
  lastResponseId: string | null;
  createdAt: number;
}

interface CurrentChatState {
  messages: JuniorChatMessage[];
  lastResponseId: string | null;
}

const MAX_HISTORY = 20;

function getCurrentKey(userId: string) {
  return `junior-chat:${userId}`;
}

function getHistoryKey(userId: string) {
  return `junior-chat-history:${userId}`;
}

function loadCurrentState(userId: string): CurrentChatState {
  try {
    const raw = localStorage.getItem(getCurrentKey(userId));
    if (raw) return JSON.parse(raw) as CurrentChatState;
  } catch {
    // ignore malformed storage
  }
  return { messages: [], lastResponseId: null };
}

function saveCurrentState(userId: string, state: CurrentChatState) {
  try {
    localStorage.setItem(getCurrentKey(userId), JSON.stringify(state));
  } catch {
    // ignore storage quota errors
  }
}

function clearCurrentState(userId: string) {
  localStorage.removeItem(getCurrentKey(userId));
}

function loadHistory(userId: string): ConversationEntry[] {
  try {
    const raw = localStorage.getItem(getHistoryKey(userId));
    if (raw) return JSON.parse(raw) as ConversationEntry[];
  } catch {
    // ignore malformed storage
  }
  return [];
}

function saveHistory(userId: string, history: ConversationEntry[]) {
  try {
    localStorage.setItem(getHistoryKey(userId), JSON.stringify(history));
  } catch {
    // ignore storage quota errors
  }
}

function deriveTitle(messages: JuniorChatMessage[]): string {
  const firstUserMsg = messages.find((m) => m.role === "user");
  if (!firstUserMsg) return "Conversa sem título";
  return firstUserMsg.content.length > 45
    ? firstUserMsg.content.slice(0, 42) + "…"
    : firstUserMsg.content;
}

export function useJuniorChat(userId: string | undefined) {
  const [messages, setMessages] = useState<JuniorChatMessage[]>([]);
  const [lastResponseId, setLastResponseId] = useState<string | null>(null);
  const [history, setHistory] = useState<ConversationEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!userId) return;
    const state = loadCurrentState(userId);
    setMessages(state.messages);
    setLastResponseId(state.lastResponseId);
    setHistory(loadHistory(userId));
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    saveCurrentState(userId, { messages, lastResponseId });
  }, [userId, messages, lastResponseId]);

  useEffect(() => {
    if (retryAfterSeconds === null || retryAfterSeconds <= 0) {
      if (retryTimerRef.current) {
        clearInterval(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      if (retryAfterSeconds !== null) setRetryAfterSeconds(null);
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

  const startNewConversation = useCallback((currentMessages: JuniorChatMessage[], currentResponseId: string | null) => {
    if (!userId) return;

    if (currentMessages.length > 0) {
      const entry: ConversationEntry = {
        id: crypto.randomUUID(),
        title: deriveTitle(currentMessages),
        messages: currentMessages,
        lastResponseId: currentResponseId,
        createdAt: Date.now(),
      };
      setHistory((prev) => {
        const next = [entry, ...prev].slice(0, MAX_HISTORY);
        saveHistory(userId, next);
        return next;
      });
    }

    setMessages([]);
    setLastResponseId(null);
    clearCurrentState(userId);
  }, [userId]);

  const loadConversation = useCallback((entry: ConversationEntry, currentMessages: JuniorChatMessage[], currentResponseId: string | null) => {
    if (!userId) return;

    if (currentMessages.length > 0) {
      const currentEntry: ConversationEntry = {
        id: crypto.randomUUID(),
        title: deriveTitle(currentMessages),
        messages: currentMessages,
        lastResponseId: currentResponseId,
        createdAt: Date.now(),
      };
      setHistory((prev) => {
        const next = [currentEntry, ...prev.filter((h) => h.id !== entry.id)].slice(0, MAX_HISTORY);
        saveHistory(userId, next);
        return next;
      });
    } else {
      setHistory((prev) => {
        const next = prev.filter((h) => h.id !== entry.id);
        saveHistory(userId, next);
        return next;
      });
    }

    setMessages(entry.messages);
    setLastResponseId(entry.lastResponseId);
  }, [userId]);

  const deleteConversation = useCallback((entryId: string) => {
    if (!userId) return;
    setHistory((prev) => {
      const next = prev.filter((h) => h.id !== entryId);
      saveHistory(userId, next);
      return next;
    });
  }, [userId]);

  return {
    messages,
    lastResponseId,
    history,
    isLoading,
    isRateLimited: retryAfterSeconds !== null && retryAfterSeconds > 0,
    retryAfterSeconds,
    sendMessage,
    startNewConversation,
    loadConversation,
    deleteConversation,
  };
}
