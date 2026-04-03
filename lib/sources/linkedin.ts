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

// Words that strongly indicate a non-person account (company/project/bot)
const COMPANY_NAME_WORDS = /\b(blog|blogs|news|media|agency|group|solutions|consulting|protocol|dao|network|platform|exchange|capital|ventures|fund|collective|community|club|hub|studio|studios|global|worldwide|international|official)\b/i;

/**
 * Returns false if the search result looks like a company page, bot, or
 * non-individual account rather than a real person.
 */
function isLikelyPerson(r: BraveSearchResult): boolean {
  const { name, headline } = parseLinkedInTitle(r.title);

  // ── Signal 1: circular headline ("X at X" where company ≈ name) ──────
  if (headline) {
    const atMatch = headline.match(/^(.+?)\s+at\s+(.+)$/i);
    if (atMatch) {
      const company = atMatch[2].trim();
      // Normalise both sides: lowercase, strip spaces/hyphens
      const norm = (s: string) => s.toLowerCase().replace(/[\s\-_.]/g, "");
      const nName = norm(name);
      const nComp = norm(company);
      // Circular if one fully contains the other (handles "Defi Blogs" vs "DefiBlogs")
      if (nComp.includes(nName) || nName.includes(nComp)) return false;
    }
  }

  // ── Signal 2: bio opens with the name in third person ("X is a …") ───
  const desc = (r.description ?? "").trim();
  const normName = name.toLowerCase();
  if (
    desc.toLowerCase().startsWith(normName + " is ") ||
    desc.toLowerCase().startsWith(normName + " are ") ||
    desc.toLowerCase().startsWith(normName + " was ")
  ) return false;

  // ── Signal 3: name contains obvious non-person company words ──────────
  if (COMPANY_NAME_WORDS.test(name)) return false;

  // ── Signal 4: name is suspiciously long (> 5 words = likely a page title) ──
  if (name.trim().split(/\s+/).length > 5) return false;

  return true;
}

/**
 * Try to extract the person's actual location from the Brave snippet.
 * LinkedIn profiles usually surface location early in the description.
 */
function extractLocationFromSnippet(description: string): string | null {
  if (!description) return null;

  // "City Metropolitan Area" pattern (LinkedIn's own phrasing)
  const metro = description.match(/\b([A-Z][a-zA-Z\s]+Metropolitan Area)\b/);
  if (metro) return metro[1].trim();

  // "City, State/Country" with known country names
  const countryList = "United States|United Kingdom|Canada|Australia|Germany|Netherlands|France|Switzerland|Sweden|Poland|Singapore|Israel|UAE|India|Brazil|Spain|Italy|Japan|South Korea|Norway|Denmark|Finland|Austria|Belgium|Ireland";
  const country = description.match(
    new RegExp(`\\b([A-Z][a-zA-Z\\s]+(?:,\\s*[A-Z][a-zA-Z\\s]+)?,\\s*(?:${countryList}))\\b`)
  );
  if (country) return country[1].trim();

  // "City, XX" two-letter state code (US/CA style)
  const stateCode = description.match(/\b([A-Z][a-zA-Z\s]+,\s*[A-Z]{2})\b/);
  if (stateCode) return stateCode[1].trim();

  return null;
}

function resultToCandidate(r: BraveSearchResult): Candidate {
  const { name, headline } = parseLinkedInTitle(r.title);
  const username = extractUsername(r.url);

  // Extract actual location from the snippet — do NOT use search location
  // (the search location is where we searched, not where the person lives)
  const location = extractLocationFromSnippet(r.description ?? "");

  const base: Omit<Candidate, "tier" | "tierCategory"> = {
    id: `linkedin:${username}`,
    source: "linkedin",
    name,
    username,
    avatarUrl: null,
    profileUrl: r.url,
    headline: headline ?? r.description?.split("\n")[0] ?? null,
    bio: r.description ?? null,
    location,
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
  // Quote the location so Brave treats it as a phrase, not individual words
  // e.g. "New York" not New York (which would match pages mentioning either word)
  const locationSuffix = params.location ? ` "${params.location}"` : "";

  // Pedigree-only: search by company name boolean clauses (batched, 25 per query)
  // Keyword/skill search removed — it returned too much noise (company pages, job posts, bots)
  const activeCategories = (params.settings?.tierCategories ?? Object.keys({
    faang: 1, hft_quant: 1, big_tech: 2, top_ai: 1, top_fintech: 2, web3: 2, strong_startups: 2,
  })) as TierCategory[];

  const companyClauses = buildCompanyClauses(activeCategories);
  const pedigreeQueries = companyClauses.map(
    (clause) => `site:linkedin.com/in ${clause} ${skills}${locationSuffix}`
  );

  if (pedigreeQueries.length === 0) return [];

  const pedigreeBatches = await Promise.all(pedigreeQueries.map((q) => braveSearch(apiKey, q)));
  const pedigreeResults = pedigreeBatches.flat();

  const seen = new Set<string>();
  const all: Candidate[] = [];

  for (const r of pedigreeResults) {
    if (!r.url.includes("linkedin.com/in/")) continue;
    // Drop company pages, bots and non-person accounts
    if (!isLikelyPerson(r)) continue;
    const username = extractUsername(r.url);
    if (seen.has(username)) continue;
    seen.add(username);
    all.push(resultToCandidate(r));
  }

  return all;
}
