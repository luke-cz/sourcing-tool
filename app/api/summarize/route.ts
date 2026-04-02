import { NextRequest, NextResponse } from "next/server";
import type { Candidate } from "@/lib/types";
import { generateSummary } from "@/lib/summarizer";

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 503 });
  }

  const body = await req.json();
  const { candidate, mustHaves, background } = body as {
    candidate: Candidate;
    mustHaves?: string[];
    background?: string;
  };

  if (!candidate?.id) {
    return NextResponse.json({ error: "candidate is required" }, { status: 400 });
  }

  try {
    const summary = await generateSummary(candidate, { mustHaves, background });
    return NextResponse.json({ summary });
  } catch (err) {
    console.error("[summarize] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate summary" },
      { status: 500 }
    );
  }
}
