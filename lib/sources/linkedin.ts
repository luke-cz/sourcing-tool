import type { Candidate, SearchParams } from "@/lib/types";
import { detectTier } from "@/lib/tiers";

// LinkedIn data is sourced via Google Custom Search Engine restricted to linkedin.com/in/*
// Setup: https://programmablesearchengine.google.com/ → add site:linkedin.com/in
// Free tier: 100 queries/day

interface GoogleCSEItem {
  title: string; // "Name - Title at Company - LinkedIn"
  link: string; // https://www.linkedin.com/in/username
  snippet: string; // Public profile headline text
  pagemap?: {
    metatags?: Array<{
      "og:image"?: string;
      "og:title"?: string;
      "og:description"?: string;
    }>;
  };
}

interface GoogleCSEResponse {
  items?: GoogleCSEItem[];
  error?: { message: string };
}

function parseLinkedInTitle(title: string): { name: string; headline: string | null } {
  // Typical format: "Name - Title at Company | LinkedIn" or "Name | LinkedIn"
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
  const apiKey = process.env.GOOGLE_CSE_API_KEY;
  const cseId = process.env.GOOGLE_CSE_ID;

  if (!apiKey || !cseId) return [];

  let query = params.query;
  if (params.location) query += ` ${params.location}`;

  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodeURIComponent(
    query
  )}&num=10`;

  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) return [];

  const data = (await res.json()) as GoogleCSEResponse;
  if (!data.items) return [];

  return data.items
    .filter((item) => item.link.includes("linkedin.com/in/"))
    .map((item): Candidate => {
      const { name, headline } = parseLinkedInTitle(item.title);
      const username = extractUsername(item.link);
      const ogImage = item.pagemap?.metatags?.[0]?.["og:image"] ?? null;

      const base: Omit<Candidate, "tier"> = {
        id: `linkedin:${username}`,
        source: "linkedin",
        name,
        username,
        avatarUrl: ogImage,
        profileUrl: item.link,
        headline: headline ?? item.snippet?.split("\n")[0] ?? null,
        bio: item.snippet ?? null,
        location: params.location ?? null,
        company: null,
        openToWork: null,
        languages: [],
        topRepos: [],
        followers: null,
        rawText: null,
        summary: null,
      };
      return { ...base, tier: detectTier(base) };
    });
}
