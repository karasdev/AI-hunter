/**
 * Normalized job listing across all providers.
 */
export type WorkArrangement = "remote" | "onsite" | "hybrid" | "any";

export type WorkType = "full-time" | "part-time" | "contract" | "internship" | "any";

export type JobSource = "remotive" | "arbeitnow" | "linkedin" | "greenhouse" | "other";

export type UnifiedJob = {
  id: string;
  source: JobSource;
  sourceLabel: string;
  title: string;
  company: string;
  location: string;
  workArrangement: WorkArrangement;
  workType: WorkType;
  url: string;
  description: string;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  postedAt: string | null;
  rawCountryHint: string | null;
};

export type ScoredJob = UnifiedJob & {
  score: number;
  maxScore: number;
  reason: string;
  keywordsHit: string[];
};

export type SearchPreferences = {
  workType: WorkType;
  workArrangement: WorkArrangement;
  salaryMinAnnual: number | null;
  country: string;
  keywords: string;
};
