import type { Role } from "./interview.functions";

export type InterviewSession = {
  role: Role;
  roleLabel: string;
  questions: string[];
  answers: string[];
  timeSpent: number[];
};

export type InterviewReport = {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  perQuestion: Array<{ score: number; feedback: string; modelAnswer: string }>;
};

const SESSION_KEY = "interviewpilot:session";
const REPORT_KEY = "interviewpilot:report";

export const ROLE_META: Record<Role, { label: string; blurb: string; skills: string[] }> = {
  "sde-intern": {
    label: "SDE Intern",
    blurb: "Foundations, data structures, and coding fundamentals.",
    skills: ["Algorithms", "OOP", "Problem solving"],
  },
  "data-analyst": {
    label: "Data Analyst",
    blurb: "SQL, statistics, and turning data into decisions.",
    skills: ["SQL", "Statistics", "Storytelling"],
  },
  "frontend-developer": {
    label: "Frontend Developer",
    blurb: "React, UX craft, and modern web fundamentals.",
    skills: ["React", "CSS", "Performance"],
  },
};

export function saveSession(s: InterviewSession) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
}
export function loadSession(): InterviewSession | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(SESSION_KEY);
  return raw ? (JSON.parse(raw) as InterviewSession) : null;
}
export function saveReport(r: InterviewReport) {
  sessionStorage.setItem(REPORT_KEY, JSON.stringify(r));
}
export function loadReport(): InterviewReport | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(REPORT_KEY);
  return raw ? (JSON.parse(raw) as InterviewReport) : null;
}
export function clearAll() {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(REPORT_KEY);
}
