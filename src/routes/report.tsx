import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { RotateCcw, Trophy } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { clearAll, loadFinalSummary, loadRole } from "@/lib/interview-store";

export const Route = createFileRoute("/report")({
  head: () => ({
    meta: [
      { title: "Your interview report — InterviewPilot" },
      { name: "description", content: "Scored report card from your mock interview." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ReportPage,
});

function ReportPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<string | null>(null);
  const [label, setLabel] = useState<string>("");

  useEffect(() => {
    const s = loadFinalSummary();
    const r = loadRole();
    if (!s) {
      navigate({ to: "/" });
      return;
    }
    setSummary(s);
    setLabel(r?.label ?? "");
  }, [navigate]);

  if (!summary) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <span className="font-display text-sm font-bold">IP</span>
            </div>
            <span className="font-display font-semibold">InterviewPilot</span>
          </Link>
          <button
            onClick={() => {
              clearAll();
              navigate({ to: "/" });
            }}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-secondary"
          >
            <RotateCcw className="h-3.5 w-3.5" /> New interview
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-navy-gradient text-primary-foreground">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Report card{label && ` · ${label}`}</p>
            <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
              Here's how you did.
            </h1>
          </div>
        </div>

        <article className="rounded-xl border border-border bg-card p-8 shadow-sm">
          <div className="prose prose-sm max-w-none md:prose-base prose-headings:font-display prose-headings:tracking-tight prose-headings:text-primary prose-strong:text-foreground prose-h3:mt-0 prose-h3:text-2xl prose-li:my-1">
            <ReactMarkdown>{summary}</ReactMarkdown>
          </div>
        </article>

        <div className="mt-10 flex justify-center">
          <button
            onClick={() => {
              clearAll();
              navigate({ to: "/" });
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <RotateCcw className="h-4 w-4" /> Try another role
          </button>
        </div>
      </main>
    </div>
  );
}
