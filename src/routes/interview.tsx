import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { Clock, Send, Loader2, Sparkles, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
  loadRole,
  saveFinalSummary,
  SUMMARY_MARKER,
} from "@/lib/interview-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/interview")({
  head: () => ({
    meta: [
      { title: "Interview in progress — InterviewPilot" },
      { name: "description", content: "Timed AI mock interview session." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InterviewPage,
});

const TIME_PER_Q = 90;

function messageText(m: UIMessage): string {
  return m.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("");
}

function InterviewPage() {
  const navigate = useNavigate();
  const [roleInfo, setRoleInfo] = useState<{ role: string; label: string } | null>(null);

  useEffect(() => {
    const info = loadRole();
    if (!info) navigate({ to: "/" });
    else setRoleInfo(info);
  }, [navigate]);

  if (!roleInfo) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return <InterviewChat role={roleInfo.role} label={roleInfo.label} />;
}

function InterviewChat({ role, label }: { role: string; label: string }) {
  const navigate = useNavigate();
  const transport = useMemo(
    () => new DefaultChatTransport({ api: "/api/chat", body: { role } }),
    [role],
  );

  const { messages, sendMessage, status, error } = useChat({ transport });

  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q);
  const [questionNum, setQuestionNum] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  // Kick off the interview once.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void sendMessage({ text: "I'm ready to begin." });
  }, [sendMessage]);

  const lastAssistant = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") return messageText(messages[i]);
    }
    return "";
  }, [messages]);

  const isFinished = lastAssistant.includes(SUMMARY_MARKER);

  // Track question number from the assistant text; reset timer on advance.
  useEffect(() => {
    const match = lastAssistant.match(/Question\s+(\d+)\s+of\s+5/i);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n !== questionNum) {
        setQuestionNum(n);
        setTimeLeft(TIME_PER_Q);
      }
    }
  }, [lastAssistant, questionNum]);

  // Timer tick.
  useEffect(() => {
    if (isFinished || status === "streaming" || status === "submitted") return;
    const t = setInterval(() => setTimeLeft((v) => (v > 0 ? v - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [status, isFinished, questionNum]);

  // Auto-scroll.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  // On finish, persist summary and offer report.
  useEffect(() => {
    if (isFinished && status === "ready") {
      saveFinalSummary(lastAssistant);
    }
  }, [isFinished, status, lastAssistant]);

  const busy = status === "streaming" || status === "submitted";

  const send = async () => {
    const text = input.trim();
    if (!text || busy || isFinished) return;
    setInput("");
    await sendMessage({ text });
  };

  const progress = Math.min(100, Math.round(((questionNum - 1) / 5) * 100));
  const timePct = (timeLeft / TIME_PER_Q) * 100;
  const timeUrgent = timeLeft <= 15 && !isFinished;

  const visibleMessages = messages.filter(
    (m) => !(m.role === "user" && messages.indexOf(m) === 0),
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/60 bg-card/50 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
              <span className="font-display text-xs font-bold">IP</span>
            </div>
            <span className="font-display font-semibold">InterviewPilot</span>
            <span className="text-sm text-muted-foreground">· {label}</span>
          </div>
          <div className="text-sm font-medium text-muted-foreground">
            Question <span className="text-foreground">{Math.min(questionNum, 5)}</span> / 5
          </div>
        </div>
        <div className="h-1 w-full bg-secondary">
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{ width: `${isFinished ? 100 : progress}%` }}
          />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6">
        {!isFinished && (
          <div className="mb-4 rounded-lg border border-border bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Clock
                  className={cn(
                    "h-4 w-4",
                    timeUrgent ? "text-destructive" : "text-muted-foreground",
                  )}
                />
                <span className={timeUrgent ? "text-destructive" : "text-foreground"}>
                  {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
                </span>
                <span className="text-muted-foreground">remaining</span>
              </div>
              {timeLeft === 0 && (
                <span className="text-xs font-medium text-destructive">
                  Time's up — submit your answer
                </span>
              )}
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={cn(
                  "h-full transition-all",
                  timeUrgent ? "bg-destructive" : "bg-accent",
                )}
                style={{ width: `${timePct}%` }}
              />
            </div>
          </div>
        )}

        <div
          ref={scrollRef}
          className="flex-1 space-y-4 overflow-y-auto rounded-lg border border-border bg-card p-6"
        >
          {visibleMessages.map((m) => {
            const text = messageText(m);
            const isFinal = m.role === "assistant" && text.includes(SUMMARY_MARKER);
            return (
              <div
                key={m.id}
                className={cn(
                  "flex gap-3",
                  m.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                {m.role === "assistant" && (
                  <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                    <Sparkles className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    m.role === "assistant"
                      ? "rounded-tl-sm bg-secondary text-secondary-foreground"
                      : "rounded-tr-sm bg-primary text-primary-foreground",
                    isFinal && "max-w-full",
                  )}
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none prose-headings:font-display prose-headings:text-primary prose-strong:text-foreground prose-p:my-2 prose-ul:my-2 prose-li:my-0.5">
                      <ReactMarkdown>{text}</ReactMarkdown>
                    </div>
                  ) : (
                    <span className="whitespace-pre-wrap">{text}</span>
                  )}
                </div>
              </div>
            );
          })}
          {busy && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Interviewer is thinking…</span>
            </div>
          )}
          {error && (
            <p className="text-sm text-destructive">
              Something went wrong: {error.message}
            </p>
          )}
        </div>

        {isFinished ? (
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => navigate({ to: "/report" })}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              <FileText className="h-4 w-4" /> View full report
            </button>
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-border bg-card p-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={busy}
              placeholder="Type your answer…"
              rows={3}
              className="w-full resize-none bg-transparent px-2 py-1 text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-50"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
              <span className="text-xs text-muted-foreground">⌘/Ctrl + Enter to submit</span>
              <button
                onClick={() => void send()}
                disabled={busy || !input.trim()}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
              >
                Send answer <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
