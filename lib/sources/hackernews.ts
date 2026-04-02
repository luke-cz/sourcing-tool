import type { Candidate, SearchParams } from "@/lib/types";
import { detectTier } from "@/lib/tiers";

const ALGOLIA = "https://hn.algolia.com/api/v1";

interface AlgoliaHit {
  objectID: string;
  title?: string;
  story_title?: string;
  comment_text?: string;
  author: string;
  created_at: string;
}

interface AlgoliaResponse {
  hits: AlgoliaHit[];
}

// Fetch the most recent "Ask HN: Who wants to be hired?" thread ID
async function getLatestHiringThread(): Promise<string | null> {
  const url = `${ALGOLIA}/search?query=Ask+HN+Who+wants+to+be+hired&tags=story,ask_hn&hitsPerPage=5`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return null;

  const data = (await res.json()) as AlgoliaResponse;
  const thread = data.hits.find(
    (h) => h.title && /who wants to be hired/i.test(h.title)
  );
  return thread ? thread.objectID : null;
}

// Parse location from free-text HN comment
function parseLocation(text: string): string | null {
  const match = text.match(/\b(location|based in|from)[:\s]+([^\n|,]+)/i);
  if (match) return match[2].trim();
  // Also try lines that start with a location pattern like "Berlin, Germany"
  const lineMatch = text.match(/^([A-Z][a-z]+(?:[,\s]+[A-Z][a-z]+)*)\s*[\|\/]/m);
  return lineMatch ? lineMatch[1].trim() : null;
}

function parseOpenToWork(text: string): boolean | null {
  if (/seeking\s+work|looking\s+for|open\s+to\s+work|available|want.{0,10}hired/i.test(text)) return true;
  if (/not\s+looking|not\s+available|not\s+seeking/i.test(text)) return false;
  return null;
}

function parseLanguages(text: string): string[] {
  const knownLangs = [
    "JavaScript", "TypeScript", "Python", "Rust", "Go", "Java", "Kotlin",
    "Swift", "C++", "C#", "Ruby", "PHP", "Scala", "Haskell", "Elixir",
    "Clojure", "R", "Julia", "Dart", "Lua", "Perl", "COBOL", "Fortran",
  ];
  return knownLangs.filter((lang) => new RegExp(`\\b${lang}\\b`, "i").test(text));
}

function parseHeadline(text: string): string | null {
  // First line often has "Title | Location | Remote"
  const firstLine = text.split("\n")[0]?.trim();
  if (firstLine && firstLine.length < 120) return firstLine;
  return null;
}

function commentToCandidate(hit: AlgoliaHit, query: string): Candidate | null {
  const text = hit.comment_text ?? "";
  if (!text) return null;

  // Filter relevance: check if the comment text mentions any query term
  const terms = query.toLowerCase().split(/\s+/);
  const lowerText = text.toLowerCase();
  const relevant = terms.some((t) => t.length > 2 && lowerText.includes(t));
  if (!relevant) return null;

  const candidate: Omit<Candidate, "tier"> = {
    id: `hackernews:${hit.objectID}`,
    source: "hackernews",
    name: null,
    username: hit.author,
    avatarUrl: null,
    profileUrl: `https://news.ycombinator.com/item?id=${hit.objectID}`,
    headline: parseHeadline(text),
    bio: text.slice(0, 300),
    location: parseLocation(text),
    company: null,
    openToWork: parseOpenToWork(text),
    languages: parseLanguages(text),
    topRepos: [],
    followers: null,
    rawText: text,
    summary: null,
  };
  return { ...candidate, tier: detectTier(candidate) };
}

export async function searchHackerNews(params: SearchParams): Promise<Candidate[]> {
  const threadId = await getLatestHiringThread();
  if (!threadId) return [];

  // Fetch comments from the thread
  const url = `${ALGOLIA}/search?tags=comment,story_${threadId}&hitsPerPage=100`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return [];

  const data = (await res.json()) as AlgoliaResponse;

  return data.hits
    .map((hit) => commentToCandidate(hit, params.query))
    .filter((c): c is Candidate => c !== null)
    .slice(0, 10);
}
