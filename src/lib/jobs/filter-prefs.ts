import type { SearchPreferences, UnifiedJob } from "@/lib/types";
import { normalizeText } from "./sources/shared";

function countryFuzzy(job: UnifiedJob, want: string): boolean {
  if (!want) return true;
  const a = normalizeText(want);
  const hay = normalizeText(
    [job.location, job.rawCountryHint, job.title, job.description].filter(Boolean).join(" ")
  );
  if (a.length <= 3) {
    return hay.includes(a) || new RegExp(`\\b${escapeRe(a)}\\b`, "i").test(hay);
  }
  return a
    .split(/[\s,]+/)
    .filter((p) => p.length > 2)
    .some((p) => hay.includes(p));
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function workTypeFits(prefs: SearchPreferences["workType"], job: UnifiedJob["workType"]) {
  if (prefs === "any" || job === "any") return true;
  return prefs === job;
}

function workArrFits(
  want: SearchPreferences["workArrangement"],
  j: UnifiedJob
): boolean {
  if (want === "any") return true;
  if (want === j.workArrangement) return true;
  const t = (j: UnifiedJob) => `${j.location} ${j.title} ${j.description}`.toLowerCase();
  if (want === "remote" && t(j).includes("remote")) return true;
  if (want === "hybrid" && (t(j).includes("hybrid") || t(j).includes("remote"))) return true;
  if (want === "onsite" && (j.workArrangement === "hybrid" || t(j).includes("onsite") || t(j).includes("on-site")))
    return true;
  return false;
}

/**
 * If job has a salary, top end must be at or above the user's floor (with small tolerance).
 * Jobs without salary data are kept.
 */
function salaryFits(prefs: SearchPreferences, j: UnifiedJob) {
  const minAnnual = prefs.salaryMinAnnual;
  if (!minAnnual) return true;
  if (j.salaryMax == null && j.salaryMin == null) return true;
  const top = j.salaryMax ?? j.salaryMin;
  if (top == null) return true;
  if (top >= minAnnual) return true;
  if (top * 1.2 >= minAnnual) return true;
  return false;
}

export function filterByPreferences(
  jobs: UnifiedJob[],
  prefs: SearchPreferences
): UnifiedJob[] {
  return jobs.filter(
    (j) =>
      countryFuzzy(j, prefs.country) &&
      workTypeFits(prefs.workType, j.workType) &&
      workArrFits(prefs.workArrangement, j) &&
      salaryFits(prefs, j)
  );
}
