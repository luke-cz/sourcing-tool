import type { Candidate, Repo, SearchParams } from "@/lib/types";

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

function buildQuery(params: SearchParams): string {
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
  return [...new Set(langs)];
}

function toCandidate(user: GHUser, repos: GHRepo[]): Candidate {
  const topRepos: Repo[] = repos.slice(0, 3).map((r) => ({
    name: r.name,
    description: r.description,
    language: r.language,
    stars: r.stargazers_count,
    url: r.html_url,
  }));

  return {
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
}

export async function searchGitHub(params: SearchParams): Promise<Candidate[]> {
  const q = encodeURIComponent(buildQuery(params));
  const searchUrl = `${BASE}/search/users?q=${q}&per_page=12&sort=followers`;
  const searchResult = await fetchJson<GHUserSearch>(searchUrl);

  // Enrich top results (cap at 8 to stay within rate limits)
  const logins = searchResult.items.slice(0, 8).map((u) => u.login);
  const enriched = await Promise.allSettled(logins.map(enrichUser));

  return enriched
    .filter((r): r is PromiseFulfilledResult<{ user: GHUser; repos: GHRepo[] }> => r.status === "fulfilled")
    .map((r) => toCandidate(r.value.user, r.value.repos));
}
