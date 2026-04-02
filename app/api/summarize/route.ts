import { NextRequest, NextResponse } from "next/server";
import type { Candidate } from "@/lib/types";
import { generateSummary } from "@/lib/summarizer";

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 503 });
  }

  let candidate: Candidate;
  try {
    candidate = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!candidate?.id) {
    return NextResponse.json({ error: "candidate.id is required" }, { status: 400 });
  }

  try {
    const summary = await generateSummary(candidate);
    return NextResponse.json({ summary });
  } catch (err) {
    console.error("[summarize] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate summary" },
      { status: 500 }
    );
  }
}
