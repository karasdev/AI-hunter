import OpenAI from "openai";
import type { ScoredJob, SearchPreferences, UnifiedJob } from "@/lib/types";
import { extractKeywords, keywordOverlap } from "@/lib/jobs/sources/shared";

const EMBED_MODEL = "text-embedding-3-small";
const EMBED_DIM = 1536;

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function stripResumeNoise(text: string) {
  return text
    .replace(/\S+@\S+/g, " ")
    .replace(/\+?\d[\d\-().\s]{6,}/g, " ")
    .slice(0, 12_000);
}

async function embedBatch(
  openai: OpenAI,
  inputs: string[]
): Promise<number[][]> {
  const r = await openai.embeddings.create({ model: EMBED_MODEL, input: inputs });
  return r.data
    .sort((x, y) => x.index - y.index)
    .map((d) => d.embedding)
    .map((e) => (e.length > EMBED_DIM ? e.slice(0, EMBED_DIM) : e));
}

/**
 * Ranks jobs by resume fit. Uses OpenAI embeddings when `OPENAI_API_KEY` is set; otherwise keyword overlap.
 */
export async function scoreAndRank(
  resumeText: string,
  jobs: UnifiedJob[],
  _prefs: SearchPreferences,
  limit: number
): Promise<ScoredJob[]> {
  const resumeClean = stripResumeNoise(resumeText);
  const kw = extractKeywords(resumeClean, 64);
  const apiKey = process.env.OPENAI_API_KEY;

  let resumeVec: number[] | null = null;
  const openai = apiKey ? new OpenAI({ apiKey }) : null;
  if (openai) {
    try {
      const [rvec] = await embedBatch(openai, [resumeClean]);
      resumeVec = rvec;
    } catch {
      resumeVec = null;
    }
  }

  const jobTexts = jobs.map(
    (j) =>
      `${j.title}\n${j.company}\n${j.location}\n${(j.description || "").replace(/<[^>]+>/g, " ").slice(0, 6_000)}`
  );
  let jobVecs: number[][] | null = null;
  if (openai && resumeVec && jobTexts.length > 0) {
    try {
      const vecs: number[][] = [];
      for (let i = 0; i < jobTexts.length; i += 64) {
        const chunk = jobTexts.slice(i, i + 64);
        const emb = await embedBatch(openai, chunk);
        vecs.push(...emb);
      }
      jobVecs = vecs;
    } catch {
      jobVecs = null;
    }
  }

  const out: ScoredJob[] = jobs.map((j, i) => {
    const { score: kScore, max: kMax, hit } = keywordOverlap(
      j.title + " " + (j.description || "") + " " + j.location,
      kw
    );
    const embed = resumeVec && jobVecs && jobVecs[i] ? cosine(resumeVec, jobVecs[i]!) * 100 : 0;
    const embedPart = resumeVec && jobVecs ? Math.round(embed * 10) / 10 : 0;
    const kPart = Math.min(100, (kScore / kMax) * 100);
    const combined =
      resumeVec && jobVecs
        ? Math.min(100, 0.65 * embed + 0.35 * kPart)
        : Math.min(100, kPart);

    const maxScore = 100;
    return {
      ...j,
      score: Math.round(combined * 10) / 10,
      maxScore,
      keywordsHit: hit,
      reason:
        hit.length > 0
          ? `Matched resume keywords: ${hit.slice(0, 4).join(", ")}${
              hit.length > 4 ? "…" : ""
            }`
          : "Broad match; try refining your keywords in preferences",
    };
  });

  out.sort((a, b) => b.score - a.score);
  return out.slice(0, limit);
}
