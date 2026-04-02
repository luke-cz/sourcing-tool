import { NextRequest, NextResponse } from "next/server";
import { parseJobDescription } from "@/lib/jd-parser";

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not set" }, { status: 503 });
  }

  const { jobSpec, background } = await req.json();

  if (!jobSpec || typeof jobSpec !== "string" || !jobSpec.trim()) {
    return NextResponse.json({ error: "jobSpec is required" }, { status: 400 });
  }

  try {
    const result = await parseJobDescription(jobSpec.trim(), background?.trim());
    return NextResponse.json(result);
  } catch (err) {
    console.error("[parse-jd] error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to parse job description" },
      { status: 500 }
    );
  }
}
