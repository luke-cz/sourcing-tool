export type Source = "github" | "linkedin" | "stackoverflow";

export type TierLevel = 1 | 2 | null;

export interface Repo {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  url: string;
}

export interface ParsedJD {
  mustHaves: string[];
  niceToHaves: string[];
  searchQuery: string;
}

export interface Candidate {
  id: string;
  source: Source;
  name: string | null;
  username: string;
  avatarUrl: string | null;
  profileUrl: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  company: string | null;
  openToWork: boolean | null;
  languages: string[];
  topRepos: Repo[];
  followers: number | null;
  rawText: string | null;
  summary: string | null;
  tier: TierLevel;
}

export interface SearchParams {
  query: string;
  sources: Source[];
  location?: string;
  language?: string;
  background?: string;
  mustHaves?: string[];
  niceToHaves?: string[];
}

export interface SearchResponse {
  candidates: Candidate[];
  errors: { source: Source; message: string }[];
}
