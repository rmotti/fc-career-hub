import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";

export function ChatBubble({
  speaker,
  tone,
  children,
  markdown = false,
}: {
  speaker: string;
  tone: "assistant" | "user";
  children: ReactNode;
  markdown?: boolean;
}) {
  const isUser = tone === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[92%] rounded-md border px-3 py-2 ${
          isUser
            ? "border-primary/25 bg-primary/10 text-primary"
            : "border-border bg-background/45 text-foreground"
        }`}
      >
        <p className={`mb-1 text-[10px] uppercase tracking-[0.16em] ${isUser ? "text-primary/70" : "text-muted-foreground"}`}>
          {speaker}
        </p>
        {markdown && typeof children === "string" ? (
          <div className="prose prose-sm max-w-none text-sm leading-relaxed text-foreground [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-4 [&_li]:mb-0.5 [&_strong]:font-semibold [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs [&_table]:w-full [&_table]:text-xs [&_th]:border-b [&_th]:border-border [&_th]:pb-1 [&_th]:pr-3 [&_th]:text-left [&_th]:font-semibold [&_td]:border-b [&_td]:border-border/50 [&_td]:py-1 [&_td]:pr-3">
            <ReactMarkdown>{children}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm leading-relaxed">{children}</p>
        )}
      </div>
    </div>
  );
}
