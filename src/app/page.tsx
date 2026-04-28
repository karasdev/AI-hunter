"use client";

import {
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  Search,
  Sparkles,
} from "lucide-react";
import { useId, useState } from "react";

type Scored = {
  id: string;
  sourceLabel: string;
  title: string;
  company: string;
  location: string;
  workArrangement: string;
  url: string;
  description: string;
  score: number;
  maxScore: number;
  reason: string;
  keywordsHit: string[];
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
};

type SearchResult = {
  ok: boolean;
  error?: string;
  message?: string;
  resumePreview?: string;
  useEmbeddings?: boolean;
  matchMode?: string;
  jobs: Scored[];
  linkedIn?: { url: string; label: string };
  externalSearch?: { google: { url: string; label: string } };
  sourceErrors?: string[];
};

export default function Home() {
  const formId = useId();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SearchResult | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setData(null);
    const form = e.currentTarget;
    const body = new FormData(form);
    try {
      const res = await fetch("/api/jobs/search", { method: "POST", body });
      const json = (await res.json()) as SearchResult;
      if (!res.ok) {
        setData({
          ok: false,
          error: (json as { error?: string }).error || "Request failed",
          jobs: [],
        });
        return;
      }
      setData({ ...json, ok: true });
    } catch {
      setData({ ok: false, error: "Network error", jobs: [] });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-10">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Sparkles className="h-6 w-6" aria-hidden />
            <span className="text-sm font-semibold uppercase tracking-wide">
              AI Hunter
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Match your resume to real jobs
          </h1>
          <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
            Upload a PDF resume, set your preferences, and we aggregate listings from
            public job APIs (e.g. Remotive, Arbeitnow) and rank them against your
            experience. For LinkedIn, we provide search links (public APIs do not
            list LinkedIn at scale).
          </p>
        </header>

        <form
          id={formId}
          onSubmit={onSubmit}
          className="rounded-2xl border border-zinc-200/80 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label
                className="flex cursor-pointer flex-col gap-2 rounded-xl border border-dashed border-zinc-300 bg-zinc-50/80 px-4 py-8 text-center dark:border-zinc-700 dark:bg-zinc-900/50"
                htmlFor={`${formId}-file`}
              >
                <FileText className="mx-auto h-8 w-8 text-zinc-400" />
                <span className="text-sm font-medium">Resume (PDF, max 10 MB)</span>
                <input
                  id={`${formId}-file`}
                  name="resume"
                  type="file"
                  accept="application/pdf"
                  className="sr-only"
                  required
                />
                <span className="text-xs text-zinc-500">Click to select a file</span>
              </label>
            </div>
            <div>
              <label
                className="mb-1.5 block text-sm font-medium"
                htmlFor={`${formId}-workType`}
              >
                Work type
              </label>
              <select
                id={`${formId}-workType`}
                name="workType"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                defaultValue="any"
              >
                <option value="any">Any</option>
                <option value="full-time">Full time</option>
                <option value="part-time">Part time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>
            <div>
              <label
                className="mb-1.5 block text-sm font-medium"
                htmlFor={`${formId}-workArrangement`}
              >
                Work style
              </label>
              <select
                id={`${formId}-workArrangement`}
                name="workArrangement"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                defaultValue="any"
              >
                <option value="any">Any</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
                <option value="onsite">On-site</option>
              </select>
            </div>
            <div>
              <label
                className="mb-1.5 block text-sm font-medium"
                htmlFor={`${formId}-salary`}
              >
                Minimum annual salary
              </label>
              <input
                id={`${formId}-salary`}
                name="salaryMinAnnual"
                type="text"
                inputMode="numeric"
                placeholder="e.g. 80000 (used when a listing includes salary)"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
            <div>
              <label
                className="mb-1.5 block text-sm font-medium"
                htmlFor={`${formId}-country`}
              >
                Country / region
              </label>
              <input
                id={`${formId}-country`}
                name="country"
                type="text"
                placeholder="e.g. Germany, UK, or leave blank for worldwide"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
            <div className="sm:col-span-2">
              <label
                className="mb-1.5 block text-sm font-medium"
                htmlFor={`${formId}-kw`}
              >
                Role keywords
              </label>
              <input
                id={`${formId}-kw`}
                name="keywords"
                type="text"
                placeholder="e.g. full stack react typescript, product manager, data engineer"
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
              />
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white shadow hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-amber-500 dark:hover:bg-amber-400"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              {loading ? "Searching…" : "Find jobs"}
            </button>
            {data?.matchMode && (
              <span className="text-xs text-zinc-500">
                Matching: {data.matchMode}
                {data.useEmbeddings === false && (
                  <span className="ml-1">
                    (add{" "}
                    <code className="rounded bg-zinc-200 px-1 text-[10px] dark:bg-zinc-800">
                      OPENAI_API_KEY
                    </code>{" "}
                    in <code className="rounded bg-zinc-200 px-1 text-[10px] dark:bg-zinc-800">.env.local</code> for semantic
                    ranking)
                  </span>
                )}
              </span>
            )}
          </div>
        </form>

        {data?.error && (
          <div
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200"
            role="alert"
          >
            {data.error}
          </div>
        )}

        {data?.ok && (data.jobs.length > 0 || data.message) && (
          <div className="mt-8 space-y-4">
            {data.resumePreview && (
              <section className="rounded-xl border border-zinc-200/80 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
                <h2 className="font-medium text-zinc-900 dark:text-zinc-100">
                  Resume preview
                </h2>
                <p className="mt-1 whitespace-pre-wrap break-words text-zinc-600 dark:text-zinc-400">
                  {data.resumePreview}
                </p>
              </section>
            )}

            {data.linkedIn && data.externalSearch?.google && (
              <section className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                <a
                  href={data.linkedIn.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-amber-200/80 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200 dark:hover:bg-amber-950/50"
                >
                  {data.linkedIn.label}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <a
                  href={data.externalSearch.google.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  {data.externalSearch.google.label}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </section>
            )}

            {data.message && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
                {data.message}
              </p>
            )}

            {data.sourceErrors && data.sourceErrors.length > 0 && (
              <p className="text-xs text-zinc-500">
                Some feeds had issues: {data.sourceErrors.join(" · ")}
              </p>
            )}

            <ul className="space-y-3">
              {data.jobs.map((j) => (
                <li
                  key={j.id}
                  className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex flex-col gap-1 border-b border-zinc-100 p-4 dark:border-zinc-800 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <a
                        href={j.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-base font-semibold text-zinc-900 hover:underline dark:text-zinc-50"
                      >
                        {j.title}
                        <ExternalLink className="ml-1.5 inline h-3.5 w-3.5 opacity-50" />
                      </a>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {j.company}
                      </p>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                        <MapPin className="h-3.5 w-3.5" />
                        {j.location}
                        <span className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">
                          {j.sourceLabel}
                        </span>
                        {j.salaryMax != null && j.currency && (
                          <span>
                            {j.currency} {j.salaryMin}–{j.salaryMax}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="shrink-0 text-right sm:pt-0.5">
                      <span className="inline-block rounded-lg bg-amber-100 px-2 py-1 text-sm font-medium text-amber-900 tabular-nums dark:bg-amber-950/60 dark:text-amber-200">
                        {j.score} / {j.maxScore} fit
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 p-4 text-sm text-zinc-600 dark:text-zinc-300">
                    <p className="text-zinc-500 dark:text-zinc-500">{j.reason}</p>
                    {j.description && (
                      <p className="line-clamp-3 text-pretty">
                        {j.description.replace(/\s+/g, " ").trim()}
                      </p>
                    )}
                    {j.keywordsHit.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {j.keywordsHit.map((k) => (
                          <span
                            key={k}
                            className="rounded bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <footer className="mt-12 border-t border-zinc-200/80 pt-6 text-center text-xs text-zinc-500 dark:border-zinc-800">
          <p>
            This tool uses public data sources only. It does not log into your LinkedIn
            account. Add <code>OPENAI_API_KEY</code> in <code>.env.local</code> to enable
            embedding-based ranking; otherwise only keyword overlap is used.
          </p>
        </footer>
      </div>
    </div>
  );
}
