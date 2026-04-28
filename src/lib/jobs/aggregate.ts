import { fetchArbeitnow } from "./sources/arbeitnow";
import { fetchRemotive } from "./sources/remotive";
import { dedupeJobs } from "./sources/shared";
import type { UnifiedJob } from "@/lib/types";
import { filterByPreferences } from "./filter-prefs";
import type { SearchPreferences } from "@/lib/types";

export type AggregateOptions = {
  searchQuery: string;
  preferences: SearchPreferences;
  signal: AbortSignal;
  errors: string[];
};

/**
 * Fetches from multiple public APIs in parallel, dedupes, applies preference filters.
 */
export async function aggregateJobs(opts: AggregateOptions): Promise<UnifiedJob[]> {
  const q = opts.searchQuery || opts.preferences.keywords || "developer";
  const rem = fetchRemotive(q, opts.signal).catch((e: Error) => {
    opts.errors.push(`Remotive: ${e.message}`);
    return [] as UnifiedJob[];
  });
  const ab = fetchArbeitnow(opts.signal).catch((e: Error) => {
    opts.errors.push(`Arbeitnow: ${e.message}`);
    return [] as UnifiedJob[];
  });
  const [a, b] = await Promise.all([rem, ab]);
  const merged: UnifiedJob[] = [...a, ...b];
  const deduped = dedupeJobs(merged) as UnifiedJob[];
  return filterByPreferences(deduped, opts.preferences);
}
