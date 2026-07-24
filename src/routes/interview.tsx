import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Clock, Send, Loader2, Sparkles } from "lucide-react";
import { gradeInterview } from "@/lib/interview.functions";
import {
  loadSession,
  saveSession,
  saveReport,
  type InterviewSession,
} from "@/lib/interview-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/interview")({
  component: InterviewPage,
});

const TIME_PER_Q = 90;

type Msg = { role: "ai" | "user"; text: string };

function InterviewPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(TIME_PER_Q);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef<number>(Date.now());

  useEffect(() => {
    const s = loadSession();
    if (!s) {
      navigate({ to: "/" });
      return;
    }
    setSession(s);
    setMessages([{ role: "ai", text: s.questions[0] }]);
    startedRef.current = Date.now();
  }, [navigate]);

  useEffect(() => {
    if (!session || grading) return;
    setTimeLeft(TIME_PER_Q);
    startedRef.current = Date.now();
    const t = setInterval(() => {
      setTimeLeft((v) => (v > 0 ? v - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [idx, session, grading]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, grading]);

  const progress = useMemo(() => {
    if (!session) return 0;
    return Math.round((idx / session.questions.length) * 100);
  }, [idx, session]);

  if (!session) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const total = session.questions.length;
  const isLast = idx === total - 1;
  const timePct = (timeLeft / TIME_PER_Q) * 100;
  const timeUrgent = timeLeft <= 15;

  const submitAnswer = async () => {
    const answer = input.trim();
    const elapsed = Math.min(TIME_PER_Q, Math.round((Date.now() - startedRef.current) / 1000));
    const newAnswers = [...session.answers];
    const newTimes = [...session.timeSpent];
    newAnswers[idx] = answer;
    newTimes[idx] = elapsed;
    const updated: InterviewSession = {
      ...session,
      answers: newAnswers,
      timeSpent: newTimes,
    };
    setSession(updated);
    saveSession(updated);

    setMessages((m) => [...m, { role: "user", text: answer || "(skipped)" }]);
    setInput("");

    if (isLast) {
      setGrading(true);
      setMessages((m) => [
        ...m,
        { role: "ai", text: "Great — reviewing your answers now…" },
      ]);
      try {
        const qa = updated.questions.map((q, i) => ({
          question: q,
          answer: updated.answers[i],
          timeSeconds: updated.timeSpent[i],
        }));
        const report = await gradeInterview({ data: { role: updated.role, qa } });
        saveReport(report);
        navigate({ to: "/report" });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to grade interview");
        setGrading(false);
      }
    } else {
      const next = idx + 1;
      setIdx(next);
      setMessages((m) => [...m, { role: "ai", text: updated.questions[next] }]);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/60 bg-card/50 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
                <span className="font-display text-xs font-bold">IP</span>
              </div>
              <span className="font-display font-semibold">InterviewPilot</span>
              <span className="text-sm text-muted-foreground">· {session.roleLabel}</span>
            </div>
          </div>
          <div className="text-sm font-medium text-muted-foreground">
            Question <span className="text-foreground">{idx + 1}</span> / {total}
          </div>
        </div>
        <div className="h-1 w-full bg-secondary">
          <div
            className="h-full bg-accent transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6">
        {/* Timer */}
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
                {Math.floor(timeLeft / 60)}:
                {String(timeLeft % 60).padStart(2, "0")}
              </span>
              <span className="text-muted-foreground">remaining</span>
            </div>
            {timeLeft === 0 && (
              <span className="text-xs font-medium text-destructive">Time's up — submit</span>
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

        {/* Chat */}
        <div
          ref={scrollRef}
          className="flex-1 space-y-4 overflow-y-auto rounded-lg border border-border bg-card p-6"
        >
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}
            >
              {m.role === "ai" && (
                <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Sparkles className="h-4 w-4" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  m.role === "ai"
                    ? "rounded-tl-sm bg-secondary text-secondary-foreground"
                    : "rounded-tr-sm bg-primary text-primary-foreground",
                )}
              >
                {m.text}
              </div>
            </div>
          ))}
          {grading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Scoring your interview…
            </div>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        {/* Input */}
        <div className="mt-4 rounded-lg border border-border bg-card p-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={grading}
            placeholder="Type your answer…"
            rows={3}
            className="w-full resize-none bg-transparent px-2 py-1 text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-50"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                submitAnswer();
              }
            }}
          />
          <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
            <span className="text-xs text-muted-foreground">
              ⌘/Ctrl + Enter to submit
            </span>
            <button
              onClick={submitAnswer}
              disabled={grading}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
            >
              {isLast ? "Finish" : "Next question"}
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
