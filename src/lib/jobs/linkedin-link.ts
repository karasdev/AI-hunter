import type { SearchPreferences } from "@/lib/types";

const DEFAULT_KW = "developer";

/**
 * Public job search on LinkedIn is limited for third-party products.
 * We return a pre-filled search URL; bulk listing in-app is avoided for TOS/fragility.
 */
export function buildGoogleLinkedInJobsUrl(rawKeywords: string) {
  const k = rawKeywords
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const q = ["site:linkedin.com/jobs", ...k].filter(Boolean).join(" ");
  return {
    url: `https://www.google.com/search?q=${encodeURIComponent(q).slice(0, 2000)}`,
    label: "Search LinkedIn jobs (via Google site search)",
  };
}

export function buildLinkedInJobsUrl(prefs: SearchPreferences) {
  const k = (prefs.keywords || DEFAULT_KW).split(/[,\n]+/)[0]?.trim() || DEFAULT_KW;
  const t = new URL("https://www.linkedin.com/jobs/search/");
  t.searchParams.set("keywords", k);
  t.searchParams.set("origin", "job_search");
  t.searchParams.set("position", "1");
  t.searchParams.set("pageNum", "0");
  return { url: t.toString(), label: "Open LinkedIn Jobs" };
}
