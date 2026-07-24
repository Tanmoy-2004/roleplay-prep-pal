import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Code2, LineChart, Monitor, Loader2, ArrowRight } from "lucide-react";
import { generateQuestions, type Role } from "@/lib/interview.functions";
import { ROLE_META, saveSession, clearAll } from "@/lib/interview-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  component: Landing,
});

const ROLES: Array<{ id: Role; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "sde-intern", icon: Code2 },
  { id: "data-analyst", icon: LineChart },
  { id: "frontend-developer", icon: Monitor },
];

function Landing() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      clearAll();
      const { questions } = await generateQuestions({ data: { role: selected } });
      saveSession({
        role: selected,
        roleLabel: ROLE_META[selected].label,
        questions,
        answers: new Array(questions.length).fill(""),
        timeSpent: new Array(questions.length).fill(0),
      });
      navigate({ to: "/interview" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start interview");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
              <span className="font-display text-lg font-bold">IP</span>
            </div>
            <span className="font-display text-lg font-semibold tracking-tight">
              InterviewPilot
            </span>
          </div>
          <span className="text-sm text-muted-foreground">AI mock interviews</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="max-w-3xl">
          <span className="inline-flex items-center rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
            Practice like it's the real thing
          </span>
          <h1 className="mt-5 font-display text-5xl font-semibold tracking-tight text-foreground md:text-6xl">
            Nail your next interview with an AI that actually pushes back.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Pick a role. Answer five timed questions. Get a scored report with model answers,
            strengths, and gaps to close.
          </p>
        </div>

        <section className="mt-14">
          <h2 className="font-display text-2xl font-semibold">Choose a role</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {ROLES.map(({ id, icon: Icon }) => {
              const meta = ROLE_META[id];
              const active = selected === id;
              return (
                <button
                  key={id}
                  onClick={() => setSelected(id)}
                  className={cn(
                    "group relative rounded-xl border bg-card p-6 text-left transition-all",
                    "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5",
                    active
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  <div
                    className={cn(
                      "grid h-11 w-11 place-items-center rounded-lg transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-primary",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display text-xl font-semibold">{meta.label}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{meta.blurb}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {meta.skills.map((s) => (
                      <span
                        key={s}
                        className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-10 flex items-center gap-4">
            <button
              disabled={!selected || loading}
              onClick={start}
              className={cn(
                "inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all",
                "hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Preparing questions…
                </>
              ) : (
                <>
                  Start interview <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
            {selected && !loading && (
              <span className="text-sm text-muted-foreground">
                5 questions · ~10 minutes · 90s per question
              </span>
            )}
          </div>
          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        </section>
      </main>
    </div>
  );
}
