"use client";

import type { Candidate, Source, SearchResponse } from "@/lib/types";
import { CandidateCard } from "@/components/CandidateCard";

interface Props {
  response: SearchResponse;
  mustHaves?: string[];
  background?: string;
  minYears?: number | null;
}

const SOURCE_LABELS: Record<Source, string> = {
  github: "GitHub",
  stackoverflow: "Stack Overflow",
  linkedin: "LinkedIn",
};

export function ResultsGrid({ response, mustHaves, background, minYears }: Props) {
  const { candidates, errors } = response;

  if (candidates.length === 0 && errors.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg">No candidates found.</p>
        <p className="text-sm mt-1">Try broader search terms or enable more sources.</p>
      </div>
    );
  }

  const countsBySource = candidates.reduce<Partial<Record<Source, number>>>((acc, c) => {
    acc[c.source] = (acc[c.source] ?? 0) + 1;
    return acc;
  }, {});

  const tier1Count = candidates.filter((c) => c.tier === 1).length;
  const tier2Count = candidates.filter((c) => c.tier === 2).length;

  const sourceSummary = (Object.entries(countsBySource) as [Source, number][])
    .map(([s, n]) => `${SOURCE_LABELS[s]} (${n})`)
    .join(" · ");

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex items-center flex-wrap gap-3 text-sm text-gray-500">
        <span>
          <strong className="text-gray-900">{candidates.length}</strong> candidates
          {sourceSummary && <span className="ml-2 text-gray-400">— {sourceSummary}</span>}
        </span>
        {(tier1Count > 0 || tier2Count > 0) && (
          <span className="flex items-center gap-2 ml-auto">
            {tier1Count > 0 && (
              <span className="text-xs bg-amber-50 text-amber-800 border border-amber-300 rounded-full px-2.5 py-0.5 font-semibold">
                {tier1Count} × Tier 1
              </span>
            )}
            {tier2Count > 0 && (
              <span className="text-xs bg-slate-50 text-slate-700 border border-slate-300 rounded-full px-2.5 py-0.5 font-semibold">
                {tier2Count} × Tier 2
              </span>
            )}
          </span>
        )}
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
          <CandidateCard
            key={candidate.id}
            candidate={candidate}
            mustHaves={mustHaves}
            background={background}
            minYears={minYears}
          />
        ))}
      </div>
    </div>
  );
}
