import { NextResponse } from "next/server";
import { scoreAndRank } from "@/lib/ai/match";
import { aggregateJobs } from "@/lib/jobs/aggregate";
import { buildGoogleLinkedInJobsUrl, buildLinkedInJobsUrl } from "@/lib/jobs/linkedin-link";
import { searchPreferencesSchema, toSearchPreferences } from "@/lib/prefs";
import { parseResumePdf } from "@/lib/resume/parse-pdf";

export const maxDuration = 60;
export const runtime = "nodejs";

const RESULT_LIMIT = 30;

function formGet(form: FormData, key: string) {
  const v = form.get(key);
  if (v == null) return undefined;
  return typeof v === "string" ? v : v.name;
}

export async function POST(req: Request) {
  const errors: string[] = [];
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
    }
    const form = await req.formData();
    const file = form.get("resume");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Please upload a PDF resume" }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: "Empty file" }, { status: 400 });
    }
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const resumeText = await parseResumePdf(buffer);

    const raw = {
      workType: formGet(form, "workType"),
      workArrangement: formGet(form, "workArrangement"),
      salaryMinAnnual: formGet(form, "salaryMinAnnual") ?? "",
      country: formGet(form, "country") ?? "",
      keywords: formGet(form, "keywords") ?? "",
    };
    const parsed = searchPreferencesSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid preferences", details: parsed.error.issues },
        { status: 400 }
      );
    }
    const preferences = toSearchPreferences(parsed.data);
    const searchQuery =
      preferences.keywords ||
      resumeText
        .split("\n")
        .find((l) => l.trim().length > 0)
        ?.trim()
        .slice(0, 120) ||
      "engineer";

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);
    const jobs = await aggregateJobs({
      searchQuery,
      preferences,
      signal: controller.signal,
      errors,
    });
    clearTimeout(timeout);

    const linkedIn = buildLinkedInJobsUrl(preferences);
    const googleL = buildGoogleLinkedInJobsUrl(
      [preferences.keywords, searchQuery].filter(Boolean).join(" ") || "developer"
    );

    if (jobs.length === 0) {
      return NextResponse.json({
        ok: true,
        resumePreview: resumeText.slice(0, 400) + (resumeText.length > 400 ? "…" : ""),
        useEmbeddings: Boolean(process.env.OPENAI_API_KEY),
        matchMode: process.env.OPENAI_API_KEY ? "embedding" : "keywords",
        jobs: [],
        linkedIn,
        externalSearch: { google: googleL },
        sourceErrors: errors,
        message:
          "No open listings matched your filters. Try setting country to blank, relaxing salary, or use the LinkedIn links below.",
      });
    }

    const scored = await scoreAndRank(
      resumeText,
      jobs,
      preferences,
      RESULT_LIMIT
    );
    return NextResponse.json({
      ok: true,
      resumePreview: resumeText.slice(0, 400) + (resumeText.length > 400 ? "…" : ""),
      useEmbeddings: Boolean(process.env.OPENAI_API_KEY),
      matchMode: process.env.OPENAI_API_KEY ? "embedding+keywords" : "keywords",
      count: scored.length,
      jobs: scored,
      linkedIn,
      externalSearch: { google: googleL },
      sourceErrors: errors,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Search failed";
    return NextResponse.json(
      { error: msg, sourceErrors: errors },
      { status: 500 }
    );
  }
}
