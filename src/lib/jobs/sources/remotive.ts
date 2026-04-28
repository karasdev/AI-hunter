import type { UnifiedJob, WorkArrangement } from "@/lib/types";
import { guessWorkType } from "./shared";

type RemotiveResponse = {
  jobs?: RemotiveJob[];
};

type RemotiveJob = {
  id: number;
  url: string;
  title: string;
  company_name: string;
  candidate_location?: string;
  job_type?: string;
  publication_date?: string;
  salary?: string;
  description?: string;
  category?: string;
};

const SOURCE_LABEL = "Remotive (remote)";

function arrangementFromText(text: string, title: string): WorkArrangement {
  const t = `${text} ${title}`.toLowerCase();
  if (t.includes("hybrid")) return "hybrid";
  if (t.includes("remote")) return "remote";
  if (t.includes("on-site") || t.includes("onsite") || t.includes("office")) return "onsite";
  return "remote";
}

function parseSalaryLoose(s: string | undefined): { min: number | null; max: number | null; cur: string | null } {
  if (!s) return { min: null, max: null, cur: null };
  const m = s.match(/(\$|€|£)?\s*([0-9][0-9,]*)(?:\s*[-–—]\s*([0-9][0-9,]*))?/i);
  if (!m) return { min: null, max: null, cur: null };
  const cur = m[1] === "€" ? "EUR" : m[1] === "£" ? "GBP" : m[1] === "$" ? "USD" : "USD";
  const min = Number(m[2].replace(/,/g, ""));
  const max = m[3] ? Number(m[3].replace(/,/g, "")) : min;
  if (!Number.isFinite(min)) return { min: null, max: null, cur: null };
  return { min, max: Number.isFinite(max) ? max : min, cur };
}

function countryHintFromLocation(s: string | undefined): string | null {
  if (!s) return null;
  return s.length > 80 ? s.slice(0, 77) + "…" : s;
}

export async function fetchRemotive(search: string | undefined, signal: AbortSignal): Promise<UnifiedJob[]> {
  const u = new URL("https://remotive.com/api/remote-jobs");
  if (search) u.searchParams.set("search", search.slice(0, 200));

  const res = await fetch(u.toString(), { signal, headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Remotive: ${res.status}`);
  const data = (await res.json()) as RemotiveResponse;
  const list = data.jobs ?? [];
  return list.map((j): UnifiedJob => {
    const { min, max, cur } = parseSalaryLoose(j.salary);
    const desc = (j.description ?? "").replace(/<[^>]+>/g, " ");
    return {
      id: `remotive-${j.id}`,
      source: "remotive",
      sourceLabel: SOURCE_LABEL,
      title: j.title,
      company: j.company_name,
      location: j.candidate_location || "Worldwide (remote)",
      workArrangement: arrangementFromText(desc + (j.candidate_location ?? ""), j.title),
      workType: guessWorkType(j.job_type, j.title, desc),
      url: j.url,
      description: desc,
      salaryMin: min,
      salaryMax: max,
      currency: cur,
      postedAt: j.publication_date ?? null,
      rawCountryHint: countryHintFromLocation(j.candidate_location),
    };
  });
}
