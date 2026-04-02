import type { Candidate, SearchParams } from "@/lib/types";
import { detectTierWithCategory } from "@/lib/tiers";

// LinkedIn profiles sourced via Brave Search API (site:linkedin.com/in search)
// Free tier: $5 credits/month (~1000 searches)

interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
  profile?: {
    name?: string;
    long_name?: string;
  };
}

interface BraveSearchResponse {
  web?: {
    results: BraveSearchResult[];
  };
}

function parseLinkedInTitle(title: string): { name: string; headline: string | null } {
  const withoutLinkedIn = title.replace(/\s*[|\-]\s*LinkedIn\s*$/i, "").trim();
  const dashIdx = withoutLinkedIn.indexOf(" - ");
  if (dashIdx !== -1) {
    return {
      name: withoutLinkedIn.slice(0, dashIdx).trim(),
      headline: withoutLinkedIn.slice(dashIdx + 3).trim(),
    };
  }
  return { name: withoutLinkedIn, headline: null };
}

function extractUsername(url: string): string {
  return url.split("/in/")[1]?.replace(/\/$/, "") ?? url;
}

export async function searchLinkedIn(params: SearchParams): Promise<Candidate[]> {
  const apiKey = process.env.BRAVE_SEARCH_KEY;
  if (!apiKey) return [];

  let query = `site:linkedin.com/in ${params.query}`;
  if (params.location) query += ` ${params.location}`;

  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10&search_lang=en`;

  const res = await fetch(url, {
    headers: {
      "Accept": "application/json",
      "Accept-Encoding": "gzip",
      "X-Subscription-Token": apiKey,
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    console.error("[linkedin] Brave Search error:", res.status, JSON.stringify(errorBody));
    return [];
  }

  const data = (await res.json()) as BraveSearchResponse;
  const results = data.web?.results ?? [];

  return results
    .filter((r) => r.url.includes("linkedin.com/in/"))
    .map((r): Candidate => {
      const { name, headline } = parseLinkedInTitle(r.title);
      const username = extractUsername(r.url);

      const base: Omit<Candidate, "tier" | "tierCategory"> = {
        id: `linkedin:${username}`,
        source: "linkedin",
        name,
        username,
        avatarUrl: null,
        profileUrl: r.url,
        headline: headline ?? r.description?.split("\n")[0] ?? null,
        bio: r.description ?? null,
        location: params.location ?? null,
        company: null,
        openToWork: null,
        languages: [],
        topRepos: [],
        followers: null,
        rawText: r.description ?? null,
        summary: null,
      };
      const { tier, category } = detectTierWithCategory(base);
      return { ...base, tier, tierCategory: category };
    });
}
