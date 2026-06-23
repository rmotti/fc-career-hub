import { useState, useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
  // Grounded next-action chips returned alongside an assistant reply. Only set
  // on assistant messages; empty/undefined renders nothing.
  suggestions?: string[];
}

// Junior can now perform write actions (shortlist add/remove, create saved
// searches) on the user's behalf mid-chat, so client caches for those lists may
// be stale once a turn completes. Use streaming when available for incremental
// UX; falls back to the blocking request otherwise.
const USE_STREAMING = true;

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
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<JuniorChatMessage[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  // Distinct from `isLoading`: set while the (now slower) conversation-create
  // call runs, so the UI can show "Junior is getting up to speed…".
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | null>(null);
  const [isUnavailable, setIsUnavailable] = useState(false);
  const retryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastFailedTextRef = useRef<string | null>(null);
  // Tracks the selected conversation inside async callbacks without re-creating
  // them on every selection change.
  const conversationIdRef = useRef<string | null>(null);
  conversationIdRef.current = conversationId;

  // A completed chat turn (or an opening message generated at creation) may
  // have mutated the shortlist / saved searches server-side. Bust those React
  // Query caches so the dedicated Scout sections reflect Junior's writes. Keys
  // mirror useShortlist / useSavedSearches: ["shortlist", saveId] /
  // ["saved-searches", saveId].
  const invalidateAssistantWritableData = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["shortlist", saveId] });
    queryClient.invalidateQueries({ queryKey: ["saved-searches", saveId] });
  }, [queryClient, saveId]);

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

  // Maps a thrown error to the right degraded state (rate-limit, not-found,
  // transient, or a toast). Returns "retry" when a transient error should be
  // retried by the caller, "stop" otherwise. Shared by both the streaming and
  // non-streaming turn paths.
  const handleTurnError = useCallback(
    (err: unknown, trimmed: string, attempt: number): "retry" | "stop" => {
      const status = err instanceof ApiError ? err.status : (err as { status?: number })?.status;
      const retryAfter =
        err instanceof ApiError ? err.retryAfter : (err as { retryAfter?: number })?.retryAfter;

      if (status === 429) {
        const seconds = Number.isFinite(retryAfter) && (retryAfter ?? 0) > 0 ? retryAfter! : 60;
        setRetryAfterSeconds(seconds);
        toast.warning(`Too many messages. Please wait ${seconds} seconds to continue.`);
        return "stop";
      }

      if (status === 404) {
        handleNotFound();
        return "stop";
      }

      const transient =
        isTransient(err) || (typeof status === "number" && status >= 500);
      if (transient) {
        if (attempt < TRANSIENT_RETRIES) return "retry";
        lastFailedTextRef.current = trimmed;
        setIsUnavailable(true);
        return "stop";
      }

      toast.error(extractErrorMessage(err));
      return "stop";
    },
    [handleNotFound],
  );

  // Streams a turn over SSE, rendering delta text into a placeholder assistant
  // bubble and finalizing with the responseId + suggestions on `done`. Returns
  // false if streaming wasn't attempted/usable so the caller can fall back.
  const runStreamingRequest = useCallback(
    async (trimmed: string, convId: string): Promise<boolean> => {
      const assistantId = crypto.randomUUID();
      let createdBubble = false;
      let streamErrored = false;

      // Append (once) and update the live assistant bubble as deltas arrive.
      const appendDelta = (text: string) => {
        setMessages((prev) => {
          if (!createdBubble) {
            createdBubble = true;
            return [
              ...prev,
              { id: assistantId, role: "assistant", content: text, timestamp: Date.now() } as JuniorChatMessage,
            ];
          }
          return prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + text } : m));
        });
      };

      try {
        await chatApi.streamMessage(
          { message: trimmed, conversationId: convId },
          {
            onDelta: appendDelta,
            onDone: ({ suggestions }) => {
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, suggestions } : m)),
              );
            },
            onError: (message) => {
              streamErrored = true;
              toast.error(message || "Junior ran into a problem. Please try again.");
            },
          },
        );

        if (streamErrored) {
          // The stream opened but the server signalled a mid-stream error. If no
          // text landed, drop the empty bubble and mark the turn degraded.
          if (!createdBubble) {
            lastFailedTextRef.current = trimmed;
            setIsUnavailable(true);
          }
          return true;
        }

        lastFailedTextRef.current = null;
        // Junior may have mutated shortlist / saved searches this turn.
        invalidateAssistantWritableData();
        // Bump the conversation to the top (updatedAt changed).
        void loadConversations();
        return true;
      } catch (err) {
        // Network/HTTP failure before/while opening the stream. Drop any partial
        // bubble, then reuse the shared error mapping (no retry loop here — fall
        // through to the non-streaming path which has its own backoff).
        if (createdBubble) {
          setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        }
        const status = err instanceof ApiError ? err.status : (err as { status?: number })?.status;
        // Rate-limit / not-found are terminal regardless of transport.
        if (status === 429 || status === 404) {
          handleTurnError(err, trimmed, TRANSIENT_RETRIES);
          return true;
        }
        return false; // signal: try the non-streaming fallback
      }
    },
    [invalidateAssistantWritableData, loadConversations, handleTurnError],
  );

  // Posts a turn against `convId`, retrying transient failures with backoff and
  // falling back to a degraded state instead of a bare toast.
  const runNonStreamingRequest = useCallback(
    async (trimmed: string, convId: string) => {
      for (let attempt = 0; ; attempt++) {
        try {
          const response = await chatApi.sendMessage({ message: trimmed, conversationId: convId });

          const assistantMessage: JuniorChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: response.reply,
            timestamp: Date.now(),
            suggestions: Array.isArray(response.suggestions) ? response.suggestions : [],
          };

          setMessages((prev) => [...prev, assistantMessage]);
          lastFailedTextRef.current = null;
          // Junior may have mutated shortlist / saved searches this turn.
          invalidateAssistantWritableData();
          // Bump the conversation to the top of the list (updatedAt changed).
          void loadConversations();
          break;
        } catch (err) {
          if (handleTurnError(err, trimmed, attempt) === "retry") {
            await sleep(BACKOFF_MS[attempt] ?? 1800);
            continue;
          }
          break;
        }
      }
    },
    [loadConversations, handleTurnError, invalidateAssistantWritableData],
  );

  const runRequest = useCallback(
    async (trimmed: string, convId: string) => {
      setIsLoading(true);
      setIsUnavailable(false);

      // Prefer streaming; on any "stream unusable" signal, fall back so we never
      // regress the working non-streaming flow.
      const streamed = USE_STREAMING && (await runStreamingRequest(trimmed, convId));
      if (!streamed) {
        await runNonStreamingRequest(trimmed, convId);
      }

      setIsLoading(false);
    },
    [runStreamingRequest, runNonStreamingRequest],
  );

  // Resolves the active conversation, creating one (tied to the current save)
  // on the first message. Returns null if creation failed. Creation is now
  // slower (the server generates a proactive opening message when a saveId is
  // present), so we surface a dedicated loading flag.
  const ensureConversation = useCallback(async (firstText: string): Promise<string | null> => {
    if (conversationIdRef.current) return conversationIdRef.current;
    setIsCreatingConversation(true);
    try {
      const conversation = await chatApi.createConversation({
        title: deriveTitle(firstText),
        ...(saveId ? { saveId } : {}),
      });
      setConversationId(conversation.id);
      setConversations((prev) => [conversation, ...prev]);
      // ANTI-DUPLICATION: the proactive opening message is the single source
      // here. It's also persisted (appears first in GET .../messages), but a
      // brand-new conversation never refetches its message list, so rendering
      // it from the create response is the only path — no double render.
      if (conversation.openingMessage?.content) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: conversation.openingMessage!.content,
            timestamp: Date.now(),
          },
        ]);
      }
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
    } finally {
      setIsCreatingConversation(false);
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
    isCreatingConversation,
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
