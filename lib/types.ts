export type Source = "github" | "linkedin" | "hackernews" | "stackoverflow";

export interface Repo {
  name: string;
  description: string | null;
  language: string | null;
  stars: number;
  url: string;
}

export interface Candidate {
  id: string; // unique: "{source}:{username or identifier}"
  source: Source;
  name: string | null;
  username: string;
  avatarUrl: string | null;
  profileUrl: string;
  headline: string | null; // job title / bio first line
  bio: string | null;
  location: string | null;
  company: string | null;
  openToWork: boolean | null; // null = unknown
  languages: string[];
  topRepos: Repo[];
  followers: number | null;
  // HN-specific: raw comment text from "Who wants to be hired"
  rawText: string | null;
  // filled in async by /api/summarize
  summary: string | null;
}

export interface SearchParams {
  query: string;
  sources: Source[];
  location?: string;
  language?: string;
}

export interface SearchResponse {
  candidates: Candidate[];
  errors: { source: Source; message: string }[];
}
