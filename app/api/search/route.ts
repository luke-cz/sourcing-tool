import { NextRequest, NextResponse } from "next/server";
import type { Candidate, LocationConfig, SearchParams, SearchResponse, Source, WorldRegion } from "@/lib/types";
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

// Representative search terms for each region (used when no countries/cities are specified)
const REGION_FALLBACKS: Record<WorldRegion, string[]> = {
  global:        [],
  north_america: ["United States", "Canada"],
  south_america: ["Brazil", "Argentina", "Colombia", "Chile", "Mexico"],
  europe:        ["United Kingdom", "Germany", "Netherlands", "France", "Poland", "Sweden", "Spain"],
  asia_pacific:  ["Singapore", "Australia", "India", "Japan", "South Korea", "Hong Kong"],
  middle_east:   ["United Arab Emirates", "Israel", "Saudi Arabia"],
  africa:        ["South Africa", "Nigeria", "Kenya", "Egypt"],
};

/**
 * Returns an ordered list of location strings to search.
 * Cities take priority, then countries, then region fallbacks (union of all selected regions).
 * Empty array means "no location filter" (global).
 */
function buildLocationTargets(config: LocationConfig): string[] {
  if (config.cities.length > 0) return config.cities;
  if (config.countries.length > 0) return config.countries;
  if (config.regions.length === 0) return []; // global — no location filter
  // Combine fallback locations for every selected region (deduplicated)
  const seen = new Set<string>();
  const targets: string[] = [];
  for (const region of config.regions) {
    for (const loc of REGION_FALLBACKS[region] ?? []) {
      if (!seen.has(loc)) { seen.add(loc); targets.push(loc); }
    }
  }
  return targets;
}

export async function POST(req: NextRequest) {
  let body: Partial<SearchParams> & { settings?: SearchParams["settings"] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { query, sources, language, background, mustHaves, niceToHaves, minYears, settings } = body;

  if (!query || typeof query !== "string" || !query.trim()) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  let enrichedQuery = query.trim();
  if (background) enrichedQuery = `${background} ${enrichedQuery}`;

  const activeSources: Source[] = Array.isArray(sources) && sources.length > 0
    ? sources
    : ["github", "stackoverflow"];

  // Derive location targets from locationConfig (or fall back to global if absent)
  const locationConfig = settings?.locationConfig;
  const locationTargets = locationConfig
    ? buildLocationTargets(locationConfig)
    : [];

  // Base params (no location — will be injected per target)
  const baseParams: SearchParams = {
    query: enrichedQuery,
    sources: activeSources,
    language: typeof language === "string" ? language.trim() : undefined,
    background: typeof background === "string" ? background.trim() : undefined,
    mustHaves: Array.isArray(mustHaves) ? mustHaves : undefined,
    niceToHaves: Array.isArray(niceToHaves) ? niceToHaves : undefined,
    minYears: typeof minYears === "number" ? minYears : null,
    settings,
  };

  // Run one full search per location target in parallel (or one global search if no targets)
  const searchRuns = locationTargets.length > 0
    ? locationTargets.map((loc) => ({ ...baseParams, location: loc }))
    : [baseParams];

  const runResults = await Promise.all(
    searchRuns.map((runParams) =>
      Promise.allSettled(activeSources.map((s) => sourceFetchers[s](runParams)))
    )
  );

  // Flatten all settled results
  const allResults = runResults.flat();

  const seen = new Set<string>();
  const candidates: Candidate[] = [];
  const errors: { source: Source; message: string }[] = [];

  allResults.forEach((result, idx) => {
    const source = activeSources[idx % activeSources.length];
    if (result.status === "fulfilled") {
      result.value.forEach((c) => {
        if (!seen.has(c.id)) {
          seen.add(c.id);
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
