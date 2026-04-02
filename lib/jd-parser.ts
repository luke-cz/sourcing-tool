import Anthropic from "@anthropic-ai/sdk";
import type { ParsedJD } from "@/lib/types";

const client = new Anthropic();

export async function parseJobDescription(
  jobSpec: string,
  background?: string
): Promise<ParsedJD> {
  const contextLine = background ? `Industry context: ${background}\n\n` : "";

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content: `${contextLine}Extract requirements from this job description. Return ONLY valid JSON, no explanation.

Format:
{
  "mustHaves": ["requirement 1", "requirement 2", ...],
  "niceToHaves": ["requirement 1", "requirement 2", ...],
  "searchQuery": "concise search string for finding matching candidates on GitHub/LinkedIn"
}

Rules:
- mustHaves: hard requirements, "required", "must have", "essential", minimum qualifications
- niceToHaves: "preferred", "nice to have", "bonus", "plus", "ideally"
- If not clearly categorized, lean toward mustHaves
- searchQuery: 3-5 specific technical keywords only, space-separated, NO boolean operators like AND/OR (e.g. "rust trading risk engine", "quant hft market-making"). No generic words like "developer", "engineer", "lead", "senior". Think about what this person would actually build or have in their GitHub repos/bio
- Keep each requirement short (under 10 words)
- Max 8 mustHaves, max 6 niceToHaves

Job description:
${jobSpec.slice(0, 3000)}`,
      },
    ],
  });

  const block = message.content[0];
  if (block.type !== "text") throw new Error("Unexpected response");

  // Extract JSON from the response (handle markdown code blocks if present)
  const jsonMatch = block.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in response");

  const parsed = JSON.parse(jsonMatch[0]) as ParsedJD;
  return parsed;
}
