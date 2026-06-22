import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, LockKeyhole, MessageSquareText, RotateCcw, Send, Trash2, WifiOff } from "lucide-react";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { useJuniorChat, type ChatConversation } from "@/features/scout/model/useJuniorChat";
import { ChatBubble } from "@/features/scout/ui/components/chat";

export function AssistantCoachSection({ saveId }: { saveId: string | null }) {
  const {
    messages: chatMessages,
    history: chatHistory,
    isLoading: isChatLoading,
    isRateLimited,
    retryAfterSeconds,
    isUnavailable: isChatUnavailable,
    sendMessage,
    retryLastMessage,
    startNewConversation,
    loadConversation,
    deleteConversation,
  } = useJuniorChat(saveId);

  const [chatInput, setChatInput] = useState("");
  const [showChatHistory, setShowChatHistory] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = chatScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chatMessages, isChatLoading]);

  return (
    <aside
      className="card-gamer flex flex-col overflow-hidden"
      style={{ height: "clamp(500px, calc(100vh - 220px), 860px)" }}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
            <Bot size={18} />
          </div>
          <div>
            <h3 className="font-display text-base font-bold leading-none">Junior</h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">Career Mode assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowChatHistory((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors ${
              showChatHistory
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border bg-background/45 text-muted-foreground hover:border-primary/25 hover:bg-primary/5 hover:text-primary"
            }`}
          >
            <MessageSquareText size={13} />
            History
            {chatHistory.length > 0 && (
              <span className="ml-0.5 rounded-full bg-primary/20 px-1.5 py-0 text-[10px] font-bold text-primary">
                {chatHistory.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => { startNewConversation(); setShowChatHistory(false); }}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background/45 px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/25 hover:bg-primary/5 hover:text-primary"
          >
            <RotateCcw size={13} />
            New
          </button>
        </div>
      </div>

      {showChatHistory ? (
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-2 p-4">
            {chatHistory.length === 0 ? (
              <div className="py-10 text-center">
                <MessageSquareText size={28} className="mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">No archived conversations</p>
                <p className="mt-1 text-xs text-muted-foreground/60">Start a new conversation and it will appear here.</p>
              </div>
            ) : (
              chatHistory.map((entry: ChatConversation) => (
                <div key={entry.id} className="rounded-md border border-border bg-background/30 p-3">
                  <p className="truncate text-sm font-semibold text-foreground">{entry.title ?? "Conversa sem título"}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {new Date(entry.updatedAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <div className="mt-2.5 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { void loadConversation(entry.id); setShowChatHistory(false); }}
                      className="inline-flex h-7 items-center gap-1.5 rounded-md border border-primary/25 bg-primary/10 px-2.5 text-xs font-semibold text-primary transition-colors hover:bg-primary/15"
                    >
                      <RotateCcw size={11} />
                      Continue
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteConversation(entry.id)}
                      className="inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-background/45 px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive/25 hover:bg-destructive/5 hover:text-destructive-text"
                    >
                      <Trash2 size={11} />
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      ) : (
        <>
          <div ref={chatScrollRef} className="min-h-0 flex-1 overflow-y-auto">
            <div
              role="log"
              aria-live="polite"
              aria-label="Conversation with Junior"
              className="flex flex-col gap-3 p-5"
            >
              {chatMessages.length === 0 && (
                <ChatBubble speaker="Junior" tone="assistant" markdown={false}>
                  Hi! I'm Junior, your Career Mode assistant. I can help with squad analysis, market recommendations, tactics and much more. What do you need?
                </ChatBubble>
              )}
              {chatMessages.map((msg) => (
                <ChatBubble
                  key={msg.id}
                  speaker={msg.role === "user" ? "You" : "Junior"}
                  tone={msg.role === "user" ? "user" : "assistant"}
                  markdown={msg.role === "assistant"}
                >
                  {msg.content}
                </ChatBubble>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[92%] rounded-md border border-border bg-background/45 px-3 py-2">
                    <p className="mb-1 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Junior</p>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Loader2 size={13} className="animate-spin" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 border-t border-border p-4">
            {isRateLimited && retryAfterSeconds !== null && retryAfterSeconds > 0 && (
              <div className="mb-3 flex items-center gap-2 rounded-md border border-warning/25 bg-warning/10 px-3 py-2 text-xs text-warning">
                <LockKeyhole size={13} />
                <span>Too many messages. Wait {retryAfterSeconds}s to continue.</span>
              </div>
            )}
            {isChatUnavailable && !isChatLoading && (
              <div className="mb-3 flex items-center gap-2 rounded-md border border-destructive/25 bg-destructive/10 px-3 py-2 text-xs text-destructive-text">
                <WifiOff size={13} className="shrink-0" />
                <span className="flex-1">Junior is unavailable right now. Check your connection and try again.</span>
                <button
                  type="button"
                  onClick={() => retryLastMessage()}
                  className="flex items-center gap-1 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1 font-semibold transition-colors hover:bg-destructive/20"
                >
                  <RotateCcw size={12} />
                  Try again
                </button>
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!chatInput.trim()) return;
                void sendMessage(chatInput);
                setChatInput("");
              }}
              className="flex items-end gap-2"
            >
              <label htmlFor="junior-chat-input" className="sr-only">
                Message to Junior
              </label>
              <textarea
                id="junior-chat-input"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!chatInput.trim()) return;
                    void sendMessage(chatInput);
                    setChatInput("");
                  }
                }}
                placeholder="Ask Junior… (Enter to send, Shift+Enter for new line)"
                disabled={isChatLoading || isRateLimited || isChatUnavailable}
                rows={2}
                className="min-w-0 flex-1 resize-none rounded-md border border-border bg-background/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-primary/40 disabled:cursor-not-allowed disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={isChatLoading || isRateLimited || isChatUnavailable || !chatInput.trim()}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                aria-label="Send message"
              >
                {isChatLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </form>
          </div>
        </>
      )}
    </aside>
  );
}
