import type { Candidate, SearchParams } from "@/lib/types";
import { detectTierWithCategory } from "@/lib/tiers";

const BASE = "https://api.stackexchange.com/2.3";

interface SOUser {
  user_id: number;
  display_name: string;
  link: string;
  profile_image: string;
  location?: string;
  reputation: number;
  accept_rate?: number;
  about_me?: string;
}

interface SOResponse {
  items: SOUser[];
}

function buildUrl(params: SearchParams): string {
  const key = process.env.STACKEXCHANGE_API_KEY;
  let url = `${BASE}/users?order=desc&sort=reputation&inname=${encodeURIComponent(
    params.query
  )}&site=stackoverflow&pagesize=10&filter=!*236eb_eL9oretn-`;

  if (params.location) {
    // Stack Exchange API doesn't support location filter directly,
    // but we can append it to the name search as a workaround
  }
  if (key) url += `&key=${key}`;
  return url;
}

export async function searchStackOverflow(params: SearchParams): Promise<Candidate[]> {
  const url = buildUrl(params);
  const res = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) return [];

  const data = (await res.json()) as SOResponse;

  return data.items.map((user): Candidate => {
    const base: Omit<Candidate, "tier" | "tierCategory"> = {
      id: `stackoverflow:${user.user_id}`,
      source: "stackoverflow",
      name: user.display_name,
      username: user.display_name,
      avatarUrl: user.profile_image ?? null,
      profileUrl: user.link,
      headline: `Reputation: ${user.reputation.toLocaleString()}`,
      bio: user.about_me ? stripHtml(user.about_me).slice(0, 300) : null,
      location: user.location ?? null,
      company: null,
      openToWork: null,
      languages: [],
      topRepos: [],
      followers: null,
      rawText: null,
      summary: null,
    };
    const { tier, category } = detectTierWithCategory(base);
    return { ...base, tier, tierCategory: category };
  });
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
