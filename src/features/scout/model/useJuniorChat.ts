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

// Transient failures (network drop, upstream OpenAI/MCP 5xx) are retried with
// backoff before the chat falls back to an explicit degraded state.
const TRANSIENT_RETRIES = 2;
const BACKOFF_MS = [600, 1800];

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function isTransient(err: unknown): boolean {
  if (!(err instanceof ApiError)) return false;
  if (err.isNetworkError) return true;
  return err.status !== undefined && err.status >= 500;
}

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
  if (!firstUserMsg) return "Untitled conversation";
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
  const [isUnavailable, setIsUnavailable] = useState(false);
  const retryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastFailedTextRef = useRef<string | null>(null);

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

  // Sends an already-appended user turn, retrying transient failures with
  // backoff and falling back to a degraded state instead of a bare toast.
  const runRequest = useCallback(async (trimmed: string) => {
    setIsLoading(true);
    setIsUnavailable(false);

    for (let attempt = 0; ; attempt++) {
      try {
        const response = await chatApi.sendMessage({
          message: trimmed,
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
        lastFailedTextRef.current = null;
        break;
      } catch (err) {
        if (err instanceof ApiError && err.status === 429) {
          const seconds = Number.isFinite(err.retryAfter) && (err.retryAfter ?? 0) > 0
            ? err.retryAfter!
            : 60;
          setRetryAfterSeconds(seconds);
          toast.warning(`Too many messages. Please wait ${seconds} seconds to continue.`);
          break;
        }

        if (isTransient(err)) {
          if (attempt < TRANSIENT_RETRIES) {
            await sleep(BACKOFF_MS[attempt] ?? 1800);
            continue;
          }
          // Retries exhausted: surface a degraded state the UI can render.
          lastFailedTextRef.current = trimmed;
          setIsUnavailable(true);
          break;
        }

        toast.error(extractErrorMessage(err as ApiError));
        break;
      }
    }

    setIsLoading(false);
  }, [lastResponseId]);

  const sendMessage = useCallback((text: string) => {
    if (!text.trim() || isLoading || retryAfterSeconds !== null) return;

    const trimmed = text.trim();
    const userMessage: JuniorChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    void runRequest(trimmed);
  }, [isLoading, retryAfterSeconds, runRequest]);

  // Re-runs the last failed turn (its user bubble is already in the thread).
  const retryLastMessage = useCallback(() => {
    const text = lastFailedTextRef.current;
    if (!text || isLoading) return;
    void runRequest(text);
  }, [isLoading, runRequest]);

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
    isUnavailable,
    sendMessage,
    retryLastMessage,
    startNewConversation,
    loadConversation,
    deleteConversation,
  };
}
