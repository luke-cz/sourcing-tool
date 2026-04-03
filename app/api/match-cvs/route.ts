import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { CVLibraryEntry, CVMatch } from "@/lib/types";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 503 });
  }

  const body = await req.json();
  const { cvs, mustHaves, niceToHaves, background } = body as {
    cvs: CVLibraryEntry[];
    mustHaves?: string[];
    niceToHaves?: string[];
    background?: string;
  };

  if (!cvs?.length) {
    return NextResponse.json({ matches: [] });
  }

  // Build a compact representation of each CV for the prompt
  const cvSummaries = cvs.map((entry, i) => {
    const p = entry.parsed;
    const expLines = p.experience
      .slice(0, 4)
      .map((e) => `  - ${e.title} at ${e.company}${e.duration ? ` (${e.duration})` : ""}${e.description ? `: ${e.description.slice(0, 100)}` : ""}`)
      .join("\n");
    return `CV ${i + 1} [id: ${entry.id}]
Name: ${p.name ?? entry.fileName}
Headline: ${p.headline ?? "N/A"}
Skills: ${p.skills.slice(0, 20).join(", ") || "N/A"}
Experience:
${expLines || "  N/A"}
Education: ${p.education.join(", ") || "N/A"}`;
  }).join("\n\n---\n\n");

  const mustLine = mustHaves?.length ? `Must-haves: ${mustHaves.join(", ")}` : "";
  const niceLines = niceToHaves?.length ? `Nice-to-haves: ${niceToHaves.join(", ")}` : "";
  const bgLine = background ? `Role context: ${background}` : "";

  const prompt = `You are a senior technical recruiter. Evaluate the following CVs against the job requirements.

${bgLine}
${mustLine}
${niceLines}

CVs to evaluate:

${cvSummaries}

For each CV, provide a match score (0–100), up to 3 key strengths, up to 2 gaps vs requirements, and a 1-sentence summary.

Return ONLY a JSON array (no markdown, no explanation):
[
  {
    "cvId": "the id value from the CV entry",
    "score": 85,
    "strengths": ["5 years React Native experience", "worked at top fintech"],
    "gaps": ["no TypeScript mentioned"],
    "summary": "Strong React Native engineer with fintech background, well-aligned with the role."
  }
]`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const block = message.content[0];
    if (block.type !== "text") throw new Error("Unexpected response type");

    let matches: CVMatch[];
    try {
      const clean = block.text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
      matches = JSON.parse(clean);
    } catch {
      throw new Error("Claude returned invalid JSON");
    }

    // Sort by score descending
    matches.sort((a, b) => b.score - a.score);

    return NextResponse.json({ matches });
  } catch (err) {
    console.error("[match-cvs] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to match CVs" },
      { status: 500 }
    );
  }
}
