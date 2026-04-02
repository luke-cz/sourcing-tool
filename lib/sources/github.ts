import type { Candidate, Repo, SearchParams } from "@/lib/types";
import { detectTier } from "@/lib/tiers";

const BASE = "https://api.github.com";

function headers() {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (process.env.GITHUB_TOKEN) {
    h["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return h;
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: headers(), next: { revalidate: 0 } });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

interface GHUserSearch {
  items: { login: string; avatar_url: string; html_url: string }[];
}

interface GHRepoSearch {
  items: { owner: { login: string; avatar_url: string; html_url: string } }[];
}

interface GHUser {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  hireable: boolean | null;
  followers: number;
  twitter_username: string | null;
  blog: string | null;
}

interface GHRepo {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  html_url: string;
  topics: string[];
}

// Build keywords for repo search — strips filler words, keeps technical terms
function buildRepoQuery(params: SearchParams): string {
  const stopWords = new Set([
    "and", "or", "the", "a", "an", "in", "of", "for", "with", "to", "at",
    "lead", "senior", "junior", "principal", "staff", "head", "chief",
  ]);
  const words = params.query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  let q = words.slice(0, 4).join(" ");
  if (params.language) q += ` language:${params.language}`;
  // Boost repo quality signal
  q += " stars:>5";
  return q;
}

function buildUserQuery(params: SearchParams): string {
  let q = params.query;
  if (params.location) q += ` location:${params.location}`;
  if (params.language) q += ` language:${params.language}`;
  return q;
}

async function enrichUser(login: string): Promise<{ user: GHUser; repos: GHRepo[] }> {
  const [user, repos] = await Promise.all([
    fetchJson<GHUser>(`${BASE}/users/${login}`),
    fetchJson<GHRepo[]>(`${BASE}/users/${login}/repos?sort=stars&per_page=5&type=owner`),
  ]);
  return { user, repos };
}

function extractLanguages(repos: GHRepo[]): string[] {
  const langs = repos
    .map((r) => r.language)
    .filter((l): l is string => !!l);
  return Array.from(new Set(langs));
}

function toCandidate(user: GHUser, repos: GHRepo[]): Candidate {
  const topRepos: Repo[] = repos.slice(0, 3).map((r) => ({
    name: r.name,
    description: r.description,
    language: r.language,
    stars: r.stargazers_count,
    url: r.html_url,
  }));

  const candidate: Omit<Candidate, "tier"> = {
    id: `github:${user.login}`,
    source: "github",
    name: user.name,
    username: user.login,
    avatarUrl: user.avatar_url,
    profileUrl: user.html_url,
    headline: user.company ?? null,
    bio: user.bio,
    location: user.location,
    company: user.company,
    openToWork: user.hireable,
    languages: extractLanguages(repos),
    topRepos,
    followers: user.followers,
    rawText: null,
    summary: null,
  };
  return { ...candidate, tier: detectTier(candidate) };
}

export async function searchGitHub(params: SearchParams): Promise<Candidate[]> {
  // Run user search and repo-owner search in parallel
  const userQ = encodeURIComponent(buildUserQuery(params));
  const repoQ = encodeURIComponent(buildRepoQuery(params));

  const [userResult, repoResult] = await Promise.allSettled([
    fetchJson<GHUserSearch>(`${BASE}/search/users?q=${userQ}&per_page=8&sort=followers`),
    fetchJson<GHRepoSearch>(`${BASE}/search/repositories?q=${repoQ}&per_page=10&sort=stars`),
  ]);

  // Collect unique logins, repo owners first (more relevant)
  const seen = new Set<string>();
  const logins: string[] = [];

  if (repoResult.status === "fulfilled") {
    repoResult.value.items.forEach((item) => {
      if (!seen.has(item.owner.login)) {
        seen.add(item.owner.login);
        logins.push(item.owner.login);
      }
    });
  }

  if (userResult.status === "fulfilled") {
    userResult.value.items.forEach((item) => {
      if (!seen.has(item.login)) {
        seen.add(item.login);
        logins.push(item.login);
      }
    });
  }

  // Enrich top 10 unique profiles
  const enriched = await Promise.allSettled(logins.slice(0, 10).map(enrichUser));

  return enriched
    .filter((r): r is PromiseFulfilledResult<{ user: GHUser; repos: GHRepo[] }> => r.status === "fulfilled")
    .map((r) => toCandidate(r.value.user, r.value.repos));
}
