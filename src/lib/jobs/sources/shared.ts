import type { WorkType } from "@/lib/types";

export function guessWorkType(
  jobType: string | undefined,
  title: string,
  description: string
): WorkType {
  const blob = `${jobType ?? ""} ${title} ${description}`.toLowerCase();
  if (/\bpart[\s-]?time\b/.test(blob)) return "part-time";
  if (/\bcontract|freelance|consulting\b/.test(blob)) return "contract";
  if (/\bintern(ship)?|graduate|junior year\b/.test(blob)) return "internship";
  if (/\bfull[\s-]?time\b/.test(blob)) return "full-time";
  return "any";
}

export function normalizeText(s: string) {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Tokenize for overlap scoring (very light, no full NLP).
 */
const STOP = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "to",
  "of",
  "in",
  "is",
  "it",
  "for",
  "on",
  "with",
  "as",
  "at",
  "be",
  "by",
  "are",
  "this",
  "from",
  "we",
  "our",
  "you",
  "will",
  "all",
  "any",
  "not",
  "so",
  "if",
  "we",
  "re",
  "s",
  "d",
  "m",
  "t",
  "i",
  "a",
  "b",
  "c",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "0",
  "am",
  "my",
  "ex",
  "e",
  "g",
  "f",
  "h",
  "j",
  "k",
  "l",
  "n",
  "o",
  "p",
  "q",
  "r",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "job",
  "work",
  "position",
  "new",
  "york",
  "london",
  "usa",
  "us",
  "llc",
  "ltd",
  "inc",
]);

function cleanToken(t: string) {
  if (t.length < 2) return null;
  if (STOP.has(t) || /^\d+$/.test(t)) return null;
  if (/^[^a-z0-9]+$/i.test(t)) return null;
  return t;
}

export function extractKeywords(resume: string, max = 64): Set<string> {
  const raw = resume.toLowerCase().split(/[^a-z0-9#+\-.]+/i);
  const set = new Set<string>();
  for (const w of raw) {
    const t = cleanToken(w);
    if (t) {
      if (t.includes(".") && t.length < 4) continue;
      set.add(t);
    }
  }
  const arr = [...set];
  arr.sort((a, b) => b.length - a.length);
  return new Set(arr.slice(0, max));
}

export function keywordOverlap(
  jobText: string,
  keywords: Set<string>
): { score: number; max: number; hit: string[] } {
  const j = new Set(
    jobText
      .toLowerCase()
      .split(/[^a-z0-9#+\-.]+/i)
      .map((w) => cleanToken(w))
      .filter((x): x is string => Boolean(x))
  );
  const hit: string[] = [];
  for (const k of keywords) {
    if (j.has(k) || j.has(k + "s") || j.has(k.replace(/e?s$/, ""))) {
      hit.push(k);
    }
  }
  const max = Math.max(1, keywords.size);
  return { score: hit.length, max, hit: hit.sort((a, b) => b.length - a.length).slice(0, 8) };
}

export function dedupeJobs(jobs: { title: string; company: string; url: string }[]) {
  const seen = new Set<string>();
  const out: typeof jobs = [];
  for (const j of jobs) {
    const key = `${j.url.split("#")[0]}|${normalizeText(j.title)}|${normalizeText(j.company)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(j);
  }
  return out;
}
