import type { UnifiedJob, WorkArrangement, WorkType } from "@/lib/types";
import { guessWorkType } from "./shared";

const SOURCE_LABEL = "Arbeitnow (EU, international)";

type ArbeitItem = {
  company_name?: string;
  title: string;
  location?: string;
  remote?: boolean;
  job_types?: string[];
  description?: string;
  url: string;
  created_at?: string;
  title_slug?: string;
};

type ArbeitResponse = { data: ArbeitItem[] } | ArbeitItem[];

function toArr(a: ArbeitResponse): ArbeitItem[] {
  if (Array.isArray(a)) return a;
  return a.data ?? [];
}

function arrayWorkArrangement(remote: boolean | undefined, text: string): WorkArrangement {
  const t = text.toLowerCase();
  if (t.includes("hybrid")) return "hybrid";
  if (remote === true || t.includes("fully remote") || t.includes("remote ")) return "remote";
  if (t.includes("on-site") || t.includes("onsite")) return "onsite";
  return "hybrid";
}

function mapJob(i: ArbeitItem, idx: number): UnifiedJob {
  const company = i.company_name ?? "Unknown";
  const location = i.location || "—";
  const jobType = i.job_types?.[0] ?? "fulltime";
  const text = (i.description ?? "") + " " + (i.title ?? "");
  const wtype = ((): WorkType => {
    const t = (jobType + " " + text).toLowerCase();
    if (t.includes("part") && t.includes("time")) return "part-time";
    if (t.includes("contract") || t.includes("freelance")) return "contract";
    if (t.includes("intern")) return "internship";
    return "full-time";
  })();
  return {
    id: `arbeit-${i.title_slug ?? idx}-${idx}`,
    source: "arbeitnow",
    sourceLabel: SOURCE_LABEL,
    title: i.title,
    company,
    location,
    workArrangement: arrayWorkArrangement(i.remote, text + location),
    workType: wtype,
    url: i.url,
    description: (i.description ?? "").replace(/<[^>]+>/g, " "),
    salaryMin: null,
    salaryMax: null,
    currency: null,
    postedAt: i.created_at ?? null,
    rawCountryHint: location,
  };
}

export async function fetchArbeitnow(signal: AbortSignal): Promise<UnifiedJob[]> {
  const res = await fetch("https://api.arbeitnow.com/v1/job-board-api", {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Arbeitnow: ${res.status}`);
  const data = (await res.json()) as ArbeitResponse;
  return toArr(data).map((x, i) => mapJob(x, i));
}
