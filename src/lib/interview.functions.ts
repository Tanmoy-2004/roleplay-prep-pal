import { createServerFn } from "@tanstack/react-start";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.6-flash";

export type Role = "sde-intern" | "data-analyst" | "frontend-developer";

const ROLE_LABELS: Record<Role, string> = {
  "sde-intern": "Software Development Engineer Intern",
  "data-analyst": "Data Analyst",
  "frontend-developer": "Frontend Developer",
};

async function callGateway(body: unknown): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI gateway error ${res.status}: ${text}`);
  }
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return json.choices?.[0]?.message?.content ?? "";
}

function extractJson<T>(text: string): T {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  return JSON.parse(cleaned) as T;
}

export const generateQuestions = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    const d = data as { role: Role };
    if (!d.role) throw new Error("role is required");
    return d;
  })
  .handler(async ({ data }): Promise<{ questions: string[] }> => {
    const roleLabel = ROLE_LABELS[data.role];
    const content = await callGateway({
      model: MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are an experienced technical interviewer. Generate concise, high-signal interview questions. Respond ONLY with valid JSON.",
        },
        {
          role: "user",
          content: `Generate 5 mock interview questions for a ${roleLabel} candidate. Mix behavioral, technical fundamentals, and one applied problem. Keep each question under 2 sentences.\n\nRespond as JSON: { "questions": ["...", "...", "...", "...", "..."] }`,
        },
      ],
      temperature: 0.7,
    });
    const parsed = extractJson<{ questions: string[] }>(content);
    return { questions: parsed.questions.slice(0, 5) };
  });

export const gradeInterview = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => {
    const d = data as {
      role: Role;
      qa: Array<{ question: string; answer: string; timeSeconds: number }>;
    };
    if (!d.role || !Array.isArray(d.qa)) throw new Error("invalid input");
    return d;
  })
  .handler(
    async ({
      data,
    }): Promise<{
      overallScore: number;
      strengths: string[];
      weaknesses: string[];
      perQuestion: Array<{ score: number; feedback: string; modelAnswer: string }>;
    }> => {
      const roleLabel = ROLE_LABELS[data.role];
      const payload = data.qa
        .map(
          (x, i) =>
            `Q${i + 1} (${x.timeSeconds}s): ${x.question}\nAnswer: ${x.answer || "(no answer)"}`,
        )
        .join("\n\n");

      const content = await callGateway({
        model: MODEL,
        messages: [
          {
            role: "system",
            content:
              "You are a fair, rigorous technical interview evaluator. Respond ONLY with valid JSON, no prose.",
          },
          {
            role: "user",
            content: `Evaluate this mock interview for a ${roleLabel} candidate. For each answer: score 0-10, one-sentence feedback, and a concise ideal model answer (2-4 sentences). Then produce overall score (0-100), 2-3 strengths, and 2-3 weaknesses.\n\n${payload}\n\nRespond as JSON:\n{\n  "overallScore": number,\n  "strengths": ["..."],\n  "weaknesses": ["..."],\n  "perQuestion": [{ "score": number, "feedback": "...", "modelAnswer": "..." }]\n}`,
          },
        ],
        temperature: 0.4,
      });
      return extractJson(content);
    },
  );
