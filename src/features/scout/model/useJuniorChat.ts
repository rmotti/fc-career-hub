import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import {
  chatApi,
  ApiError,
  extractErrorMessage,
  type ChatConversation,
  type ChatHistoryMessage,
} from "@/shared/api/client";

export interface JuniorChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

// Re-exported so the UI can type the conversation list it renders.
export type { ChatConversation };

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

function isNotFound(err: unknown): boolean {
  return err instanceof ApiError && err.status === 404;
}

// First user message, trimmed to a short title used at conversation creation
// (the API only accepts `title` on create for now).
function deriveTitle(text: string): string {
  return text.length > 45 ? text.slice(0, 42) + "…" : text;
}

function toMessage(m: ChatHistoryMessage): JuniorChatMessage {
  return {
    id: m.id,
    role: m.role,
    content: m.content,
    timestamp: Date.parse(m.createdAt) || Date.now(),
  };
}

// Server-side persisted chat. The source of truth is the API (per user/save via
// the session cookie), which enables roaming across devices; nothing is kept in
// localStorage anymore.
export function useJuniorChat(saveId: string | null | undefined) {
  const [messages, setMessages] = useState<JuniorChatMessage[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | null>(null);
  const [isUnavailable, setIsUnavailable] = useState(false);
  const retryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastFailedTextRef = useRef<string | null>(null);
  // Tracks the selected conversation inside async callbacks without re-creating
  // them on every selection change.
  const conversationIdRef = useRef<string | null>(null);
  conversationIdRef.current = conversationId;

  const loadConversations = useCallback(async () => {
    setIsHistoryLoading(true);
    try {
      const list = await chatApi.listConversations(saveId);
      setConversations(list);
    } catch {
      // Non-fatal: the thread still works; the history list just stays empty.
      setConversations([]);
    } finally {
      setIsHistoryLoading(false);
    }
  }, [saveId]);

  // Load the conversation list when the chat opens or the save changes, and
  // reset the active thread to "no selection".
  useEffect(() => {
    setMessages([]);
    setConversationId(null);
    void loadConversations();
  }, [loadConversations]);

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

  // A 404 means the conversation no longer exists (or isn't ours): drop the
  // selection and reload the list.
  const handleNotFound = useCallback(() => {
    setConversationId(null);
    setMessages([]);
    toast.warning("This conversation is no longer available.");
    void loadConversations();
  }, [loadConversations]);

  // Posts a turn against `convId`, retrying transient failures with backoff and
  // falling back to a degraded state instead of a bare toast.
  const runRequest = useCallback(async (trimmed: string, convId: string) => {
    setIsLoading(true);
    setIsUnavailable(false);

    for (let attempt = 0; ; attempt++) {
      try {
        const response = await chatApi.sendMessage({ message: trimmed, conversationId: convId });

        const assistantMessage: JuniorChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: response.reply,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        lastFailedTextRef.current = null;
        // Bump the conversation to the top of the list (updatedAt changed).
        void loadConversations();
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

        if (isNotFound(err)) {
          handleNotFound();
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
  }, [loadConversations, handleNotFound]);

  // Resolves the active conversation, creating one (tied to the current save)
  // on the first message. Returns null if creation failed.
  const ensureConversation = useCallback(async (firstText: string): Promise<string | null> => {
    if (conversationIdRef.current) return conversationIdRef.current;
    try {
      const conversation = await chatApi.createConversation({
        title: deriveTitle(firstText),
        ...(saveId ? { saveId } : {}),
      });
      setConversationId(conversation.id);
      setConversations((prev) => [conversation, ...prev]);
      return conversation.id;
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        const seconds = Number.isFinite(err.retryAfter) && (err.retryAfter ?? 0) > 0
          ? err.retryAfter!
          : 60;
        setRetryAfterSeconds(seconds);
        toast.warning(`Too many messages. Please wait ${seconds} seconds to continue.`);
        return null;
      }
      lastFailedTextRef.current = firstText;
      setIsUnavailable(true);
      return null;
    }
  }, [saveId]);

  const submit = useCallback(async (trimmed: string) => {
    setIsLoading(true);
    const convId = await ensureConversation(trimmed);
    if (!convId) {
      setIsLoading(false);
      return;
    }
    await runRequest(trimmed, convId);
  }, [ensureConversation, runRequest]);

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
    void submit(trimmed);
  }, [isLoading, retryAfterSeconds, submit]);

  // Re-runs the last failed turn (its user bubble is already in the thread).
  const retryLastMessage = useCallback(() => {
    const text = lastFailedTextRef.current;
    if (!text || isLoading) return;
    void submit(text);
  }, [isLoading, submit]);

  // Clears the active thread; the next message starts a fresh conversation.
  // Persisted history is untouched (the server already saved everything).
  const startNewConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setIsUnavailable(false);
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    setConversationId(id);
    setMessages([]);
    setIsUnavailable(false);
    try {
      const history = await chatApi.listMessages(id);
      setMessages(history.map(toMessage));
    } catch (err) {
      if (isNotFound(err)) {
        handleNotFound();
        return;
      }
      toast.error(extractErrorMessage(err as ApiError));
    }
  }, [handleNotFound]);

  const deleteConversation = useCallback(async (id: string) => {
    try {
      await chatApi.deleteConversation(id);
    } catch (err) {
      if (!isNotFound(err)) {
        toast.error(extractErrorMessage(err as ApiError));
        return;
      }
      // 404: already gone — fall through and drop it from the list.
    }
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (conversationIdRef.current === id) {
      setConversationId(null);
      setMessages([]);
    }
  }, []);

  return {
    messages,
    history: conversations,
    activeConversationId: conversationId,
    isLoading,
    isHistoryLoading,
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
