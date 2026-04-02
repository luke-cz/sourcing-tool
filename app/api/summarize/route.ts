import { NextRequest, NextResponse } from "next/server";
import type { Candidate } from "@/lib/types";
import { generateSummary } from "@/lib/summarizer";

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 503 });
  }

  const body = await req.json();
  const { candidate, mustHaves, background, minYears } = body as {
    candidate: Candidate;
    mustHaves?: string[];
    background?: string;
    minYears?: number | null;
  };

  if (!candidate?.id) {
    return NextResponse.json({ error: "candidate is required" }, { status: 400 });
  }

  try {
    const summary = await generateSummary(candidate, { mustHaves, background, minYears });
    return NextResponse.json({ summary });
  } catch (err) {
    console.error("[summarize] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate summary" },
      { status: 500 }
    );
  }
}
