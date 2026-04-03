import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { ParsedCV } from "@/lib/types";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 503 });
  }

  const body = await req.json();
  const { pdf } = body as { pdf: string }; // base64-encoded PDF

  if (!pdf) {
    return NextResponse.json({ error: "pdf (base64) is required" }, { status: 400 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const message = await (client.messages.create as any)({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: pdf,
              },
            },
            {
              type: "text",
              text: `Parse this CV/resume and extract structured information. Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "name": "Full name or null",
  "headline": "Current role/title or null",
  "location": "City, Country or null",
  "email": "email@example.com or null",
  "skills": ["skill1", "skill2"],
  "experience": [
    { "title": "Job title", "company": "Company name", "duration": "2020–2023 or null", "description": "Brief summary or null" }
  ],
  "education": ["BSc Computer Science, University Name, 2018"],
  "languages": ["Python", "JavaScript"],
  "summary": "2-3 sentence professional summary based on the CV content",
  "rawText": "First 500 chars of the CV text for reference"
}`,
            },
          ],
        },
      ],
    });

    const block = message.content[0];
    if (block.type !== "text") throw new Error("Unexpected response type");

    let parsed: ParsedCV;
    try {
      // Strip markdown code fences if Claude wraps with them
      const clean = block.text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
      parsed = JSON.parse(clean);
    } catch {
      throw new Error("Claude returned invalid JSON");
    }

    return NextResponse.json({ parsed });
  } catch (err) {
    console.error("[parse-cv] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to parse CV" },
      { status: 500 }
    );
  }
}
