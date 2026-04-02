export type Source = "github" | "linkedin" | "stackoverflow";

export type TierLevel = 1 | 2 | null;

export type TierCategory =
  | "faang"
  | "hft_quant"
  | "big_tech"
  | "top_ai"
  | "top_fintech"
  | "web3"
  | "strong_startups";

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

export interface SearchSettings {
  tierCategories: TierCategory[];         // which tier groups are active
  tierMap: Record<TierCategory, TierLevel>; // which tier level each group maps to
  minYears: number | null;                // minimum years of experience
  location2: string;                      // second optional location
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
  tierCategory: TierCategory | null;
}

export interface SearchParams {
  query: string;
  sources: Source[];
  location?: string;
  location2?: string;
  language?: string;
  background?: string;
  mustHaves?: string[];
  niceToHaves?: string[];
  minYears?: number | null;
  settings?: SearchSettings;
}

export interface SearchResponse {
  candidates: Candidate[];
  errors: { source: Source; message: string }[];
}
