import Anthropic from "@anthropic-ai/sdk";
import type { Candidate } from "@/lib/types";

const client = new Anthropic();

function buildPrompt(candidate: Candidate): string {
  const lines: string[] = [];

  lines.push(`Source: ${candidate.source}`);
  if (candidate.name) lines.push(`Name: ${candidate.name}`);
  if (candidate.username) lines.push(`Username: ${candidate.username}`);
  if (candidate.headline) lines.push(`Headline: ${candidate.headline}`);
  if (candidate.bio) lines.push(`Bio: ${candidate.bio}`);
  if (candidate.location) lines.push(`Location: ${candidate.location}`);
  if (candidate.company) lines.push(`Company: ${candidate.company}`);
  if (candidate.openToWork !== null) lines.push(`Open to work: ${candidate.openToWork ? "Yes" : "No"}`);
  if (candidate.languages.length) lines.push(`Languages/Skills: ${candidate.languages.join(", ")}`);
  if (candidate.followers !== null) lines.push(`Followers: ${candidate.followers}`);

  if (candidate.topRepos.length) {
    lines.push("Top repositories:");
    candidate.topRepos.forEach((r) => {
      const parts = [`  - ${r.name}`];
      if (r.description) parts.push(r.description);
      if (r.language) parts.push(`(${r.language})`);
      if (r.stars) parts.push(`★${r.stars}`);
      lines.push(parts.join(" "));
    });
  }

  if (candidate.rawText) {
    lines.push(`Raw profile text:\n${candidate.rawText.slice(0, 800)}`);
  }

  return lines.join("\n");
}

export async function generateSummary(candidate: Candidate): Promise<string> {
  const profileData = buildPrompt(candidate);

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 150,
    messages: [
      {
        role: "user",
        content: `You are a recruiter's assistant. Given the following public profile data, write a 2-3 sentence professional summary. Focus on: (1) what they build / main technical focus, (2) experience signals, (3) any notable signals like open to work or location. Be factual and concise. Do not invent information not present in the data.

Profile data:
${profileData}`,
      },
    ],
  });

  const block = message.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type");
  return block.text;
}
