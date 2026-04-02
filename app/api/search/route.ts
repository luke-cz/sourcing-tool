import { NextRequest, NextResponse } from "next/server";
import type { Candidate, SearchParams, SearchResponse, Source } from "@/lib/types";
import { searchGitHub } from "@/lib/sources/github";
import { searchStackOverflow } from "@/lib/sources/stackoverflow";
import { searchLinkedIn } from "@/lib/sources/linkedin";
import { detectTierWithCategory } from "@/lib/tiers";
import type { TierCategory } from "@/lib/tiers";

const sourceFetchers: Record<Source, (params: SearchParams) => Promise<Candidate[]>> = {
  github: searchGitHub,
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

  const { query, sources, location, location2, language, background, mustHaves, niceToHaves, minYears, settings } = body;

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
    location2: typeof location2 === "string" ? location2.trim() : undefined,
    language: typeof language === "string" ? language.trim() : undefined,
    background: typeof background === "string" ? background.trim() : undefined,
    mustHaves: Array.isArray(mustHaves) ? mustHaves : undefined,
    niceToHaves: Array.isArray(niceToHaves) ? niceToHaves : undefined,
    minYears: typeof minYears === "number" ? minYears : null,
    settings,
  };

  // If location2 is set, run search twice and merge
  let results: PromiseSettledResult<Candidate[]>[];

  if (params.location2) {
    const [r1, r2] = await Promise.all([
      Promise.allSettled(activeSources.map((s) => sourceFetchers[s](params))),
      Promise.allSettled(activeSources.map((s) => sourceFetchers[s]({ ...params, location: params.location2, location2: undefined }))),
    ]);
    results = [...r1, ...r2];
  } else {
    results = await Promise.allSettled(activeSources.map((s) => sourceFetchers[s](params)));
  }

  const seen = new Set<string>();
  const candidates: Candidate[] = [];
  const errors: { source: Source; message: string }[] = [];

  results.forEach((result, idx) => {
    const source = activeSources[idx % activeSources.length];
    if (result.status === "fulfilled") {
      result.value.forEach((c) => {
        if (!seen.has(c.id)) {
          seen.add(c.id);
          // Re-apply tier detection with custom settings if provided
          if (settings?.tierCategories && settings?.tierMap) {
            const { tier, category } = detectTierWithCategory(
              c,
              settings.tierMap,
              settings.tierCategories as TierCategory[]
            );
            candidates.push({ ...c, tier, tierCategory: category });
          } else {
            candidates.push(c);
          }
        }
      });
    } else {
      const alreadyReported = errors.some((e) => e.source === source);
      if (!alreadyReported) {
        console.error(`[search] ${source} failed:`, result.reason);
        errors.push({
          source,
          message: result.reason instanceof Error ? result.reason.message : String(result.reason),
        });
      }
    }
  });

  // Sort: tier 1 first, tier 2 second, null last
  candidates.sort((a, b) => (a.tier ?? 99) - (b.tier ?? 99));

  return NextResponse.json({ candidates, errors } as SearchResponse);
}
