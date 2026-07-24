import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, RotateCcw, Trophy, Lightbulb } from "lucide-react";
import {
  loadReport,
  loadSession,
  clearAll,
  type InterviewReport,
  type InterviewSession,
} from "@/lib/interview-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/report")({
  component: ReportPage,
});

function scoreColor(score: number) {
  if (score >= 8) return "text-success";
  if (score >= 5) return "text-warning";
  return "text-destructive";
}
function overallBand(s: number) {
  if (s >= 80) return { label: "Strong hire", color: "text-success" };
  if (s >= 60) return { label: "Promising", color: "text-accent" };
  if (s >= 40) return { label: "Needs work", color: "text-warning" };
  return { label: "Not ready yet", color: "text-destructive" };
}

function ReportPage() {
  const navigate = useNavigate();
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [session, setSession] = useState<InterviewSession | null>(null);

  useEffect(() => {
    const r = loadReport();
    const s = loadSession();
    if (!r || !s) {
      navigate({ to: "/" });
      return;
    }
    setReport(r);
    setSession(s);
  }, [navigate]);

  if (!report || !session) return null;

  const band = overallBand(report.overallScore);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
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

      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-sm text-muted-foreground">Report card · {session.roleLabel}</p>
        <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight md:text-5xl">
          Here's how you did.
        </h1>

        {/* Overall score */}
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-navy-gradient p-6 text-primary-foreground shadow-sm md:col-span-1">
            <div className="flex items-center gap-2 text-sm opacity-80">
              <Trophy className="h-4 w-4" /> Overall score
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="font-display text-6xl font-bold">{report.overallScore}</span>
              <span className="text-2xl opacity-70">/100</span>
            </div>
            <div className={cn("mt-2 text-sm font-medium", band.color, "brightness-150")}>
              {band.label}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 md:col-span-1">
            <div className="flex items-center gap-2 text-sm font-medium text-success">
              <CheckCircle2 className="h-4 w-4" /> Strengths
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              {report.strengths.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 md:col-span-1">
            <div className="flex items-center gap-2 text-sm font-medium text-warning">
              <AlertCircle className="h-4 w-4" /> Focus areas
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              {report.weaknesses.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-warning" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Per question */}
        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold">Question breakdown</h2>
          <div className="mt-4 space-y-4">
            {report.perQuestion.map((pq, i) => (
              <article
                key={i}
                className="overflow-hidden rounded-xl border border-border bg-card"
              >
                <div className="flex items-start justify-between gap-4 border-b border-border p-5">
                  <div className="flex-1">
                    <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Question {i + 1}
                    </div>
                    <p className="mt-1 font-medium text-foreground">
                      {session.questions[i]}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={cn("font-display text-3xl font-bold", scoreColor(pq.score))}>
                      {pq.score}
                    </div>
                    <div className="text-xs text-muted-foreground">/ 10</div>
                  </div>
                </div>

                <div className="grid gap-4 p-5 md:grid-cols-2">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Your answer
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                      {session.answers[i] || (
                        <span className="italic text-muted-foreground">(no answer)</span>
                      )}
                    </p>
                    <p className="mt-3 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Feedback: </span>
                      {pq.feedback}
                    </p>
                  </div>
                  <div className="rounded-lg bg-secondary p-4">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                      <Lightbulb className="h-3.5 w-3.5" /> Model answer
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-secondary-foreground">
                      {pq.modelAnswer}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <div className="mt-12 flex justify-center">
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
