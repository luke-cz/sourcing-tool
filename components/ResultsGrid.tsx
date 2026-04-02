"use client";

import type { Candidate, Source, SearchResponse } from "@/lib/types";
import { CandidateCard } from "@/components/CandidateCard";

interface Props {
  response: SearchResponse;
}

const SOURCE_LABELS: Record<Source, string> = {
  github: "GitHub",
  hackernews: "HackerNews",
  stackoverflow: "Stack Overflow",
  linkedin: "LinkedIn",
};

export function ResultsGrid({ response }: Props) {
  const { candidates, errors } = response;

  if (candidates.length === 0 && errors.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg">No candidates found.</p>
        <p className="text-sm mt-1">Try broader search terms or enable more sources.</p>
      </div>
    );
  }

  // Count per source
  const countsBySource = candidates.reduce<Partial<Record<Source, number>>>((acc, c) => {
    acc[c.source] = (acc[c.source] ?? 0) + 1;
    return acc;
  }, {});

  const sourceSummary = (Object.entries(countsBySource) as [Source, number][])
    .map(([s, n]) => `${SOURCE_LABELS[s]} (${n})`)
    .join(" · ");

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          <strong className="text-gray-900">{candidates.length}</strong> candidates found
          {sourceSummary && <span className="ml-2 text-gray-400">— {sourceSummary}</span>}
        </span>
      </div>

      {/* Source errors */}
      {errors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {errors.map((err) => (
            <span
              key={err.source}
              className="text-xs bg-red-50 text-red-600 border border-red-100 rounded-md px-2 py-1"
              title={err.message}
            >
              {SOURCE_LABELS[err.source]} unavailable
            </span>
          ))}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {candidates.map((candidate) => (
          <CandidateCard key={candidate.id} candidate={candidate} />
        ))}
      </div>
    </div>
  );
}
