import { NextRequest, NextResponse } from "next/server";
import type { Candidate, SearchParams, SearchResponse, Source } from "@/lib/types";
import { searchGitHub } from "@/lib/sources/github";
import { searchStackOverflow } from "@/lib/sources/stackoverflow";
import { searchLinkedIn } from "@/lib/sources/linkedin";

const sourceFetchers: Record<Source, (params: SearchParams) => Promise<Candidate[]>> = {
  github: searchGitHub,
  stackoverflow: searchStackOverflow,
  linkedin: searchLinkedIn,
};

export async function POST(req: NextRequest) {
  let body: Partial<SearchParams & { background?: string; mustHaves?: string[]; niceToHaves?: string[] }>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { query, sources, location, language, background, mustHaves, niceToHaves } = body;

  if (!query || typeof query !== "string" || !query.trim()) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  let enrichedQuery = query.trim();
  if (background) enrichedQuery = `${background} ${enrichedQuery}`;

  const activeSources: Source[] = Array.isArray(sources) && sources.length > 0
    ? sources
    : ["github", "stackoverflow"];

  const params: SearchParams = {
    query: enrichedQuery,
    sources: activeSources,
    location: typeof location === "string" ? location.trim() : undefined,
    language: typeof language === "string" ? language.trim() : undefined,
    background: typeof background === "string" ? background.trim() : undefined,
    mustHaves: Array.isArray(mustHaves) ? mustHaves : undefined,
    niceToHaves: Array.isArray(niceToHaves) ? niceToHaves : undefined,
  };

  const results = await Promise.allSettled(
    activeSources.map((source) => sourceFetchers[source](params))
  );

  const candidates: Candidate[] = [];
  const errors: { source: Source; message: string }[] = [];

  results.forEach((result, idx) => {
    const source = activeSources[idx];
    if (result.status === "fulfilled") {
      candidates.push(...result.value);
    } else {
      console.error(`[search] ${source} failed:`, result.reason);
      errors.push({
        source,
        message: result.reason instanceof Error ? result.reason.message : String(result.reason),
      });
    }
  });

  candidates.sort((a, b) => {
    const ta = a.tier ?? 99;
    const tb = b.tier ?? 99;
    return ta - tb;
  });

  const response: SearchResponse = { candidates, errors };
  return NextResponse.json(response);
}
