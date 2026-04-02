import type { Candidate, SearchParams } from "@/lib/types";
import { detectTierWithCategory, COMPANIES_BY_CATEGORY } from "@/lib/tiers";
import type { TierCategory } from "@/lib/tiers";

// LinkedIn profiles sourced via Brave Search API (site:linkedin.com/in search)
// Free tier: $5 credits/month (~1000 searches)

interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
}

interface BraveSearchResponse {
  web?: { results: BraveSearchResult[] };
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

// Build boolean company clauses, batched to keep URL length safe (~25 per batch)
function buildCompanyClauses(categories: TierCategory[]): string[] {
  const companies: string[] = [];
  for (const cat of categories) {
    const list = COMPANIES_BY_CATEGORY[cat] ?? [];
    companies.push(...list.map((c) => c.displayName));
  }
  if (companies.length === 0) return [];

  const BATCH = 25;
  const clauses: string[] = [];
  for (let i = 0; i < companies.length; i += BATCH) {
    const batch = companies.slice(i, i + BATCH);
    clauses.push(`(${batch.map((n) => `"${n}"`).join(" OR ")})`);
  }
  return clauses;
}

// Extract 2-3 core skill keywords from the query (strip generic words)
function buildSkillKeywords(query: string): string {
  const stop = new Set([
    "and", "or", "the", "a", "an", "in", "of", "for", "with", "to", "at",
    "lead", "senior", "junior", "principal", "staff", "head", "developer",
    "engineer", "manager", "specialist", "analyst",
  ]);
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stop.has(w))
    .slice(0, 3)
    .join(" ");
}

async function braveSearch(apiKey: string, query: string): Promise<BraveSearchResult[]> {
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
    const err = await res.json().catch(() => ({}));
    console.error("[linkedin] Brave error:", res.status, JSON.stringify(err));
    return [];
  }

  const data = (await res.json()) as BraveSearchResponse;
  return data.web?.results ?? [];
}

function resultToCandidate(r: BraveSearchResult, location?: string): Candidate {
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
    location: location ?? null,
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
}

export async function searchLinkedIn(params: SearchParams): Promise<Candidate[]> {
  const apiKey = process.env.BRAVE_SEARCH_KEY;
  if (!apiKey) return [];

  const skills = buildSkillKeywords(params.query);
  const locationSuffix = params.location ? ` ${params.location}` : "";

  // Query 1: skill-based (existing approach)
  const skillQuery = `site:linkedin.com/in ${params.query}${locationSuffix}`;

  // Query 2+: company-pedigree boolean searches (batched, 25 companies per query)
  const activeCategories = (params.settings?.tierCategories ?? Object.keys({
    faang: 1, hft_quant: 1, big_tech: 2, top_ai: 1, top_fintech: 2, web3: 2, strong_startups: 2,
  })) as TierCategory[];

  const companyClauses = buildCompanyClauses(activeCategories);
  const pedigreeQueries = companyClauses.map(
    (clause) => `site:linkedin.com/in ${clause} ${skills}${locationSuffix}`
  );

  // Run skill query + all pedigree batches in parallel
  const [skillResults, ...pedigreeBatches] = await Promise.all([
    braveSearch(apiKey, skillQuery),
    ...pedigreeQueries.map((q) => braveSearch(apiKey, q)),
  ]);

  const pedigreeResults = pedigreeBatches.flat();

  // Merge, deduplicate — pedigree results first (higher signal)
  const seen = new Set<string>();
  const all: Candidate[] = [];

  for (const r of [...pedigreeResults, ...skillResults]) {
    if (!r.url.includes("linkedin.com/in/")) continue;
    const username = extractUsername(r.url);
    if (seen.has(username)) continue;
    seen.add(username);
    all.push(resultToCandidate(r, params.location));
  }

  return all;
}
