export type Source = "github" | "linkedin" | "stackoverflow" | "cv";

export type TierLevel = 1 | 2 | null;

export type TierCategory =
  | "faang"
  | "hft_quant"
  | "big_tech"
  | "top_ai"
  | "top_fintech"
  | "web3"
  | "strong_startups"
  | "crypto_hft";

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

// ─── Location ─────────────────────────────────────────────────────────────
export type WorldRegion =
  | "global"
  | "north_america"
  | "south_america"
  | "europe"
  | "asia_pacific"
  | "middle_east"
  | "africa";

export interface LocationConfig {
  regions: WorldRegion[];  // empty = global (no filter); multiple = union of all selected
  countries: string[];     // optional — specific countries within selected regions
  cities: string[];        // optional — specific cities within countries/regions
}

export interface SearchSettings {
  tierCategories: TierCategory[];           // which tier groups are active
  tierMap: Record<TierCategory, TierLevel>; // which tier level each group maps to
  minYears: number | null;                  // minimum years of experience
  locationConfig: LocationConfig;           // region + optional countries/cities
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
  location?: string;          // derived at runtime from locationConfig
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

// ─── CV Library ────────────────────────────────────────────────────────────
export interface ExperienceEntry {
  title: string;
  company: string;
  duration: string | null;
  description: string | null;
}

export interface ParsedCV {
  name: string | null;
  headline: string | null;
  location: string | null;
  email: string | null;
  skills: string[];
  experience: ExperienceEntry[];
  education: string[];
  languages: string[];
  summary: string | null;
  rawText: string;
}

export interface CVLibraryEntry {
  id: string;
  fileName: string;
  uploadedAt: string;   // ISO date
  parsed: ParsedCV;
}

export interface CVMatch {
  cvId: string;
  score: number;          // 0–100
  strengths: string[];
  gaps: string[];
  summary: string;
}

export interface CandidateNote {
  candidateId: string;
  text: string;
  updatedAt: string;      // ISO date
}
