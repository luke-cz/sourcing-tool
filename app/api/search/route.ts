import { NextRequest, NextResponse } from "next/server";
import type { Candidate, SearchParams, SearchResponse, Source } from "@/lib/types";
import { searchGitHub } from "@/lib/sources/github";
import { searchHackerNews } from "@/lib/sources/hackernews";
import { searchStackOverflow } from "@/lib/sources/stackoverflow";
import { searchLinkedIn } from "@/lib/sources/linkedin";

const sourceFetchers: Record<Source, (params: SearchParams) => Promise<Candidate[]>> = {
  github: searchGitHub,
  hackernews: searchHackerNews,
  stackoverflow: searchStackOverflow,
  linkedin: searchLinkedIn,
};

export async function POST(req: NextRequest) {
  let body: Partial<SearchParams>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { query, sources, location, language } = body;

  if (!query || typeof query !== "string" || !query.trim()) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const activeSources: Source[] = Array.isArray(sources) && sources.length > 0
    ? sources
    : ["github", "hackernews", "stackoverflow"];

  const params: SearchParams = {
    query: query.trim(),
    sources: activeSources,
    location: typeof location === "string" ? location.trim() : undefined,
    language: typeof language === "string" ? language.trim() : undefined,
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

  const response: SearchResponse = { candidates, errors };
  return NextResponse.json(response);
}
