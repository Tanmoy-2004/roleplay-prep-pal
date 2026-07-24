import type { Role } from "./interview.functions";

const ROLE_KEY = "interviewpilot:role";
const FINAL_KEY = "interviewpilot:final";
const ROLE_LABEL_KEY = "interviewpilot:role-label";

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

export function saveRole(role: Role) {
  sessionStorage.setItem(ROLE_KEY, role);
  sessionStorage.setItem(ROLE_LABEL_KEY, ROLE_META[role].label);
}
export function loadRole(): { role: Role; label: string } | null {
  if (typeof window === "undefined") return null;
  const role = sessionStorage.getItem(ROLE_KEY) as Role | null;
  const label = sessionStorage.getItem(ROLE_LABEL_KEY);
  return role && label ? { role, label } : null;
}
export function saveFinalSummary(text: string) {
  sessionStorage.setItem(FINAL_KEY, text);
}
export function loadFinalSummary(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(FINAL_KEY);
}
export function clearAll() {
  sessionStorage.removeItem(ROLE_KEY);
  sessionStorage.removeItem(ROLE_LABEL_KEY);
  sessionStorage.removeItem(FINAL_KEY);
}

export const SUMMARY_MARKER = "Interview Summary";
