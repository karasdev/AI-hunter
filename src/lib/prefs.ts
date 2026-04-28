import { z } from "zod";

import type { WorkArrangement, WorkType } from "./types";

function optionalPositiveIntString(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) return null;
  const n = typeof value === "number" ? value : Number(String(value).replace(/[,\s]/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.floor(n);
}

export const searchPreferencesSchema = z.object({
  workType: z.enum(["full-time", "part-time", "contract", "internship", "any"]),
  workArrangement: z.enum(["remote", "onsite", "hybrid", "any"]),
  salaryMinAnnual: z.preprocess(optionalPositiveIntString, z.union([z.number().int().positive(), z.null()])),
  country: z.string().max(200).default(""),
  keywords: z.string().max(2000).default(""),
});

export type SearchPreferencesInput = z.infer<typeof searchPreferencesSchema>;

export function toSearchPreferences(input: SearchPreferencesInput): {
  workType: WorkType;
  workArrangement: WorkArrangement;
  salaryMinAnnual: number | null;
  country: string;
  keywords: string;
} {
  return {
    workType: input.workType,
    workArrangement: input.workArrangement,
    salaryMinAnnual: input.salaryMinAnnual ?? null,
    country: input.country.trim(),
    keywords: input.keywords.trim(),
  };
}
